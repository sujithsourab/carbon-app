import React from 'react';
import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { AppRoutes } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ArrowLeft, Calendar, MapPin, FileText, Users, TreePine, FileCheck, BarChart3 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function Summary() {
  const navigate = useNavigate();
  const { projectInfo } = useProject();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  if (!projectInfo) {
    navigate(AppRoutes.PROJECT_INFO);
    return null;
  }

  // Project stage configuration
  const projectStages = [
    { key: 'pre-feasibility', label: 'Pre-feasibility' },
    { key: 'feasibility', label: 'Feasibility' },
    { key: 'first-activity-started', label: 'First Activity Started' },
    { key: 'listed', label: 'Listed' },
    { key: 'under-validation', label: 'Project under validation' },
    { key: 'registered', label: 'Project Registered' },
    { key: 'verification-pending', label: 'Verification pending' },
    { key: 'requested-for-issuance', label: 'Project requested for Issuance' },
    { key: 'issued-credits', label: 'Project Issued Credits' },
  ];

  const currentStageIndex = projectStages.findIndex(stage => stage.key === projectInfo.projectStage);
  const progressPercentage = currentStageIndex >= 0 ? ((currentStageIndex + 1) / projectStages.length) * 100 : 0;

  // Get coordinates for the location (simplified geocoding)
  const getLocationCoordinates = (location: string) => {
    // Default coordinates (will be used if no location match is found)
    let lat = 0;
    let lng = 0;
    
    // Comprehensive location mapping for countries and regions
    const locationMap: { [key: string]: [number, number] } = {
      // Countries
      'india': [20.5937, 78.9629],
      'mexico': [23.6345, -102.5528],
      'brazil': [-14.2350, -51.9253],
      'indonesia': [-0.7893, 113.9213],
      'kenya': [-0.0236, 37.9062],
      'peru': [-9.1900, -75.0152],
      'colombia': [4.5709, -74.2973],
      'ecuador': [-1.8312, -78.1834],
      'bolivia': [-16.2902, -63.5887],
      'chile': [-35.6751, -71.5430],
      'argentina': [-38.4161, -63.6167],
      'venezuela': [6.4238, -66.5897],
      'guyana': [4.8604, -58.9302],
      'suriname': [3.9193, -56.0278],
      'paraguay': [-23.4425, -58.4438],
      'uruguay': [-32.5228, -55.7658],
      'costa rica': [9.7489, -83.7534],
      'guatemala': [15.7835, -90.2308],
      'honduras': [15.2000, -86.2419],
      'nicaragua': [12.8654, -85.2072],
      'panama': [8.5380, -80.7821],
      'belize': [17.1899, -88.4976],
      'el salvador': [13.7942, -88.8965],
      'united states': [39.8283, -98.5795],
      'usa': [39.8283, -98.5795],
      'canada': [56.1304, -106.3468],
      'china': [35.8617, 104.1954],
      'thailand': [15.8700, 100.9925],
      'vietnam': [14.0583, 108.2772],
      'philippines': [12.8797, 121.7740],
      'malaysia': [4.2105, 101.9758],
      'myanmar': [21.9162, 95.9560],
      'cambodia': [12.5657, 104.9910],
      'laos': [19.8563, 102.4955],
      'bangladesh': [23.6850, 90.3563],
      'sri lanka': [7.8731, 80.7718],
      'nepal': [28.3949, 84.1240],
      'bhutan': [27.5142, 90.4336],
      'pakistan': [30.3753, 69.3451],
      'afghanistan': [33.9391, 67.7100],
      'iran': [32.4279, 53.6880],
      'turkey': [38.9637, 35.2433],
      'egypt': [26.0975, 30.0444],
      'south africa': [-30.5595, 22.9375],
      'nigeria': [9.0820, 8.6753],
      'ghana': [7.9465, -1.0232],
      'ethiopia': [9.1450, 40.4897],
      'tanzania': [-6.3690, 34.8888],
      'uganda': [1.3733, 32.2903],
      'rwanda': [-1.9403, 29.8739],
      'madagascar': [-18.7669, 46.8691],
      'mozambique': [-18.6657, 35.5296],
      'zambia': [-13.1339, 27.8493],
      'zimbabwe': [-19.0154, 29.1549],
      'botswana': [-22.3285, 24.6849],
      'namibia': [-22.9576, 18.4904],
      'australia': [-25.2744, 133.7751],
      'new zealand': [-40.9006, 174.8860],
      'papua new guinea': [-6.3150, 143.9555],
      'fiji': [-16.5780, 179.4144],
      // European countries
      'germany': [51.1657, 10.4515],
      'france': [46.6034, 1.8883],
      'spain': [40.4637, -3.7492],
      'italy': [41.8719, 12.5674],
      'united kingdom': [55.3781, -3.4360],
      'uk': [55.3781, -3.4360],
      'poland': [51.9194, 19.1451],
      'romania': [45.9432, 24.9668],
      'netherlands': [52.1326, 5.2913],
      'belgium': [50.5039, 4.4699],
      'czech republic': [49.8175, 15.4730],
      'hungary': [47.1625, 19.5033],
      'austria': [47.5162, 14.5501],
      'switzerland': [46.8182, 8.2275],
      'sweden': [60.1282, 18.6435],
      'norway': [60.4720, 8.4689],
      'finland': [61.9241, 25.7482],
      'denmark': [56.2639, 9.5018],
      'portugal': [39.3999, -8.2245],
      'greece': [39.0742, 21.8243],
      'bulgaria': [42.7339, 25.4858],
      'croatia': [45.1000, 15.2000],
      'serbia': [44.0165, 21.0059],
      'bosnia': [43.9159, 17.6791],
      'albania': [41.1533, 20.1683],
      'slovenia': [46.1512, 14.9955],
      'slovakia': [48.6690, 19.6990],
      'lithuania': [55.1694, 23.8813],
      'latvia': [56.8796, 24.6032],
      'estonia': [58.5953, 25.0136],
      // Additional regions and states
      'california': [36.7783, -119.4179],
      'texas': [31.9686, -99.9018],
      'florida': [27.7663, -82.6404],
      'new york': [42.1657, -74.9481],
      'ontario': [51.2538, -85.3232],
      'british columbia': [53.7267, -127.6476],
      'quebec': [52.9399, -73.5491],
    };
    
    const locationKey = location.toLowerCase();
    for (const [key, coords] of Object.entries(locationMap)) {
      if (locationKey.includes(key)) {
        [lat, lng] = coords;
        break;
      }
    }
    
    // If no match found and location is provided, default to India
    // If no location provided at all, use world center coordinates
    if (lat === 0 && lng === 0) {
      if (location && location.trim() !== '') {
        // Location provided but not recognized, default to India
        lat = 20.5937;
        lng = 78.9629;
      } else {
        // No location provided, show world center
        lat = 20;
        lng = 0;
      }
    }
    
    return { lat, lng };
  };

  const { lat, lng } = getLocationCoordinates(projectInfo.location);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([lat, lng], 6);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add marker for project location
    L.marker([lat, lng]).addTo(map)
      .bindPopup(`<b>${projectInfo.name}</b><br/>${projectInfo.location}`)
      .openPopup();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, projectInfo.name, projectInfo.location]);

  const metrics = [
    {
      label: 'Project Type',
      value: projectInfo.projectType,
      icon: TreePine,
      color: 'text-primary-500',
    },
    {
      label: 'Location',
      value: projectInfo.location,
      icon: MapPin,
      color: 'text-earth-500',
    },
    {
      label: 'Start Date',
      value: new Date(projectInfo.startDate).toLocaleDateString(),
      icon: Calendar,
      color: 'text-primary-500',
    },
    {
      label: 'Methodology',
      value: projectInfo.methodology,
      icon: FileCheck,
      color: 'text-earth-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-earth-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(AppRoutes.RESULTS)}
            className="flex items-center text-primary-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
        </div>

        <div className="space-y-6">
          {/* Project Overview */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-primary-600 flex items-center">
                <FileText className="mr-2 h-6 w-6" />
                Project Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-2xl font-bold text-primary-700 mb-4">
                {projectInfo.name}
              </h2>
              <p className="text-gray-600 mb-6">
                {projectInfo.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center mb-2">
                      <metric.icon className={`h-5 w-5 ${metric.color} mr-2`} />
                      <span className="text-sm text-gray-500">{metric.label}</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-800">
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Project Location Map */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-primary-600 flex items-center">
                <MapPin className="mr-2 h-6 w-6" />
                Project Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div 
                  ref={mapRef} 
                  className="w-full h-64 rounded-lg overflow-hidden border border-gray-200"
                  style={{ background: '#f0f0f0' }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Project Stage Progress */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-primary-600 flex items-center">
                <BarChart3 className="mr-2 h-6 w-6" />
                Project Stage Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{currentStageIndex + 1} of {projectStages.length} stages completed</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Stage List */}
                <div className="space-y-3">
                  {projectStages.map((stage, index) => {
                    const isCompleted = index < currentStageIndex;
                    const isCurrent = index === currentStageIndex;
                    const isFuture = index > currentStageIndex;

                    return (
                      <div key={stage.key} className="flex items-center space-x-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : isCurrent 
                              ? 'bg-primary-500 text-white' 
                              : 'bg-gray-200 text-gray-500'
                        }`}>
                          {isCompleted ? '✓' : isCurrent ? '●' : index + 1}
                        </div>
                        <div className={`flex-1 ${
                          isCurrent ? 'font-semibold text-primary-700' : 
                          isCompleted ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {stage.label}
                          {isCurrent && <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full">Current Stage</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stakeholder Information */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-primary-600 flex items-center">
                <Users className="mr-2 h-6 w-6" />
                Project Stakeholders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Key Stakeholders</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-600">
                      • Project Developer
                    </li>
                    <li className="flex items-center text-gray-600">
                      • Local Communities
                    </li>
                    <li className="flex items-center text-gray-600">
                      • Government Agencies
                    </li>
                    <li className="flex items-center text-gray-600">
                      • Environmental NGOs
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Engagement Status</h3>
                  <div className="bg-success-50 text-success-700 p-3 rounded-md">
                    Stakeholder consultation process is ongoing
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}