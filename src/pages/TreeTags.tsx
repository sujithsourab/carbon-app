import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Upload, Play, Download, MapPin, Info } from 'lucide-react';
import { AppRoutes } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TreeDetectionResult {
  id: number;
  coordinates: [number, number];
  confidence: number;
  diameter_px: number;
}

interface DetectionJob {
  job_id: string;
  status: 'idle' | 'queued' | 'running' | 'done' | 'error';
  result?: {
    geojson: GeoJSON.FeatureCollection;
    summary: {
      total_trees: number;
      avg_confidence: number;
      processing_time: number;
    };
    downloads: {
      geojson: string;
      csv?: string;
    };
  };
}

export function TreeTags() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [rasterFile, setRasterFile] = useState<File | null>(null);
  const [aoiGeoJSON, setAoiGeoJSON] = useState<GeoJSON.Polygon | null>(null);
  const [threshold, setThreshold] = useState<number>(0.5);
  const [tileSize, setTileSize] = useState<number>(1024);
  const [job, setJob] = useState<DetectionJob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock API base URL - in production this would be your TreeEyed API
  const apiBase = import.meta.env.VITE_TREEEYED_API || 'http://localhost:8000';

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([20.0, 78.0], 5);
    mapInstanceRef.current = map;

    // Add base layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Esri'
    });

    // Add the satellite layer by default
    satelliteLayer.addTo(map);

    // Add layer control
    const baseMaps = {
      "Satellite": satelliteLayer,
      "OpenStreetMap": osmLayer
    };

    L.control.layers(baseMaps).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Mock detection function - replace with actual API call
  const startDetection = async () => {
    if (!rasterFile) {
      alert('Please select a raster file');
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    const mockJobId = `job_${Date.now()}`;
    setJob({
      job_id: mockJobId,
      status: 'queued'
    });

    // Simulate processing
    setTimeout(() => {
      setJob(prev => prev ? { ...prev, status: 'running' } : null);
    }, 1000);

    setTimeout(() => {
      // Generate mock results
      const mockTrees: TreeDetectionResult[] = Array.from({ length: Math.floor(Math.random() * 50) + 10 }, (_, i) => ({
        id: i + 1,
        coordinates: [
          78.0 + (Math.random() - 0.5) * 2, // longitude
          20.0 + (Math.random() - 0.5) * 2  // latitude
        ],
        confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
        diameter_px: Math.floor(Math.random() * 20) + 10
      }));

      const mockGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: mockTrees.map(tree => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: tree.coordinates
          },
          properties: {
            id: tree.id,
            score: tree.confidence,
            diameter_px: tree.diameter_px
          }
        }))
      };

      setJob({
        job_id: mockJobId,
        status: 'done',
        result: {
          geojson: mockGeoJSON,
          summary: {
            total_trees: mockTrees.length,
            avg_confidence: mockTrees.reduce((sum, t) => sum + t.confidence, 0) / mockTrees.length,
            processing_time: 45.2
          },
          downloads: {
            geojson: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(mockGeoJSON))}`
          }
        }
      });

      setIsProcessing(false);

      // Add markers to map
      if (mapInstanceRef.current) {
        mockTrees.forEach(tree => {
          const marker = L.marker([tree.coordinates[1], tree.coordinates[0]])
            .bindPopup(`
              <div class="text-sm">
                <div><b>Tree ID:</b> ${tree.id}</div>
                <div><b>Confidence:</b> ${tree.confidence.toFixed(3)}</div>
                <div><b>Diameter (px):</b> ${tree.diameter_px}</div>
              </div>
            `);
          
          if (mapInstanceRef.current) {
            marker.addTo(mapInstanceRef.current);
          }
        });

        // Fit map to show all markers
        const group = new L.FeatureGroup(mockTrees.map(tree => 
          L.marker([tree.coordinates[1], tree.coordinates[0]])
        ));
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    }, 3000);
  };

  const downloadResults = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-earth-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(AppRoutes.RS_ANALYSIS)}
            className="flex items-center text-primary-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to RS Analysis
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-primary-600">Tree Tag Detection</CardTitle>
                <CardDescription>
                  Upload a raster image to detect and tag individual trees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Input Raster (GeoTIFF/COG)
                  </label>
                  <Input
                    type="file"
                    accept=".tif,.tiff,.cog"
                    onChange={(e) => setRasterFile(e.target.files?.[0] || null)}
                    className="w-full"
                  />
                  {rasterFile && (
                    <p className="text-xs text-gray-600 mt-1">
                      Selected: {rasterFile.name} ({(rasterFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confidence Threshold
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tile Size (px)
                    </label>
                    <Input
                      type="number"
                      value={tileSize}
                      onChange={(e) => setTileSize(Number(e.target.value))}
                    />
                  </div>
                </div>

                <Button
                  onClick={startDetection}
                  disabled={!rasterFile || isProcessing}
                  className="w-full"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isProcessing ? 'Processing...' : 'Run Detection'}
                </Button>

                {job && (
                  <div className="bg-primary-50 p-3 rounded-md">
                    <div className="text-sm font-medium text-primary-700 mb-1">
                      Job Status: {job.status}
                    </div>
                    {job.job_id && (
                      <div className="text-xs text-primary-600">
                        Job ID: {job.job_id}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results Panel */}
            {job?.result && (
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary-600">Detection Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary-50 rounded-lg p-3">
                      <div className="text-sm text-primary-600 mb-1">Total Trees</div>
                      <div className="text-xl font-bold text-primary-700">
                        {job.result.summary.total_trees}
                      </div>
                    </div>
                    <div className="bg-earth-50 rounded-lg p-3">
                      <div className="text-sm text-earth-600 mb-1">Avg Confidence</div>
                      <div className="text-xl font-bold text-earth-700">
                        {job.result.summary.avg_confidence.toFixed(3)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Processing Time</div>
                    <div className="text-lg font-semibold text-gray-700">
                      {job.result.summary.processing_time}s
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => downloadResults(job.result!.downloads.geojson, 'tree_detections.geojson')}
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download GeoJSON
                    </Button>
                    {job.result.downloads.csv && (
                      <Button
                        variant="outline"
                        onClick={() => downloadResults(job.result!.downloads.csv!, 'tree_detections.csv')}
                        className="w-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Panel */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-primary-600 flex items-center">
                  <Info className="mr-2 h-4 w-4" />
                  About Tree Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    This tool uses computer vision to automatically detect and tag individual trees in high-resolution imagery.
                  </p>
                  <p>
                    <strong>Supported formats:</strong> GeoTIFF, Cloud Optimized GeoTIFF (COG)
                  </p>
                  <p>
                    <strong>Best results:</strong> High-resolution imagery (≤1m/pixel) with clear tree canopies
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-8">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-primary-600 flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Detection Results Map
                </CardTitle>
                <CardDescription>
                  Detected trees will appear as markers on the map
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapRef} 
                  className="w-full h-[600px] rounded-lg overflow-hidden"
                  style={{ background: '#f0f0f0' }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}