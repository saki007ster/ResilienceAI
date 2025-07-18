import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GoogleAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: GoogleUser;
  error?: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  expires_at: number;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuth {
  private readonly CLIENT_ID = this.getClientId();
  private readonly REDIRECT_URI = `${window.location.origin}/auth/callback`;
  private readonly SCOPE = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
  private readonly AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private readonly USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

  private stateSubject = new BehaviorSubject<GoogleAuthState>({
    isAuthenticated: false,
    isLoading: false
  });

  public state$ = this.stateSubject.asObservable();
  private tokens: GoogleTokens | null = null;
  private codeVerifier: string | null = null;

  constructor() {
    this.initializeAuth();
  }

  /**
   * Get Google Client ID from environment or localStorage
   */
  private getClientId(): string {
    // First try to get from localStorage (for easy configuration during development)
    const storedClientId = localStorage.getItem('google_client_id');
    if (storedClientId && storedClientId !== 'your-google-client-id.apps.googleusercontent.com') {
      return storedClientId;
    }

    // Fallback to placeholder (will show setup instructions)
    return 'your-google-client-id.apps.googleusercontent.com';
  }

  /**
   * Check if Google OAuth is properly configured
   */
  isConfigured(): boolean {
    return this.CLIENT_ID !== 'your-google-client-id.apps.googleusercontent.com';
  }

  /**
   * Set Google Client ID (for development setup)
   */
  setClientId(clientId: string): void {
    localStorage.setItem('google_client_id', clientId);
    // Reload the page to reinitialize with new client ID
    window.location.reload();
  }

  /**
   * Initialize authentication state from stored tokens
   */
  private async initializeAuth(): Promise<void> {
    try {
      console.log('[GoogleAuth] Initializing authentication...');
      const storedTokens = this.getStoredTokens();
      
      if (storedTokens) {
        console.log('[GoogleAuth] Found stored tokens, checking validity...');
        if (this.isTokenValid(storedTokens)) {
          console.log('[GoogleAuth] Tokens are valid, loading user info...');
          this.tokens = storedTokens;
          await this.loadUserInfo();
          console.log('[GoogleAuth] ✅ Authentication restored from stored tokens');
        } else if (storedTokens?.refresh_token) {
          console.log('[GoogleAuth] Tokens expired, refreshing...');
          this.tokens = storedTokens;
          await this.refreshAccessToken();
          console.log('[GoogleAuth] ✅ Authentication restored via token refresh');
        } else {
          console.log('[GoogleAuth] Tokens invalid and no refresh token available (Implicit Flow)');
          console.log('[GoogleAuth] User needs to sign in again');
          this.clearStoredTokens();
        }
      } else {
        console.log('[GoogleAuth] No stored tokens found');
      }
    } catch (error) {
      console.error('[GoogleAuth] Initialization failed:', error);
      this.clearStoredTokens();
      this.updateState({ 
        isAuthenticated: false, 
        isLoading: false, 
        error: 'Authentication initialization failed' 
      });
    }
  }

  /**
   * Start OAuth 2.0 flow with Implicit Flow (for frontend apps)
   */
  async signIn(): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: undefined });

      // Check if OAuth is properly configured
      if (!this.isConfigured()) {
        throw new Error('Google OAuth is not configured. Please set up your Google Cloud Console project and update the client ID.');
      }

      // Generate state for security
      const state = this.generateState();
      
      // Store state parameter
      sessionStorage.setItem('oauth_state', state);

      // Build authorization URL for Implicit Flow
      const authUrl = new URL(this.AUTH_URL);
      authUrl.searchParams.set('client_id', this.CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', this.REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'token'); // Use 'token' instead of 'code' for Implicit Flow
      authUrl.searchParams.set('scope', this.SCOPE);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('include_granted_scopes', 'true');

      console.log('[GoogleAuth] Starting Implicit OAuth flow...');
      console.log('[GoogleAuth] Redirect URI:', this.REDIRECT_URI);

      // Redirect to Google OAuth
      window.location.href = authUrl.toString();

    } catch (error) {
      console.error('[GoogleAuth] Sign-in failed:', error);
      this.updateState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Sign-in failed' 
      });
    }
  }

  /**
   * Handle OAuth callback from redirect (Implicit Flow)
   */
  async handleCallback(url: string): Promise<boolean> {
    try {
      console.log('[GoogleAuth] Handling OAuth callback:', url);
      this.updateState({ isLoading: true, error: undefined });

      // For Implicit Flow, tokens are in the fragment (after #), not query params
      const fragment = new URL(url).hash.substring(1); // Remove the # symbol
      const params = new URLSearchParams(fragment);
      
      const accessToken = params.get('access_token');
      const expiresIn = params.get('expires_in');
      const state = params.get('state');
      const error = params.get('error');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!accessToken || !state) {
        throw new Error('Missing access token or state parameter');
      }

      console.log('[GoogleAuth] Access token received, verifying state...');

      // Verify state parameter
      const storedState = sessionStorage.getItem('oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      // Create token object (Implicit Flow only provides access token, no refresh token)
      const tokens: GoogleTokens = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: parseInt(expiresIn || '3600'),
        expires_at: Date.now() + (parseInt(expiresIn || '3600') * 1000),
        scope: this.SCOPE
      };

      console.log('[GoogleAuth] Storing tokens...');
      this.tokens = tokens;
      this.storeTokens(tokens);
      
      console.log('[GoogleAuth] Loading user info...');
      await this.loadUserInfo();

      // Clean up session storage
      sessionStorage.removeItem('oauth_state');

      console.log('[GoogleAuth] ✅ Authentication successful, redirecting...');
      
      // Redirect to schedule page and clean up URL
      window.history.replaceState({}, document.title, '/schedule');
      
      return true;

    } catch (error) {
      console.error('[GoogleAuth] Callback handling failed:', error);
      this.updateState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      });
      
      // Redirect to schedule page even on error to show error message
      window.history.replaceState({}, document.title, '/schedule');
      
      return false;
    }
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<void> {
    console.log('[GoogleAuth] Exchanging authorization code for tokens...');
    
    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: this.REDIRECT_URI
        // Note: No client_secret needed for public clients (frontend apps)
      })
    });

    console.log('[GoogleAuth] Token exchange response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleAuth] Token exchange error response:', errorText);
      try {
        const error = JSON.parse(errorText);
        throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
      } catch (parseError) {
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
      }
    }

    const tokens: GoogleTokens = await response.json();
    console.log('[GoogleAuth] Received tokens:', { 
      hasAccessToken: !!tokens.access_token, 
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in 
    });
    
    tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
    
    this.tokens = tokens;
    this.storeTokens(tokens);
    console.log('[GoogleAuth] Tokens stored successfully');
  }

  /**
   * Load user information from Google API
   */
  private async loadUserInfo(): Promise<void> {
    if (!this.tokens?.access_token) {
      throw new Error('No access token available');
    }

    console.log('[GoogleAuth] Fetching user info from Google API...');
    const response = await fetch(this.USERINFO_URL, {
      headers: { Authorization: `Bearer ${this.tokens.access_token}` }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleAuth] User info API error:', response.status, errorText);
      throw new Error(`Failed to load user info: ${response.status}`);
    }

    const userInfo = await response.json();
    console.log('[GoogleAuth] User info received:', { id: userInfo.id, email: userInfo.email, name: userInfo.name });
    
    const user: GoogleUser = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    };

    console.log('[GoogleAuth] Updating authentication state...');
    this.updateState({
      isAuthenticated: true,
      isLoading: false,
      user,
      error: undefined
    });
    
    console.log('[GoogleAuth] ✅ User authentication complete');
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    console.log('[GoogleAuth] Refreshing access token...');
    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        refresh_token: this.tokens.refresh_token,
        grant_type: 'refresh_token'
        // Note: No client_secret needed for public clients (frontend apps)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleAuth] Token refresh error:', errorText);
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const newTokens = await response.json();
    console.log('[GoogleAuth] Token refresh successful');
    
    this.tokens = {
      ...this.tokens,
      access_token: newTokens.access_token,
      expires_in: newTokens.expires_in,
      expires_at: Date.now() + (newTokens.expires_in * 1000)
    };

    this.storeTokens(this.tokens);
    await this.loadUserInfo();
  }

  /**
   * Sign out user and clear tokens
   */
  async signOut(): Promise<void> {
    try {
      // Revoke tokens if available
      if (this.tokens?.access_token) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.tokens.access_token}`, {
          method: 'POST'
        });
      }
    } catch (error) {
      console.warn('[GoogleAuth] Token revocation failed:', error);
    }

    this.tokens = null;
    this.clearStoredTokens();
    this.updateState({
      isAuthenticated: false,
      isLoading: false,
      user: undefined,
      error: undefined
    });

    console.log('[GoogleAuth] User signed out');
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.tokens) {
      return null;
    }

    // Check if token needs refresh
    if (this.tokens.expires_at <= Date.now() + 60000) { // Refresh 1 minute before expiry
      try {
        await this.refreshAccessToken();
      } catch (error) {
        console.error('[GoogleAuth] Token refresh failed:', error);
        await this.signOut();
        return null;
      }
    }

    return this.tokens.access_token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.stateSubject.value.isAuthenticated;
  }

  /**
   * Get current user
   */
  getCurrentUser(): GoogleUser | undefined {
    return this.stateSubject.value.user;
  }

  // PKCE and utility methods
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  private isTokenValid(tokens: GoogleTokens): boolean {
    return tokens.expires_at > Date.now() + 60000; // Valid for at least 1 minute
  }

  private storeTokens(tokens: GoogleTokens): void {
    try {
      localStorage.setItem('google_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('[GoogleAuth] Failed to store tokens:', error);
    }
  }

  private getStoredTokens(): GoogleTokens | null {
    try {
      const stored = localStorage.getItem('google_tokens');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('[GoogleAuth] Failed to retrieve tokens:', error);
      return null;
    }
  }

  private clearStoredTokens(): void {
    localStorage.removeItem('google_tokens');
  }

  private updateState(update: Partial<GoogleAuthState>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...update });
  }
}
