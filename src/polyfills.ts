/**
 * Polyfills for Node.js dependencies in browser environment
 * Required for Transformers.js compatibility
 */

// Polyfill for fs module
(globalThis as any).fs = {
  readFileSync: () => {
    throw new Error('fs.readFileSync is not available in browser');
  },
  existsSync: () => false,
  mkdirSync: () => {
    throw new Error('fs.mkdirSync is not available in browser');
  }
};

// Polyfill for path module
(globalThis as any).path = {
  join: (...args: string[]) => args.join('/'),
  resolve: (...args: string[]) => args.join('/'),
  dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
  basename: (path: string) => path.split('/').pop() || '',
  extname: (path: string) => {
    const parts = path.split('.');
    return parts.length > 1 ? '.' + parts.pop() : '';
  }
};

// Polyfill for util module
(globalThis as any).util = {
  promisify: (fn: Function) => fn
};

// Polyfill for stream module
(globalThis as any).stream = {
  Readable: class {},
  Writable: class {},
  Transform: class {}
};

// Polyfill for events module
(globalThis as any).events = {
  EventEmitter: class {
    on() {}
    emit() {}
    removeListener() {}
  }
};

// Polyfill for os module
(globalThis as any).os = {
  platform: () => 'browser',
  arch: () => 'x64',
  cpus: () => [],
  freemem: () => 0,
  totalmem: () => 0
};

// Polyfill for child_process module
(globalThis as any).child_process = {
  spawn: () => {
    throw new Error('child_process.spawn is not available in browser');
  },
  spawnSync: () => {
    throw new Error('child_process.spawnSync is not available in browser');
  }
}; 