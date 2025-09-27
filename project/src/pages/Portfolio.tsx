import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Plus, FileText, Calendar, MapPin, ArrowRight, LogOut } from 'lucide-react';
import { AppRoutes } from '../types';
import { useAuth } from '../context/AuthContext';

// Mock data - replace with actual data from your backend
const projects = [
  {
    id: '1',
    name: 'Amazon Rainforest Conservation',
    location: 'Brazil',
    startDate: '2024-01-15',
    projectType: 'REDD+',
    description: 'Conservation of 50,000 hectares of primary rainforest...',
  },
  {
    id: '2',
    name: 'Mangrove Restoration',
    location: 'Indonesia',
    startDate: '2024-02-01',
    projectType: 'Reforestation',
    description: 'Restoration of coastal mangrove ecosystems...',
  },
  // Add more mock projects as needed
];

export function Portfolio() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate(AppRoutes.HOME);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-primary-50 to-earth-50 overflow-x-hidden">
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">My Carbon Projects</h1>
            <p className="text-earth-600 mt-2">
              Manage and monitor your carbon project portfolio
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center flex-1 sm:flex-none justify-center"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            <Button 
              onClick={() => navigate(AppRoutes.PROJECT_INFO)}
              className="flex items-center flex-1 sm:flex-none justify-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id}
              className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="text-xl text-primary-700">
                  {project.name}
                </CardTitle>
                <CardDescription>
                  {project.projectType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center text-earth-600">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{project.location}</span>
                  </div>
                  <div className="flex items-center text-earth-600">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {new Date(project.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 line-clamp-2">
                    {project.description}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full mt-4 flex items-center justify-center"
                    onClick={() => navigate(`${AppRoutes.RESULTS}/${project.id}`)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Details (no data)
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}