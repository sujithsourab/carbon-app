import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { TextArea } from '../components/ui/TextArea';
import { ArrowLeft, Upload, Save, Trash2, Eye, EyeOff, Map, Download } from 'lucide-react';
import { AppRoutes } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { cloudflareClient } from '../utils/cloudflare';

interface ProjectArea {
  id: string;
  name: string;
  description: string;
  geometry: GeoJSON.Polygon;
  area: number;
  metadata: Record<string, any>;
  created_at: string;
}

export function PAIManagement() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projectAreas, setProjectAreas] = useState<ProjectArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<ProjectArea | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showAreas, setShowAreas] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([0, 0], 2);
    mapInstanceRef.current = map;

    // Create feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Add base layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Esri'
    });

    const referenceLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Esri'
    });

    // Add the satellite layer by default
    satelliteLayer.addTo(map);
    referenceLayer.addTo(map);

    // Add layer control
    const baseMaps = {
      "Satellite": satelliteLayer,
      "OpenStreetMap": osmLayer
    };

    const overlayMaps = {
      "Labels & Boundaries": referenceLayer
    };

    L.control.layers(baseMaps, overlayMaps).addTo(map);

    // Initialize draw control
    const drawControl = new L.Control.Draw({
      draw: {
        marker: false,
        circlemarker: false,
        circle: false,
        rectangle: true,
        polygon: true,
        polyline: false
      },
      edit: {
        featureGroup: drawnItems
      }
    });
    map.addControl(drawControl);

    // Handle draw events
    map.on('draw:created', (e: any) => {
      const layer = e.layer;
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);
      
      // Calculate area
      const area = calculatePolygonArea(layer.getLatLngs()[0]);
      console.log(`Area: ${(area / 10000).toFixed(2)} hectares`);
    });

    // Set world bounds
    const worldBounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));
    map.setMaxBounds(worldBounds);
    map.setMinZoom(2);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      drawnItemsRef.current = null;
    };
  }, []);

  // Helper function to calculate polygon area
  const calculatePolygonArea = (latlngs: L.LatLng[]): number => {
    let area = 0;
    const earthRadius = 6371000; // Earth's radius in meters
    
    if (latlngs.length < 3) return 0;
    
    for (let i = 0; i < latlngs.length; i++) {
      const j = (i + 1) % latlngs.length;
      const lat1 = latlngs[i].lat * Math.PI / 180;
      const lat2 = latlngs[j].lat * Math.PI / 180;
      const lng1 = latlngs[i].lng * Math.PI / 180;
      const lng2 = latlngs[j].lng * Math.PI / 180;
      
      area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    
    area = Math.abs(area * earthRadius * earthRadius / 2);
    return area;
  };

  // Load project areas
  useEffect(() => {
    loadProjectAreas();
  }, []);

  const loadProjectAreas = async () => {
    try {
      const data = await cloudflareClient.getProjectAreas();

      setProjectAreas(data || []);

      // Add areas to map
      if (mapInstanceRef.current && drawnItemsRef.current && showAreas) {
        drawnItemsRef.current.clearLayers();
        data?.forEach(area => {
          L.geoJSON(area.geometry, {
            style: {
              color: '#40916C',
              weight: 2,
              opacity: 0.7,
              fillOpacity: 0.3
            }
          }).addTo(drawnItemsRef.current!);
        });
      }
    } catch (error) {
      console.error('Error loading project areas:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mapInstanceRef.current || !drawnItemsRef.current) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fileContent = e.target?.result as string;
          let geoJSON;

          if (file.name.endsWith('.kml')) {
            const parser = new DOMParser();
            const kml = parser.parseFromString(fileContent, 'text/xml');
            // Convert KML to GeoJSON (simplified example)
            const coordinates = Array.from(kml.getElementsByTagName('coordinates')).map(coord => {
              return coord.textContent?.trim().split(' ').map(point => {
                const [lng, lat] = point.split(',');
                return [parseFloat(lng), parseFloat(lat)];
              });
            });
            geoJSON = {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: coordinates
                },
                properties: {}
              }]
            };
          } else {
            geoJSON = JSON.parse(fileContent);
          }

          drawnItemsRef.current.clearLayers();
          const layer = L.geoJSON(geoJSON).addTo(drawnItemsRef.current);
          mapInstanceRef.current.fitBounds(layer.getBounds());

        } catch (error) {
          console.error('Error parsing file:', error);
          alert('Error parsing file. Please ensure it is a valid KML or GeoJSON file.');
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const saveProjectArea = async () => {
    if (!drawnItemsRef.current || !name) return;

    try {
      setIsLoading(true);

      const layers = drawnItemsRef.current.getLayers();
      if (layers.length === 0) {
        alert('Please draw or upload a project area');
        return;
      }

      const layer = layers[0] as L.Polygon;
      const geoJSON = layer.toGeoJSON();
      const area = calculatePolygonArea(layer.getLatLngs()[0]);

      const data = await cloudflareClient.createProjectArea({
        name,
        description,
        geometry: geoJSON.geometry,
        area: area / 10000, // Convert to hectares
        metadata: {}
      });

      setProjectAreas(prev => [data, ...prev]);
      setName('');
      setDescription('');
      drawnItemsRef.current.clearLayers();

    } catch (error) {
      console.error('Error saving project area:', error);
      alert('Error saving project area');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProjectArea = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project area?')) return;

    try {
      await cloudflareClient.deleteProjectArea(id);

      setProjectAreas(prev => prev.filter(area => area.id !== id));
    } catch (error) {
      console.error('Error deleting project area:', error);
      alert('Error deleting project area');
    }
  };

  const downloadGeoJSON = (area: ProjectArea) => {
    const data = {
      type: 'Feature',
      geometry: area.geometry,
      properties: {
        name: area.name,
        description: area.description,
        area: area.area,
        created_at: area.created_at
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${area.name.replace(/[^a-z0-9]/gi, '_')}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload KML/GeoJSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".geojson,.json,.kml"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              onClick={() => setShowAreas(!showAreas)}
              className="flex items-center"
            >
              {showAreas ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Areas
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Areas
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-primary-600 flex items-center">
                  <Map className="mr-2 h-5 w-5" />
                  Project Area Management
                </CardTitle>
                <CardDescription>
                  Draw or upload project area boundaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapRef} 
                  className="w-full h-[600px] rounded-lg overflow-hidden mb-6"
                  style={{ background: '#f0f0f0' }}
                />

                <div className="space-y-4">
                  <Input
                    label="Area Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter area name"
                  />
                  <TextArea
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter area description"
                  />
                  <Button
                    onClick={saveProjectArea}
                    disabled={isLoading || !name}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Project Area
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Project Areas</CardTitle>
                <CardDescription>
                  {projectAreas.length} areas defined
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectAreas.map(area => (
                    <Card key={area.id} className="bg-gray-50">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">{area.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {area.area.toFixed(2)} hectares
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-gray-600 mb-4">
                          {area.description || 'No description provided'}
                        </p>
                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadGeoJSON(area)}
                            className="flex items-center"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteProjectArea(area.id)}
                            className="flex items-center text-error-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}