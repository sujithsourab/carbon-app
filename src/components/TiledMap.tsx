import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface TiledMapProps {
  center?: [number, number];
  zoom?: number;
  tileUrl?: string;
  className?: string;
  onMapReady?: (map: L.Map) => void;
  onDrawCreated?: (geojson: GeoJSON.FeatureCollection) => void;
}

export function TiledMap({
  center = [0, 0],
  zoom = 2,
  tileUrl,
  className = 'h-[600px] w-full rounded-lg overflow-hidden',
  onMapReady,
  onDrawCreated
}: TiledMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const analysisLayerRef = useRef<L.TileLayer | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(center, zoom);
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

    // Add reference layer
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
        featureGroup: drawnItems,
        remove: true
      }
    });
    map.addControl(drawControl);

    // Handle draw events
    map.on('draw:created', (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      
      if (onDrawCreated) {
        const featureCollection: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: drawnItems.getLayers().map(l => l.toGeoJSON())
        };
        onDrawCreated(featureCollection);
      }
    });

    map.on('draw:edited', (e: any) => {
      if (onDrawCreated) {
        const featureCollection: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: drawnItems.getLayers().map(l => l.toGeoJSON())
        };
        onDrawCreated(featureCollection);
      }
    });

    map.on('draw:deleted', () => {
      if (onDrawCreated) {
        const featureCollection: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: drawnItems.getLayers().map(l => l.toGeoJSON())
        };
        onDrawCreated(featureCollection);
      }
    });

    // Set world bounds
    const worldBounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));
    map.setMaxBounds(worldBounds);
    map.setMinZoom(2);

    // Add NDVI legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.backgroundColor = 'white';
      div.style.padding = '10px';
      div.style.borderRadius = '4px';
      div.style.border = '1px solid #ccc';
      div.innerHTML = `
        <h4 class="text-sm font-semibold mb-2">NDVI Values</h4>
        <div class="flex items-center mb-1">
          <div class="w-4 h-4 bg-green-600 opacity-70 mr-2"></div>
          <span class="text-xs">High (0.8-1.0)</span>
        </div>
        <div class="flex items-center mb-1">
          <div class="w-4 h-4 bg-green-400 opacity-70 mr-2"></div>
          <span class="text-xs">Medium (0.4-0.8)</span>
        </div>
        <div class="flex items-center mb-1">
          <div class="w-4 h-4 bg-yellow-400 opacity-70 mr-2"></div>
          <span class="text-xs">Low (0.2-0.4)</span>
        </div>
        <div class="flex items-center">
          <div class="w-4 h-4 bg-red-400 opacity-70 mr-2"></div>
          <span class="text-xs">Very Low (0-0.2)</span>
        </div>
      `;
      return div;
    };
    legend.addTo(map);

    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      drawnItemsRef.current = null;
    };
  }, [center, zoom, onMapReady, onDrawCreated]);

  // Handle analysis layer updates
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing analysis layer
    if (analysisLayerRef.current) {
      mapInstanceRef.current.removeLayer(analysisLayerRef.current);
      analysisLayerRef.current = null;
    }

    // Add new analysis layer if URL is provided
    if (tileUrl) {
      analysisLayerRef.current = L.tileLayer(tileUrl, {
        tileSize: 256,
        maxZoom: 12,
        minZoom: 0,
        attribution: '© Your Project'
      }).addTo(mapInstanceRef.current);
    }
  }, [tileUrl]);

  return <div ref={mapRef} className={className} />;
}