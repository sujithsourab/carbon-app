import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { ArrowLeft, Download, DollarSign, BarChart2, LineChart, Lock, Eye, EyeOff } from 'lucide-react';
import { AppRoutes } from '../types';
import { useProject } from '../context/ProjectContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialData {
  year: number;
  totalVCUs: number;
  creditsIssued: number;
  revenue: number;
  cost: number;
}

interface FinancialModelProps {
  carbonProjections?: FinancialData[];
  userMode?: 'registry' | 'investor';
  shareAllowed?: boolean;
}

// Format number with commas and fixed decimals
const formatNumber = (num: number, decimals: number = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function FinancialModel({
  carbonProjections = [],
  userMode = 'registry',
  shareAllowed = false
}: FinancialModelProps) {
  const navigate = useNavigate();
  const { projectInfo } = useProject();
  const [mode, setMode] = useState<'registry' | 'investor'>(userMode);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [chartData, setChartData] = useState<{
    vcuChart: any;
    financialChart: any;
  }>({ vcuChart: null, financialChart: null });

  // Chart refs to prevent memory leaks
  const vcuChartRef = useRef<ChartJS | null>(null);
  const financialChartRef = useRef<ChartJS | null>(null);

  // Cleanup chart instances
  useEffect(() => {
    return () => {
      if (vcuChartRef.current) {
        vcuChartRef.current.destroy();
      }
      if (financialChartRef.current) {
        financialChartRef.current.destroy();
      }
    };
  }, []);

  // Redirect if no project info
  useEffect(() => {
    if (!projectInfo) {
      navigate(AppRoutes.PROJECT_INFO);
    }
  }, [projectInfo, navigate]);

  if (!projectInfo) {
    return null;
  }

  const startYear = new Date(projectInfo.startDate).getFullYear();
  const endYear = new Date(projectInfo.endDate).getFullYear();
  const projectDuration = endYear - startYear;
  const firstIssuanceYear = startYear + 5; // First issuance after 5 years

  // Generate consistent mock data based on project duration
  const mockData: FinancialData[] = Array.from({ length: projectDuration }, (_, i) => {
    const year = startYear + i;
    const baseVCUs = 40000;
    const yearMultiplier = 1 + (i * 0.1); // 10% increase each year
    const totalVCUs = Math.floor(baseVCUs * yearMultiplier);
    
    // Only issue credits after first issuance year
    const creditsIssued = year >= firstIssuanceYear ? Math.floor(totalVCUs * 0.8) : 0; // 80% of total VCUs
    const pricePerVCU = 15; // $15 per VCU
    const revenue = creditsIssued * pricePerVCU;
    const cost = Math.floor(revenue * 0.4); // 40% cost ratio

    return {
      year,
      totalVCUs,
      creditsIssued,
      revenue,
      cost
    };
  });

  const data = carbonProjections.length ? carbonProjections : mockData;

  // Calculate totals
  const totalVCUs = data.reduce((sum, d) => sum + d.totalVCUs, 0);
  const totalCreditsIssued = data.reduce((sum, d) => sum + d.creditsIssued, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalCosts = data.reduce((sum, d) => sum + d.cost, 0);
  const netRevenue = totalRevenue - totalCosts;

  useEffect(() => {
    const vcuChartData = {
      labels: data.map(d => d.year),
      datasets: [
        {
          label: 'Total VCUs',
          data: data.map(d => d.totalVCUs),
          borderColor: 'rgb(64, 145, 108)',
          backgroundColor: 'rgba(64, 145, 108, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Credits Issued',
          data: data.map(d => d.creditsIssued),
          borderColor: 'rgb(169, 132, 103)',
          backgroundColor: 'rgba(169, 132, 103, 0.1)',
          fill: true,
          tension: 0.4,
        }
      ]
    };

    const financialChartData = {
      labels: data.map(d => d.year),
      datasets: [
        {
          label: 'Revenue',
          data: data.map(d => d.revenue),
          backgroundColor: 'rgba(64, 145, 108, 0.8)',
        },
        {
          label: 'Cost',
          data: data.map(d => d.cost),
          backgroundColor: 'rgba(235, 85, 85, 0.8)',
        }
      ]
    };

    setChartData({
      vcuChart: vcuChartData,
      financialChart: financialChartData
    });
  }, [data]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
              if (context.dataset.label.includes('Revenue') || context.dataset.label.includes('Cost')) {
                label += formatCurrency(context.raw);
              } else {
                label += formatNumber(context.raw);
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (this.chart.config._config.type === 'bar') {
              return formatCurrency(value);
            }
            return formatNumber(value);
          }
        }
      },
    },
  };

  const downloadCSV = () => {
    const headers = ['Year', 'Total VCUs', 'Credits Issued', 'Revenue', 'Cost'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        [
          row.year,
          formatNumber(row.totalVCUs),
          formatNumber(row.creditsIssued),
          formatCurrency(row.revenue),
          formatCurrency(row.cost)
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'financial_model.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRequestAccess = () => {
    // In a real implementation, this would send a request to the backend
    alert('Access request has been sent to the project owner.');
    setShowRequestModal(false);
  };

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
          <div className="flex gap-2">
            <Button
              variant={mode === 'registry' ? 'primary' : 'outline'}
              onClick={() => setMode('registry')}
              className="flex items-center"
            >
              <Eye className="mr-2 h-4 w-4" />
              Registry Mode
            </Button>
            <Button
              variant={mode === 'investor' ? 'primary' : 'outline'}
              onClick={() => setMode('investor')}
              className="flex items-center"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Investor Mode
            </Button>
            {mode === 'investor' && shareAllowed && (
              <Button
                variant="outline"
                onClick={downloadCSV}
                className="flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            )}
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-primary-600">
              <DollarSign className="mr-2 h-5 w-5" />
              Financial Model
              {mode === 'investor' && !shareAllowed && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Limited Access)
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Project financial projections and analysis from {startYear} to {endYear}
              <br />
              <span className="text-sm text-earth-600">First issuance in {firstIssuanceYear}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-primary-50 rounded-lg p-4">
                <div className="text-sm text-primary-600 mb-1">Total VCUs</div>
                <div className="text-2xl font-bold text-primary-700 tabular-nums">
                  {formatNumber(totalVCUs)}
                </div>
              </div>
              <div className="bg-earth-50 rounded-lg p-4">
                <div className="text-sm text-earth-600 mb-1">Credits Issued</div>
                <div className="text-2xl font-bold text-earth-700 tabular-nums">
                  {formatNumber(totalCreditsIssued)}
                </div>
              </div>
              {mode === 'investor' && shareAllowed && (
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="text-sm text-primary-600 mb-1">Net Revenue</div>
                  <div className="text-2xl font-bold text-primary-700 tabular-nums">
                    {formatCurrency(netRevenue)}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <LineChart className="mr-2 h-4 w-4 text-primary-500" />
                    VCU Projections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] relative">
                    {chartData.vcuChart && (
                      <Line
                        ref={vcuChartRef}
                        data={chartData.vcuChart}
                        options={chartOptions}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {mode === 'investor' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <BarChart2 className="mr-2 h-4 w-4 text-primary-500" />
                      Revenue vs Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {shareAllowed ? (
                      <div className="h-[400px] relative">
                        {chartData.financialChart && (
                          <Bar
                            ref={financialChartRef}
                            data={chartData.financialChart}
                            options={chartOptions}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Lock className="h-12 w-12 mb-4" />
                        <p className="text-lg font-medium mb-2">Access Required</p>
                        <p className="text-sm text-center max-w-md mb-6">
                          Request access to view detailed financial information for this project
                        </p>
                        <Button
                          onClick={handleRequestAccess}
                          className="flex items-center"
                        >
                          Request Access
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}