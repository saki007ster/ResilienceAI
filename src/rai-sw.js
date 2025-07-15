/**
 * Resilience AI Custom Service Worker
 * Extends Angular's default service worker with advanced model caching capabilities
 */

// Import the Angular service worker
importScripts('./ngsw-worker.js');

const MODEL_CACHE_NAME = 'rai-model-v1';
const MODEL_URL = '/assets/gemma-model.bin';
const MODEL_SIZE = 529 * 1024 * 1024; // ~529MB

console.log('[RAI Service Worker] Custom service worker loaded');

/**
 * Check if the model is cached
 */
async function isModelCached() {
  try {
    const cache = await caches.open(MODEL_CACHE_NAME);
    const response = await cache.match(MODEL_URL);
    return !!response;
  } catch (error) {
    console.error('[RAI Service Worker] Error checking model cache:', error);
    return false;
  }
}

/**
 * Handle model download request
 */
async function handleModelRequest(request) {
  const cached = await isModelCached();
  
  if (cached) {
    console.log('[RAI Service Worker] Serving model from cache');
    const cache = await caches.open(MODEL_CACHE_NAME);
    return cache.match(request);
  }
  
  console.log('[RAI Service Worker] Model not cached, notifying client');
  
  // Notify the client that model needs to be downloaded
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'MODEL_NOT_CACHED',
      message: 'AI model needs to be downloaded'
    });
  });
  
  // Return a response indicating model is not available
  return new Response(JSON.stringify({
    error: 'Model not cached',
    message: 'Please download the AI model first'
  }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Enhanced fetch event handler
 */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle model requests specially
  if (url.pathname === MODEL_URL) {
    event.respondWith(handleModelRequest(event.request));
    return;
  }
  
  // Let Angular service worker handle other requests
  // This will fall through to the imported ngsw-worker.js
});

/**
 * Background Fetch Events
 */
self.addEventListener('backgroundfetch', event => {
  console.log('[RAI Service Worker] Background fetch event:', event.tag);
  
  if (event.tag === 'download-gemma-model') {
    event.waitUntil(handleModelDownload(event));
  }
});

/**
 * Handle model download completion
 */
async function handleModelDownload(event) {
  try {
    console.log('[RAI Service Worker] Processing model download...');
    
    const cache = await caches.open(MODEL_CACHE_NAME);
    const records = await event.registration.matchAll();
    
    for (const record of records) {
      const response = await record.responseReady;
      if (response && response.ok) {
        await cache.put(MODEL_URL, response.clone());
        console.log('[RAI Service Worker] Model cached successfully');
        
        // Notify clients of successful download
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'MODEL_DOWNLOAD_COMPLETE',
            message: 'AI model downloaded and cached successfully'
          });
        });
      } else {
        throw new Error('Download failed or response not ok');
      }
    }
  } catch (error) {
    console.error('[RAI Service Worker] Model download failed:', error);
    
    // Notify clients of download failure
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'MODEL_DOWNLOAD_FAILED',
        message: 'Failed to download AI model',
        error: error.message
      });
    });
  }
}

/**
 * Background Fetch Success Event
 */
self.addEventListener('backgroundfetchsuccess', event => {
  console.log('[RAI Service Worker] Background fetch successful:', event.tag);
  
  if (event.tag === 'download-gemma-model') {
    event.waitUntil(handleModelDownload(event));
  }
});

/**
 * Background Fetch Fail Event
 */
self.addEventListener('backgroundfetchfail', event => {
  console.log('[RAI Service Worker] Background fetch failed:', event.tag);
  
  if (event.tag === 'download-gemma-model') {
    event.waitUntil(handleDownloadFailure(event));
  }
});

/**
 * Handle download failure
 */
async function handleDownloadFailure(event) {
  console.error('[RAI Service Worker] Model download failed completely');
  
  // Notify clients of failure
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'MODEL_DOWNLOAD_FAILED',
      message: 'Model download failed. Please try again.',
      tag: event.tag
    });
  });
}

/**
 * Handle messages from the main app
 */
self.addEventListener('message', event => {
  console.log('[RAI Service Worker] Received message:', event.data);
  
  if (event.data && event.data.type === 'CHECK_MODEL_CACHE') {
    isModelCached().then(cached => {
      event.ports[0].postMessage({ cached });
    });
  }
  
  if (event.data && event.data.type === 'INITIATE_MODEL_DOWNLOAD') {
    initiateModelDownload().then(result => {
      event.ports[0].postMessage(result);
    }).catch(error => {
      event.ports[0].postMessage({ 
        success: false, 
        error: error.message 
      });
    });
  }
});

/**
 * Initiate model download using Background Fetch
 */
async function initiateModelDownload() {
  try {
    console.log('[RAI Service Worker] Initiating model download...');
    
    if (!self.registration.backgroundFetch) {
      throw new Error('Background Fetch API not supported');
    }
    
    const bgFetch = await self.registration.backgroundFetch.fetch(
      'download-gemma-model',
      MODEL_URL,
      {
        title: 'Downloading RAI Intelligence Module',
        icons: [{ 
          sizes: '192x192', 
          src: '/icons/icon-192x192.png', 
          type: 'image/png' 
        }],
        downloadTotal: MODEL_SIZE
      }
    );
    
    console.log('[RAI Service Worker] Background fetch initiated:', bgFetch.id);
    return { success: true, id: bgFetch.id };
    
  } catch (error) {
    console.error('[RAI Service Worker] Failed to initiate download:', error);
    throw error;
  }
}

/**
 * Clean up old model caches
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldModelCaches = cacheNames.filter(name => 
    name.startsWith('rai-model-') && name !== MODEL_CACHE_NAME
  );
  
  await Promise.all(
    oldModelCaches.map(cacheName => caches.delete(cacheName))
  );
  
  console.log('[RAI Service Worker] Cleaned up old model caches:', oldModelCaches);
}

/**
 * Install event - setup
 */
self.addEventListener('install', event => {
  console.log('[RAI Service Worker] Installing...');
  event.waitUntil(cleanupOldCaches());
});

/**
 * Activate event - cleanup
 */
self.addEventListener('activate', event => {
  console.log('[RAI Service Worker] Activating...');
  event.waitUntil(cleanupOldCaches());
}); 