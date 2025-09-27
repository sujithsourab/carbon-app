import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { ArrowLeft, ExternalLink, RefreshCw, Info, BarChart3, Activity } from 'lucide-react';
import { AppRoutes } from '../types';

export function PerformanceBenchmarking() {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const geeAppUrl = 'https://carbonbuilder.projects.earthengine.app/view/vm47pb';

  useEffect(() => {
    // Handle iframe load
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setIsLoading(false);
      };
      iframe.addEventListener('load', handleLoad);
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, []);

  const refreshApp = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const openInNewTab = () => {
    window.open(geeAppUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-earth-50 p-6">
      <div className="max-w-7xl mx-auto">
        {!isFullscreen && (
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(AppRoutes.RS_ANALYSIS)}
              className="flex items-center text-primary-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to RS Analysis
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={refreshApp}
                className="flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={openInNewTab}
                className="flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </Button>
              <Button
                onClick={toggleFullscreen}
                className="flex items-center"
              >
                <Activity className="mr-2 h-4 w-4" />
                Fullscreen
              </Button>
            </div>
          </div>
        )}

        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
          {!isFullscreen && (
            <Card className="bg-white/90 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle className="text-primary-600 flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Performance Benchmarking - VM0047
                </CardTitle>
                <CardDescription>
                  Area-based approach analysis and performance benchmarking using Google Earth Engine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-primary-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center mb-2">
                    <Info className="h-4 w-4 text-primary-600 mr-2" />
                    <span className="text-sm font-medium text-primary-700">About This Tool</span>
                  </div>
                  <div className="text-sm text-primary-600 space-y-1">
                    <p>• Analyze project performance using satellite data and remote sensing</p>
                    <p>• Compare baseline vs project scenarios for VM0047 methodology</p>
                    <p>• Generate performance benchmarks and monitoring reports</p>
                    <p>• Interactive analysis powered by Google Earth Engine</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className={`bg-white/90 backdrop-blur-sm ${isFullscreen ? 'h-full' : ''}`}>
            <CardHeader className={isFullscreen ? 'pb-2' : ''}>
              <div className="flex justify-between items-center">
                <CardTitle className="text-primary-600">
                  Google Earth Engine Application
                </CardTitle>
                {isFullscreen && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshApp}
                      className="flex items-center"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openInNewTab}
                      className="flex items-center"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      New Tab
                    </Button>
                    <Button
                      size="sm"
                      onClick={toggleFullscreen}
                      className="flex items-center"
                    >
                      Exit Fullscreen
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className={isFullscreen ? 'flex-1 p-0' : ''}>
              <div className={`relative ${isFullscreen ? 'h-full' : 'h-[896px]'} w-full rounded-lg overflow-hidden border border-gray-200`}>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading Google Earth Engine Application...</p>
                    </div>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  src={geeAppUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  title="VM0047 Performance Benchmarking - Google Earth Engine"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}