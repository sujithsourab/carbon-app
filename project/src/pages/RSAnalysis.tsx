import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { ArrowLeft, Activity, Leaf, TreePine, Trees as Tree, AreaChart, Satellite, Radar, LineChart } from 'lucide-react';
import { AppRoutes } from '../types';

export function RSAnalysis() {
  const navigate = useNavigate();

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

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-primary-600 flex items-center">
              <Satellite className="mr-2 h-5 w-5" />
              Remote Sensing Analysis
            </CardTitle>
            <CardDescription>
              Tools for remote sensing analysis and monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="mr-2 h-4 w-4 text-primary-500" />
                    PAI Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Project Area Instances Management and record maintainance 
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(AppRoutes.PAI_MANAGEMENT)}
                  >
                    Open PAI Analysis
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Leaf className="mr-2 h-4 w-4 text-primary-500" />
                    NDVI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Normalized Difference Vegetation Index for monitoring vegetation health and stock measurement
                  </p>
                  <Button variant="outline" className="w-full">
                    Open NDVI Analysis
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TreePine className="mr-2 h-4 w-4 text-primary-500" />
                    Forest Cover
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Global canopy height analysis using GEDI and ALS data
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(AppRoutes.FOREST_COVER)}
                  >
                    Open Forest Analysis
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Tree className="mr-2 h-4 w-4 text-primary-500" />
                    Tree Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Individual tree detection and tagging for precise monitoring. Maintaining Census based records
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(AppRoutes.TREE_TAGS)}
                  >
                    Detect Tree Tags
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <AreaChart className="mr-2 h-4 w-4 text-primary-500" />
                    Performance Benchmarking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Area based approach analysis and PB management
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(AppRoutes.PERFORMANCE_BENCHMARKING)}
                  >
                    Open Performance Benchmarking
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Radar className="mr-2 h-4 w-4 text-primary-500" />
                    Leakage Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Monitor and analyze potential leakage in buffer zones using remote sensing data
                  </p>
                  <Button variant="outline" className="w-full">
                    Open Leakage Analysis
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <LineChart className="mr-2 h-4 w-4 text-primary-500" />
                    Canopy Height Mapping
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Advanced canopy height analysis using LiDAR and remote sensing data
                  </p>
                  <Button variant="outline" className="w-full">
                    Open Height Analysis
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}