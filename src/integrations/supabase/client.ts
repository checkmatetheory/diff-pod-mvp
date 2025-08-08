// Environment-aware Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment detection - temporarily force production for testing
const isDevelopment = false;  // Set to false to use production temporarily
// const isDevelopment = import.meta.env.DEV || 
//                      (typeof window !== 'undefined' && (
//                        window.location.hostname === 'localhost' || 
//                        window.location.hostname === '127.0.0.1' ||
//                        window.location.port === '8080'
//                      ));

// Environment-specific configuration
export const SUPABASE_CONFIG = {
  development: {
    url: "http://127.0.0.1:54321",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
    projectId: "local-project",
    maxFileSize: 15 * 1024 * 1024 * 1024, // 15GB
    storageEndpoint: "http://127.0.0.1:54321/storage/v1/upload/resumable"
  },
  production: {
    url: "https://qzmpuojqcrrlylmnbgrg.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bXB1b2pxY3JybHlsbW5iZ3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzM2NzYsImV4cCI6MjA2NzMwOTY3Nn0.RD0ZY4QEhugee4hKoKyEIOAglcqyVi-D9ZabFAK5f8o",
    projectId: "qzmpuojqcrrlylmnbgrg",
    maxFileSize: 50 * 1024 * 1024 * 1024, // 50GB (Supabase Pro limit)
    storageEndpoint: "https://qzmpuojqcrrlylmnbgrg.supabase.co/storage/v1/upload/resumable"
  }
};

// Get current environment configuration
export const currentConfig = isDevelopment ? SUPABASE_CONFIG.development : SUPABASE_CONFIG.production;

// Create Supabase client with environment-specific settings
export const supabase = createClient<Database>(currentConfig.url, currentConfig.anonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': `diffused-app-${isDevelopment ? 'dev' : 'prod'}`
    }
  }
});

// Export utilities for upload services
export const getStorageConfig = () => ({
  endpoint: currentConfig.storageEndpoint,
  projectId: currentConfig.projectId,
  maxFileSize: currentConfig.maxFileSize,
  environment: isDevelopment ? 'development' : 'production'
});

// Log current configuration for debugging
console.log(`🔧 Supabase Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`📡 Storage Endpoint: ${currentConfig.storageEndpoint}`);
console.log(`💾 Max File Size: ${(currentConfig.maxFileSize / 1024 / 1024 / 1024).toFixed(0)}GB`);
