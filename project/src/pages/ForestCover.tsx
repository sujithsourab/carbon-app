import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { ArrowLeft, TreePine, Download, Eye, EyeOff, Calendar, Layers } from 'lucide-react';
import { AppRoutes } from '../types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Line } from 'react-chartjs-2';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

export function ForestCover() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const canopyLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const osmLayerRef = useRef<L.TileLayer | null>(null);
  const referenceLayerRef = useRef<L.TileLayer | null>(null);
  const legendRef = useRef<L.Control | null>(null);
  const [opacity, setOpacity] = useState(0.7);
  const [date, setDate] = useState<Date>(new Date());
  const [showLegend, setShowLegend] = useState(true);
  const [showSatellite, setShowSatellite] = useState(true);
  const [showOSM, setShowOSM] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      minZoom: 2,
      maxZoom: 19
    });
    
    map.setView([0, 0], 2);
    mapInstanceRef.current = map;

    // Wait for map to be ready
    map.whenReady(() => {
      setIsMapReady(true);
    });

    // Set world bounds
    const worldBounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));
    map.setMaxBounds(worldBounds);

    // Add custom CSS for canopy layer
    const style = document.createElement('style');
    style.textContent = `
      .canopy-layer {
        filter: hue-rotate(60deg) saturate(150%) brightness(120%);
        mix-blend-mode: multiply;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
      mapInstanceRef.current = null;
      document.head.removeChild(style);
      setIsMapReady(false);
    };
  }, []);

  // Initialize and manage layers
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Initialize layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    });
    osmLayerRef.current = osmLayer;

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Esri'
    });
    satelliteLayerRef.current = satelliteLayer;

    const referenceLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Esri'
    });
    referenceLayerRef.current = referenceLayer;

    const canopyLayer = L.tileLayer('https://storage.googleapis.com/global-forest-watch/gedi_v6/{z}/{x}/{y}.png', {
      maxZoom: 13,
      minZoom: 3,
      opacity: opacity,
      attribution: '© Global Forest Watch',
      className: 'canopy-layer',
      tileSize: 256
    });
    canopyLayerRef.current = canopyLayer;

    // Add layers based on state
    if (showSatellite) satelliteLayer.addTo(map);
    if (showOSM) osmLayer.addTo(map);
    canopyLayer.addTo(map);
    if (showLabels) referenceLayer.addTo(map);

    // Initialize legend
    if (showLegend) {
      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.backgroundColor = 'white';
        div.style.padding = '10px';
        div.style.borderRadius = '4px';
        div.style.border = '1px solid #ccc';
        div.innerHTML = `
          <h4 class="text-sm font-semibold mb-2">Canopy Height (m)</h4>
          <div class="space-y-2">
            <div class="flex items-center">
              <div class="w-4 h-4 bg-[#1B4332] opacity-90 mr-2"></div>
              <span class="text-xs">>50m - Old Growth Forest</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 bg-[#2D6A4F] opacity-90 mr-2"></div>
              <span class="text-xs">30-50m - Mature Forest</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 bg-[#40916C] opacity-90 mr-2"></div>
              <span class="text-xs">15-30m - Young Forest</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 bg-[#52B788] opacity-90 mr-2"></div>
              <span class="text-xs">5-15m - Regenerating Forest</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 bg-[#95D5B2] opacity-90 mr-2"></div>
              <span class="text-xs">0-5m - Shrubs/Small Trees</span>
            </div>
          </div>
        `;
        return div;
      };
      legend.addTo(map);
      legendRef.current = legend;
    }

    return () => {
      if (map) {
        if (canopyLayerRef.current) map.removeLayer(canopyLayerRef.current);
        if (satelliteLayerRef.current) map.removeLayer(satelliteLayerRef.current);
        if (osmLayerRef.current) map.removeLayer(osmLayerRef.current);
        if (referenceLayerRef.current) map.removeLayer(referenceLayerRef.current);
        if (legendRef.current) map.removeControl(legendRef.current);
      }
      canopyLayerRef.current = null;
      satelliteLayerRef.current = null;
      osmLayerRef.current = null;
      referenceLayerRef.current = null;
      legendRef.current = null;
    };
  }, [isMapReady, showLegend]);

  // Update layer visibility and opacity
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Update layer visibility
    if (showSatellite && satelliteLayerRef.current) {
      satelliteLayerRef.current.addTo(map);
    } else if (satelliteLayerRef.current) {
      map.removeLayer(satelliteLayerRef.current);
    }

    if (showOSM && osmLayerRef.current) {
      osmLayerRef.current.addTo(map);
    } else if (osmLayerRef.current) {
      map.removeLayer(osmLayerRef.current);
    }

    if (showLabels && referenceLayerRef.current) {
      referenceLayerRef.current.addTo(map);
    } else if (referenceLayerRef.current) {
      map.removeLayer(referenceLayerRef.current);
    }

    // Update canopy layer opacity
    if (canopyLayerRef.current) {
      canopyLayerRef.current.setOpacity(opacity);
    }
  }, [isMapReady, showSatellite, showOSM, showLabels, opacity]);

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
          <div className="flex gap-2">
            <div className="relative">
              <DatePicker
                selected={date}
                onChange={(date) => setDate(date || new Date())}
                maxDate={new Date()}
                customInput={
                  <Button variant="outline" className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Select Date
                  </Button>
                }
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowLegend(!showLegend)}
              className="flex items-center"
            >
              {showLegend ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Legend
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Legend
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-primary-600 flex items-center">
              <TreePine className="mr-2 h-5 w-5" />
              Forest Cover Analysis
            </CardTitle>
            <CardDescription>
              Global canopy height analysis using GEDI and ALS data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef} 
              className="w-full h-[600px] rounded-lg overflow-hidden mb-6"
              style={{ background: '#f0f0f0' }}
            />

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-primary-700 mb-4">Layer Controls</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Canopy Layer Opacity: {Math.round(opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity * 100}
                    onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
                    className="w-full"
                  />
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Layers
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={showSatellite ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setShowSatellite(!showSatellite)}
                      className="flex items-center"
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Satellite
                    </Button>
                    <Button
                      variant={showOSM ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setShowOSM(!showOSM)}
                      className="flex items-center"
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      OpenStreetMap
                    </Button>
                    <Button
                      variant={showLabels ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setShowLabels(!showLabels)}
                      className="flex items-center"
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Labels
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}