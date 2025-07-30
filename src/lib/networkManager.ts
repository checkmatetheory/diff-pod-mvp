/**
 * Network Manager for Smart Upload Retry Logic
 * Handles network detection, connectivity monitoring, and intelligent retry strategies
 */

interface NetworkStatus {
  online: boolean;
  connectionType: string;
  downlink: number;
  rtt: number;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
}

interface RetryContext {
  attempt: number;
  totalAttempts: number;
  lastError: Error;
  startTime: number;
  networkStatus: NetworkStatus;
}

type RetryStrategy = 'exponential' | 'linear' | 'fixed' | 'adaptive';

class NetworkManager {
  private networkStatus: NetworkStatus;
  private connectionChangeHandlers: ((status: NetworkStatus) => void)[] = [];
  private retryConfigs: Map<string, RetryConfig> = new Map();
  private activeRetries: Map<string, AbortController> = new Map();

  constructor() {
    this.networkStatus = this.getCurrentNetworkStatus();
    this.setupNetworkMonitoring();
    this.initializeRetryConfigs();
  }

  private getCurrentNetworkStatus(): NetworkStatus {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    return {
      online: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 100,
      effectiveType: connection?.effectiveType || '4g'
    };
  }

  private setupNetworkMonitoring(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.networkStatus.online = true;
      this.notifyConnectionChange();
    });

    window.addEventListener('offline', () => {
      this.networkStatus.online = false;
      this.notifyConnectionChange();
    });

    // Connection quality monitoring
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.networkStatus = this.getCurrentNetworkStatus();
        this.notifyConnectionChange();
      });
    }

    // Periodic connectivity test
    this.startConnectivityTests();
  }

  private startConnectivityTests(): void {
    setInterval(async () => {
      if (!navigator.onLine) return;

      try {
        const start = Date.now();
        const response = await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        });
        
        const rtt = Date.now() - start;
        
        if (response.ok) {
          this.networkStatus.online = true;
          this.networkStatus.rtt = Math.min(this.networkStatus.rtt, rtt);
        }
      } catch (error) {
        console.warn('Connectivity test failed:', error);
        this.networkStatus.online = false;
      }

      this.notifyConnectionChange();
    }, 30000); // Test every 30 seconds
  }

  private initializeRetryConfigs(): void {
    // Default configurations for different scenarios
    this.retryConfigs.set('upload', {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true
    });

    this.retryConfigs.set('api', {
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 10000,
      backoffFactor: 1.5,
      jitter: true
    });

    this.retryConfigs.set('critical', {
      maxRetries: 10,
      baseDelay: 2000,
      maxDelay: 60000,
      backoffFactor: 2.5,
      jitter: true
    });
  }

  private notifyConnectionChange(): void {
    this.connectionChangeHandlers.forEach(handler => {
      try {
        handler(this.networkStatus);
      } catch (error) {
        console.error('Error in connection change handler:', error);
      }
    });
  }

  // Public API
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  isOnline(): boolean {
    return this.networkStatus.online;
  }

  getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!this.networkStatus.online) return 'poor';
    
    const { effectiveType, downlink, rtt } = this.networkStatus;
    
    if (effectiveType === '4g' && downlink > 5 && rtt < 100) return 'excellent';
    if (effectiveType === '4g' && downlink > 2 && rtt < 200) return 'good';
    if (effectiveType === '3g' || (downlink > 0.5 && rtt < 500)) return 'fair';
    
    return 'poor';
  }

  onConnectionChange(handler: (status: NetworkStatus) => void): () => void {
    this.connectionChangeHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionChangeHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionChangeHandlers.splice(index, 1);
      }
    };
  }

  calculateRetryDelay(
    attempt: number, 
    strategy: RetryStrategy = 'adaptive',
    configKey: string = 'upload'
  ): number {
    const config = this.retryConfigs.get(configKey) || this.retryConfigs.get('upload')!;
    const quality = this.getConnectionQuality();
    
    let delay: number;

    switch (strategy) {
      case 'exponential':
        delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt),
          config.maxDelay
        );
        break;

      case 'linear':
        delay = Math.min(
          config.baseDelay + (attempt * 1000),
          config.maxDelay
        );
        break;

      case 'fixed':
        delay = config.baseDelay;
        break;

      case 'adaptive':
      default:
        // Adaptive strategy based on network quality
        const qualityMultiplier = {
          excellent: 1,
          good: 1.5,
          fair: 2,
          poor: 3
        }[quality];

        delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt) * qualityMultiplier,
          config.maxDelay
        );
        break;
    }

    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay + (Math.random() * 1000);
    }

    return Math.floor(delay);
  }

  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: {
      configKey?: string;
      strategy?: RetryStrategy;
      context?: Partial<RetryContext>;
      onRetry?: (context: RetryContext) => void;
      shouldRetry?: (error: Error, context: RetryContext) => boolean;
      abortSignal?: AbortSignal;
    } = {}
  ): Promise<T> {
    const {
      configKey = 'upload',
      strategy = 'adaptive',
      context = {},
      onRetry,
      shouldRetry,
      abortSignal
    } = options;

    const config = this.retryConfigs.get(configKey) || this.retryConfigs.get('upload')!;
    const retryId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let attempt = 0;
    let lastError: Error;

    // Setup abort handling
    const abortController = new AbortController();
    this.activeRetries.set(retryId, abortController);

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        abortController.abort();
        this.activeRetries.delete(retryId);
      });
    }

    try {
      while (attempt <= config.maxRetries) {
        // Check if operation was aborted
        if (abortController.signal.aborted) {
          throw new Error('Operation aborted');
        }

        try {
          const result = await operation();
          this.activeRetries.delete(retryId);
          return result;
        } catch (error) {
          lastError = error as Error;
          attempt++;

          const retryContext: RetryContext = {
            attempt,
            totalAttempts: config.maxRetries + 1,
            lastError,
            startTime: context.startTime || Date.now(),
            networkStatus: this.getNetworkStatus(),
            ...context
          };

          // Check if we should retry
          if (attempt > config.maxRetries) {
            break;
          }

          // Custom retry logic
          if (shouldRetry && !shouldRetry(lastError, retryContext)) {
            break;
          }

          // Don't retry on certain errors
          if (this.isNonRetryableError(lastError)) {
            break;
          }

          // Wait for network to come back online
          if (!this.networkStatus.online) {
            await this.waitForConnection();
            continue; // Don't count network outage as retry attempt
          }

          // Call retry callback
          if (onRetry) {
            onRetry(retryContext);
          }

          // Calculate and apply delay
          const delay = this.calculateRetryDelay(attempt - 1, strategy, configKey);
          console.log(`🔄 Retrying operation (attempt ${attempt}/${config.maxRetries + 1}) after ${delay}ms delay`);
          
          await this.delay(delay);
        }
      }

      this.activeRetries.delete(retryId);
      throw lastError!;
    } catch (error) {
      this.activeRetries.delete(retryId);
      throw error;
    }
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const nonRetryablePatterns = [
      'unauthorized',
      'forbidden',
      'not found',
      'bad request',
      'invalid',
      'malformed',
      'too large',
      'unsupported'
    ];

    return nonRetryablePatterns.some(pattern => message.includes(pattern));
  }

  private async waitForConnection(timeout: number = 60000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Network connection timeout'));
      }, timeout);

      const checkConnection = () => {
        if (this.networkStatus.online) {
          cleanup();
          resolve();
        }
      };

      const unsubscribe = this.onConnectionChange(checkConnection);
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };

      // Check immediately
      checkConnection();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  abortRetry(retryId: string): void {
    const controller = this.activeRetries.get(retryId);
    if (controller) {
      controller.abort();
      this.activeRetries.delete(retryId);
    }
  }

  abortAllRetries(): void {
    this.activeRetries.forEach((controller, id) => {
      controller.abort();
      this.activeRetries.delete(id);
    });
  }

  // Configuration management
  setRetryConfig(key: string, config: RetryConfig): void {
    this.retryConfigs.set(key, config);
  }

  getRetryConfig(key: string): RetryConfig | undefined {
    return this.retryConfigs.get(key);
  }
}

// Export singleton instance
export const networkManager = new NetworkManager();
export type { NetworkStatus, RetryConfig, RetryContext, RetryStrategy };