/**
 * Upload Analytics Dashboard
 * Real-time monitoring and analytics for upload performance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Play, 
  Wifi, 
  WifiOff,
  Clock,
  HardDrive,
  Zap
} from 'lucide-react';
import { networkManager, type NetworkStatus } from '@/lib/networkManager';
import { backgroundUploadService, type UploadEvent } from '@/lib/backgroundUploadService';
import { uploadDatabase } from '@/lib/uploadDatabase';
import { formatFileSize } from '@/constants/upload';

interface UploadStats {
  totalUploads: number;
  activeUploads: number;
  completedUploads: number;
  failedUploads: number;
  totalBytesUploaded: number;
  averageSpeed: number;
  successRate: number;
}

interface UploadAnalyticsProps {
  className?: string;
}

export const UploadAnalytics: React.FC<UploadAnalyticsProps> = ({ className }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(networkManager.getNetworkStatus());
  const [uploadStats, setUploadStats] = useState<UploadStats>({
    totalUploads: 0,
    activeUploads: 0,
    completedUploads: 0,
    failedUploads: 0,
    totalBytesUploaded: 0,
    averageSpeed: 0,
    successRate: 0
  });
  const [activeUploads, setActiveUploads] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Network status monitoring
    const unsubscribeNetwork = networkManager.onConnectionChange(setNetworkStatus);

    // Upload event monitoring
    const unsubscribeProgress = backgroundUploadService.on('progress', handleUploadEvent);
    const unsubscribeCompleted = backgroundUploadService.on('completed', handleUploadEvent);
    const unsubscribeFailed = backgroundUploadService.on('failed', handleUploadEvent);

    // Initial load
    loadUploadStats();
    loadActiveUploads();

    // Refresh stats every 5 seconds
    const statsInterval = setInterval(loadUploadStats, 5000);

    return () => {
      unsubscribeNetwork();
      unsubscribeProgress();
      unsubscribeCompleted();
      unsubscribeFailed();
      clearInterval(statsInterval);
    };
  }, []);

  const loadUploadStats = async () => {
    try {
      const uploads = await uploadDatabase.getActiveUploads();
      const completed = uploads.filter(u => u.status === 'completed');
      const failed = uploads.filter(u => u.status === 'failed');
      const active = uploads.filter(u => u.status === 'uploading');

      const totalBytes = completed.reduce((sum, upload) => sum + upload.fileSize, 0);
      const successRate = uploads.length > 0 ? (completed.length / uploads.length) * 100 : 0;

      setUploadStats({
        totalUploads: uploads.length,
        activeUploads: active.length,
        completedUploads: completed.length,
        failedUploads: failed.length,
        totalBytesUploaded: totalBytes,
        averageSpeed: 0, // Calculate based on recent uploads
        successRate
      });
    } catch (error) {
      console.error('Failed to load upload stats:', error);
    }
  };

  const loadActiveUploads = () => {
    const uploads = backgroundUploadService.getActiveUploads();
    setActiveUploads(uploads);
  };

  const handleUploadEvent = (event: UploadEvent) => {
    loadUploadStats();
    loadActiveUploads();
  };

  const getNetworkQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading': return <Upload className="h-4 w-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const pauseUpload = async (uploadId: string) => {
    await backgroundUploadService.pauseUpload(uploadId);
  };

  const resumeUpload = async (uploadId: string) => {
    await backgroundUploadService.resumeUpload(uploadId);
  };

  const cancelUpload = async (uploadId: string) => {
    await backgroundUploadService.cancelUpload(uploadId);
  };

  return (
    <div className={className}>
      {/* Network Status */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {networkStatus.online ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={networkStatus.online ? "default" : "destructive"}>
                  {networkStatus.online ? 'Online' : 'Offline'}
                </Badge>
                <span className={`text-sm font-medium ${getNetworkQualityColor(networkManager.getConnectionQuality())}`}>
                  {networkManager.getConnectionQuality().toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {networkStatus.effectiveType} • {networkStatus.downlink}Mbps • {networkStatus.rtt}ms RTT
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Statistics */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Upload Statistics</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <div className="text-2xl font-bold">{uploadStats.activeUploads}</div>
              <div className="text-xs text-muted-foreground">Active Uploads</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">{uploadStats.completedUploads}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">{uploadStats.failedUploads}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{uploadStats.successRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Total Data Uploaded</span>
              <span className="font-medium">{formatFileSize(uploadStats.totalBytesUploaded)}</span>
            </div>
            <Progress value={uploadStats.successRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Active Uploads Details */}
      {showDetails && activeUploads.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Uploads</CardTitle>
            <CardDescription className="text-xs">
              Real-time upload progress and controls
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {activeUploads.map((upload) => (
                <div key={upload.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(upload.status)}
                      <span className="text-sm font-medium truncate">{upload.fileName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {upload.status === 'uploading' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => pauseUpload(upload.id)}
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}
                      {upload.status === 'paused' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resumeUpload(upload.id)}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelUpload(upload.id)}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>{formatFileSize(upload.fileSize)}</span>
                      <span>{upload.progress}%</span>
                    </div>
                    <Progress value={upload.progress} className="h-1" />
                    
                    {upload.status === 'uploading' && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Speed varies
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {upload.uploadedChunks?.length || 0}/{upload.totalChunks || 0} chunks
                        </span>
                      </div>
                    )}

                    {upload.lastError && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {upload.lastError}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};