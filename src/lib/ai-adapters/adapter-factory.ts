// AI Adapter Factory
// Manages different AI providers and provides a unified interface

import { AIProvider, ProviderConfig, SupportedProvider } from '@/types/ai-processing';
import { VizardAdapter } from './vizard-adapter';

// Registry of available adapters
const ADAPTER_REGISTRY: Record<SupportedProvider, typeof VizardAdapter> = {
  vizard: VizardAdapter,
  runway: VizardAdapter, // Placeholder - would implement RunwayAdapter
  openai: VizardAdapter, // Placeholder - would implement OpenAIAdapter
  custom: VizardAdapter  // Placeholder - would implement CustomAdapter
};

// Provider configurations (in real app, these would come from environment/database)
const DEFAULT_CONFIGS: Record<SupportedProvider, Partial<ProviderConfig>> = {
  vizard: {
    baseUrl: 'https://elb-api.vizard.ai',
    timeout: 30000,
    retries: 3
  },
  runway: {
    baseUrl: 'https://api.runway.com',
    timeout: 45000,
    retries: 2
  },
  openai: {
    baseUrl: 'https://api.openai.com',
    timeout: 60000,
    retries: 3
  },
  custom: {
    timeout: 30000,
    retries: 3
  }
};

export class AIAdapterFactory {
  private static instances: Map<string, AIProvider> = new Map();
  private static currentProvider: SupportedProvider = 'vizard';
  
  /**
   * Create or get an AI adapter instance
   */
  static getAdapter(
    provider: SupportedProvider = this.currentProvider,
    config?: Partial<ProviderConfig>
  ): AIProvider {
    const instanceKey = `${provider}_${JSON.stringify(config || {})}`;
    
    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey)!;
    }
    
    const AdapterClass = ADAPTER_REGISTRY[provider];
    if (!AdapterClass) {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
    
    // Merge default config with provided config
    const fullConfig: ProviderConfig = {
      ...DEFAULT_CONFIGS[provider],
      ...config,
      apiKey: config?.apiKey || this.getApiKeyFromEnv(provider)
    } as ProviderConfig;
    
    const adapter = new AdapterClass(fullConfig);
    this.instances.set(instanceKey, adapter);
    
    return adapter;
  }
  
  /**
   * Get the current default provider
   */
  static getCurrentProvider(): SupportedProvider {
    return this.currentProvider;
  }
  
  /**
   * Set the default provider for the application
   */
  static setCurrentProvider(provider: SupportedProvider): void {
    if (!ADAPTER_REGISTRY[provider]) {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
    this.currentProvider = provider;
  }
  
  /**
   * Get all available providers
   */
  static getAvailableProviders(): SupportedProvider[] {
    return Object.keys(ADAPTER_REGISTRY) as SupportedProvider[];
  }
  
  /**
   * Test if a provider is available and configured
   */
  static async testProvider(provider: SupportedProvider, config?: Partial<ProviderConfig>): Promise<boolean> {
    try {
      const adapter = this.getAdapter(provider, config);
      return await adapter.healthCheck();
    } catch (error) {
      console.error(`Provider ${provider} test failed:`, error);
      return false;
    }
  }
  
  /**
   * Get provider capabilities for comparison
   */
  static getProviderCapabilities(provider: SupportedProvider) {
    const adapter = this.getAdapter(provider);
    return (adapter as any).getCapabilities?.() || null;
  }
  
  /**
   * Clear all cached adapter instances
   */
  static clearCache(): void {
    this.instances.clear();
  }
  
  /**
   * Switch provider with validation
   */
  static async switchProvider(
    newProvider: SupportedProvider,
    config?: Partial<ProviderConfig>
  ): Promise<boolean> {
    try {
      // Test the new provider first
      const isAvailable = await this.testProvider(newProvider, config);
      if (!isAvailable) {
        throw new Error(`Provider ${newProvider} is not available or misconfigured`);
      }
      
      // If test passes, switch to the new provider
      this.setCurrentProvider(newProvider);
      console.log(`Successfully switched to AI provider: ${newProvider}`);
      return true;
      
    } catch (error) {
      console.error(`Failed to switch to provider ${newProvider}:`, error);
      return false;
    }
  }
  
  /**
   * Get provider-specific configuration requirements
   */
  static getProviderConfigRequirements(provider: SupportedProvider): string[] {
    switch (provider) {
      case 'vizard':
        return ['apiKey'];
      case 'runway':
        return ['apiKey', 'baseUrl'];
      case 'openai':
        return ['apiKey'];
      case 'custom':
        return ['apiKey', 'baseUrl'];
      default:
        return ['apiKey'];
    }
  }
  
  // Private helper methods
  
  private static getApiKeyFromEnv(provider: SupportedProvider): string {
    const envVarMap: Record<SupportedProvider, string> = {
      vizard: 'VIZARD_API_KEY',
      runway: 'RUNWAY_API_KEY',
      openai: 'OPENAI_API_KEY',
      custom: 'CUSTOM_AI_API_KEY'
    };
    
    const envVar = envVarMap[provider];
    const apiKey = process.env[envVar];
    
    if (!apiKey) {
      throw new Error(`Missing environment variable: ${envVar} for provider: ${provider}`);
    }
    
    return apiKey;
  }
}

// Convenience function for getting the default adapter
export const getDefaultAIAdapter = (): AIProvider => {
  return AIAdapterFactory.getAdapter();
};

// Export types for convenience
export type { AIProvider, SupportedProvider, ProviderConfig } from '@/types/ai-processing'; 