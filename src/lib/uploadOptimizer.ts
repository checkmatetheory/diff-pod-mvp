/**
 * 🚀 UPLOAD PERFORMANCE OPTIMIZER
 * 
 * This service dynamically optimizes upload parameters for maximum performance
 * targeting 2-3 minute uploads for multi-gigabyte files.
 * 
 * 🎯 OPTIMIZATION STRATEGIES:
 * - Dynamic part size based on file size and connection speed
 * - Adaptive concurrency based on network conditions
 * - Real-time performance monitoring and adjustment
 * - Transfer acceleration detection and optimization
 */

export interface NetworkPerformance {
  speed: number; // bytes per second
  latency: number; // milliseconds
  reliability: number; // 0-1 score
  samples: number;
}

export interface OptimizationConfig {
  partSize: number;
  concurrency: number;
  expectedDuration: number; // seconds
  strategy: 'speed' | 'reliability' | 'balanced';
}

export interface PerformanceMetrics {
  uploadSpeed: number; // MB/s
  timeRemaining: number; // seconds
  efficiency: number; // 0-1 score
  bottleneck: 'network' | 'cpu' | 'memory' | 'disk' | 'server';
}

class UploadOptimizer {
  private performanceHistory: NetworkPerformance[] = [];
  private readonly MAX_HISTORY = 10;
  private readonly TARGET_DURATION_SECONDS = 150; // 2.5 minutes target

  /**
   * Calculate optimal upload configuration for a file
   */
  calculateOptimalConfig(fileSize: number, targetDuration?: number): OptimizationConfig {
    const target = targetDuration || this.TARGET_DURATION_SECONDS;
    const fileSizeMB = fileSize / 1024 / 1024;
    
    console.log(`🎯 Optimizing upload for ${fileSizeMB.toFixed(1)}MB file (target: ${target}s)`);

    // Get network performance baseline
    const networkPerf = this.getNetworkPerformance();
    
    // Calculate optimal part size
    const partSize = this.calculateOptimalPartSize(fileSize, networkPerf, target);
    
    // Calculate optimal concurrency
    const concurrency = this.calculateOptimalConcurrency(fileSize, partSize, networkPerf);
    
    // Estimate duration with these settings
    const expectedDuration = this.estimateUploadDuration(fileSize, partSize, concurrency, networkPerf);
    
    // Determine strategy
    const strategy = this.determineStrategy(fileSize, networkPerf);

    const config: OptimizationConfig = {
      partSize,
      concurrency,
      expectedDuration,
      strategy
    };

    console.log(`✅ Optimization result:`, {
      partSize: `${(partSize / 1024 / 1024).toFixed(1)}MB`,
      concurrency,
      expectedDuration: `${expectedDuration.toFixed(1)}s`,
      strategy,
      networkSpeed: networkPerf ? `${(networkPerf.speed / 1024 / 1024).toFixed(1)}MB/s` : 'unknown'
    });

    return config;
  }

  /**
   * Calculate optimal part size for maximum throughput
   */
  private calculateOptimalPartSize(
    fileSize: number, 
    networkPerf: NetworkPerformance | null, 
    targetDuration: number
  ): number {
    const fileSizeMB = fileSize / 1024 / 1024;
    
    // Base calculation on file size
    let partSize: number;
    
    if (fileSizeMB < 100) {
      // Small files: 5-10MB parts
      partSize = Math.max(5 * 1024 * 1024, fileSize / 8);
    } else if (fileSizeMB < 1000) {
      // Medium files (100MB-1GB): 10-25MB parts
      partSize = Math.min(25 * 1024 * 1024, Math.max(10 * 1024 * 1024, fileSize / 10));
    } else if (fileSizeMB < 5000) {
      // Large files (1-5GB): 25-50MB parts
      partSize = Math.min(50 * 1024 * 1024, Math.max(25 * 1024 * 1024, fileSize / 12));
    } else {
      // Very large files (5GB+): 50-100MB parts
      partSize = Math.min(100 * 1024 * 1024, Math.max(50 * 1024 * 1024, fileSize / 15));
    }

    // Adjust based on network performance
    if (networkPerf) {
      const speedMBps = networkPerf.speed / 1024 / 1024;
      
      if (speedMBps > 50) {
        // Fast connection: larger parts for efficiency
        partSize = Math.min(partSize * 1.5, 100 * 1024 * 1024);
      } else if (speedMBps < 10) {
        // Slow connection: smaller parts for reliability
        partSize = Math.max(partSize * 0.7, 5 * 1024 * 1024);
      }

      // Adjust for latency
      if (networkPerf.latency > 200) {
        // High latency: larger parts to reduce overhead
        partSize = Math.min(partSize * 1.3, 100 * 1024 * 1024);
      }
    }

    // Ensure minimum/maximum bounds
    partSize = Math.max(5 * 1024 * 1024, partSize); // 5MB minimum
    partSize = Math.min(100 * 1024 * 1024, partSize); // 100MB maximum

    // Round to nearest MB for cleaner numbers
    return Math.ceil(partSize / (1024 * 1024)) * 1024 * 1024;
  }

  /**
   * Calculate optimal concurrency for maximum throughput without overwhelming
   */
  private calculateOptimalConcurrency(
    fileSize: number,
    partSize: number,
    networkPerf: NetworkPerformance | null
  ): number {
    const totalParts = Math.ceil(fileSize / partSize);
    const fileSizeMB = fileSize / 1024 / 1024;
    
    let concurrency: number;
    
    // Base concurrency on file size and parts
    if (fileSizeMB < 100) {
      concurrency = Math.min(4, totalParts); // Conservative for small files
    } else if (fileSizeMB < 1000) {
      concurrency = Math.min(6, totalParts); // Moderate for medium files
    } else {
      concurrency = Math.min(10, totalParts); // Aggressive for large files
    }

    // Adjust based on network performance
    if (networkPerf) {
      const speedMBps = networkPerf.speed / 1024 / 1024;
      
      if (speedMBps > 100) {
        // Very fast connection: increase concurrency
        concurrency = Math.min(concurrency + 2, 12);
      } else if (speedMBps < 5) {
        // Slow connection: reduce concurrency
        concurrency = Math.max(concurrency - 2, 2);
      }

      // Consider reliability
      if (networkPerf.reliability < 0.8) {
        // Unreliable connection: reduce concurrency
        concurrency = Math.max(concurrency - 1, 2);
      }
    }

    // Browser and system considerations
    const maxConcurrency = navigator.hardwareConcurrency ? 
      Math.min(12, navigator.hardwareConcurrency * 2) : 8;
    
    return Math.min(concurrency, maxConcurrency, totalParts);
  }

  /**
   * Estimate upload duration with given parameters
   */
  private estimateUploadDuration(
    fileSize: number,
    partSize: number,
    concurrency: number,
    networkPerf: NetworkPerformance | null
  ): number {
    if (!networkPerf) {
      // Conservative estimate without network data
      return (fileSize / 1024 / 1024) / 10; // Assume 10MB/s
    }

    const speedMBps = networkPerf.speed / 1024 / 1024;
    const totalParts = Math.ceil(fileSize / partSize);
    const parallelBatches = Math.ceil(totalParts / concurrency);
    
    // Base upload time
    const baseUploadTime = fileSize / networkPerf.speed;
    
    // Add overhead for multiple requests
    const requestOverhead = parallelBatches * (networkPerf.latency / 1000) * 0.5;
    
    // Add processing overhead
    const processingOverhead = totalParts * 0.1; // 100ms per part
    
    // Consider reliability factor
    const reliabilityFactor = 1 + (1 - networkPerf.reliability) * 0.3;
    
    return (baseUploadTime + requestOverhead + processingOverhead) * reliabilityFactor;
  }

  /**
   * Determine the best strategy based on file size and network conditions
   */
  private determineStrategy(fileSize: number, networkPerf: NetworkPerformance | null): 'speed' | 'reliability' | 'balanced' {
    const fileSizeMB = fileSize / 1024 / 1024;
    
    if (!networkPerf) {
      return 'balanced';
    }

    const speedMBps = networkPerf.speed / 1024 / 1024;
    
    if (fileSizeMB > 2000 && speedMBps > 50 && networkPerf.reliability > 0.9) {
      return 'speed'; // Fast, reliable connection with large file
    } else if (networkPerf.reliability < 0.7) {
      return 'reliability'; // Unreliable connection
    } else {
      return 'balanced'; // Most common case
    }
  }

  /**
   * Get current network performance metrics
   */
  private getNetworkPerformance(): NetworkPerformance | null {
    if (this.performanceHistory.length === 0) {
      return null;
    }

    // Calculate weighted average (recent samples weighted more)
    const weights = this.performanceHistory.map((_, i) => i + 1);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    const avgSpeed = this.performanceHistory.reduce((sum, perf, i) => 
      sum + (perf.speed * weights[i]), 0) / totalWeight;
    
    const avgLatency = this.performanceHistory.reduce((sum, perf, i) => 
      sum + (perf.latency * weights[i]), 0) / totalWeight;
    
    const avgReliability = this.performanceHistory.reduce((sum, perf, i) => 
      sum + (perf.reliability * weights[i]), 0) / totalWeight;

    return {
      speed: avgSpeed,
      latency: avgLatency,
      reliability: avgReliability,
      samples: this.performanceHistory.length
    };
  }

  /**
   * Record network performance data for optimization
   */
  recordPerformance(metrics: {
    bytesTransferred: number;
    duration: number; // milliseconds
    successful: boolean;
    latency?: number;
  }): void {
    const speed = metrics.bytesTransferred / (metrics.duration / 1000);
    const reliability = metrics.successful ? 1 : 0;
    const latency = metrics.latency || 50; // Default estimate

    const performance: NetworkPerformance = {
      speed,
      latency,
      reliability,
      samples: 1
    };

    this.performanceHistory.push(performance);
    
    // Keep only recent history
    if (this.performanceHistory.length > this.MAX_HISTORY) {
      this.performanceHistory.shift();
    }

    console.log(`📊 Performance recorded: ${(speed / 1024 / 1024).toFixed(1)}MB/s, ${latency}ms latency, ${reliability ? 'success' : 'failure'}`);
  }

  /**
   * Get real-time performance metrics during upload
   */
  getPerformanceMetrics(
    bytesUploaded: number,
    totalBytes: number,
    elapsedTime: number, // milliseconds
    activeParts: number
  ): PerformanceMetrics {
    const uploadSpeed = (bytesUploaded / 1024 / 1024) / (elapsedTime / 1000); // MB/s
    const remainingBytes = totalBytes - bytesUploaded;
    const timeRemaining = uploadSpeed > 0 ? remainingBytes / (uploadSpeed * 1024 * 1024) : 0;
    
    // Calculate efficiency (how close we are to theoretical maximum)
    const networkPerf = this.getNetworkPerformance();
    const theoreticalMaxSpeed = networkPerf ? 
      (networkPerf.speed / 1024 / 1024) * 0.8 : // 80% of measured max
      uploadSpeed * 1.5; // Estimate based on current
    
    const efficiency = Math.min(1, uploadSpeed / theoreticalMaxSpeed);
    
    // Identify bottleneck
    let bottleneck: PerformanceMetrics['bottleneck'] = 'network';
    
    if (efficiency > 0.8) {
      bottleneck = 'network'; // We're close to network limits
    } else if (activeParts < 3) {
      bottleneck = 'cpu'; // Not utilizing parallelism
    } else if (uploadSpeed < 5 && networkPerf && networkPerf.speed > 50 * 1024 * 1024) {
      bottleneck = 'server'; // Server-side limitations
    } else {
      bottleneck = 'memory'; // Likely memory/browser limitations
    }

    return {
      uploadSpeed,
      timeRemaining,
      efficiency,
      bottleneck
    };
  }

  /**
   * Suggest optimizations during upload
   */
  suggestOptimizations(metrics: PerformanceMetrics, currentConfig: OptimizationConfig): Partial<OptimizationConfig> {
    const suggestions: Partial<OptimizationConfig> = {};

    if (metrics.efficiency < 0.5) {
      switch (metrics.bottleneck) {
        case 'cpu':
          // Increase concurrency if we have capacity
          if (currentConfig.concurrency < 8) {
            suggestions.concurrency = Math.min(currentConfig.concurrency + 2, 8);
          }
          break;
          
        case 'memory':
          // Reduce part size and concurrency
          suggestions.partSize = Math.max(currentConfig.partSize * 0.7, 5 * 1024 * 1024);
          suggestions.concurrency = Math.max(currentConfig.concurrency - 1, 2);
          break;
          
        case 'server':
          // Reduce load on server
          suggestions.concurrency = Math.max(currentConfig.concurrency - 1, 3);
          break;
          
        case 'network':
          // Already at network limits, no optimization possible
          break;
      }
    } else if (metrics.efficiency > 0.9 && metrics.uploadSpeed > 0) {
      // We're doing well, maybe we can push harder
      if (currentConfig.concurrency < 10) {
        suggestions.concurrency = currentConfig.concurrency + 1;
      }
    }

    if (Object.keys(suggestions).length > 0) {
      console.log(`💡 Upload optimization suggestions:`, suggestions);
    }

    return suggestions;
  }
}

// Export singleton instance
export const uploadOptimizer = new UploadOptimizer();