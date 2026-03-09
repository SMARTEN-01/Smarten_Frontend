
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, AlertTriangle, ArrowLeft, Clock, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts';
import { useWaterReadings } from '@/hooks/useWaterReadings';
import { useMonitorData } from '@/contexts/MonitorDataContext';

// Import province icons
// Define province icons as absolute paths (assets are in the public/assets directory)
const NorthIcon = '/assets/North.svg';
const SouthIcon = '/assets/South.svg';
const EastIcon = '/assets/East.svg';
const WestIcon = '/assets/West.svg';
const KigaliIcon = '/assets/Kigali.svg';

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-md rounded-md border border-gray-100">
        <div className="flex justify-center items-center text-xs text-gray-500 mb-1">
          <Clock className="w-3 h-3 mr-1" />
          <span>{label}</span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>{payload[0]?.value} lph</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ProvinceMonitor = () => {
  const { province } = useParams();
  const [timeRange, setTimeRange] = useState<'D' | 'M' | 'Y'>('D');
  const [currentTime, setCurrentTime] = useState('16:00 PM');
  const [selectedHistoricalData, setSelectedHistoricalData] = useState<{
    waterData: any;
    districtData: any[];
    criticalReadings: any[];
    timestamp: string;
  } | null>(null);
  const [isHistoricalView, setIsHistoricalView] = useState(false);
  
  // Province mapping for WebSocket data
  const provinceMapping = {
    'north': 'Northern',
    'south': 'Southern', 
    'east': 'Eastern',
    'west': 'Western',
    'kigali': 'Kigali'
  };

  const selectedProvince = provinceMapping[province as keyof typeof provinceMapping] || 'Northern';
  
  // Use WebSocket hook for real-time data
  const { waterData, districtData, criticalReadings, pastHour, dailyAverage, connectionStatus, errorMessage, isDataStale } = useWaterReadings(selectedProvince);
  const { clearData, getConnectionStatus } = useMonitorData();
  
  console.log("ProvinceMonitor - Fetched real time data for", selectedProvince, ":", waterData);
  console.log("ProvinceMonitor - Number of data points:", waterData.length);
  
  const provinceData = {
    north: {
      name: 'Northern',
      districts: ['Gicumbi', 'Musanze', 'Gakenke', 'Rulindo', 'Burera'],
      color: 'bg-yellow-500',
      icon: NorthIcon
    },
    south: {
      name: 'Southern', 
      districts: ['Nyanza', 'Gisagara', 'Nyaruguru', 'Huye', 'Nyamagabe', 'Ruhango', 'Muhanga', 'Kamonyi'],
      color: 'bg-blue-500',
      icon: SouthIcon
    },
    east: {
      name: 'Eastern',
      districts: ['Rwamagana', 'Nyagatare', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Bugesera'],
      color: 'bg-orange-500',
      icon: EastIcon
    },
    west: {
      name: 'Western',
      districts: ['Nyabihu', 'Karongi', 'Ngororero', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
      color: 'bg-green-500',
      icon: WestIcon
    },
    kigali: {
      name: 'Kigali',
      districts: ['Nyarugenge', 'Gasabo', 'Kicukiro'],
      color: 'bg-purple-500',
      icon: KigaliIcon
    }
  };

  const currentProvince = provinceData[province as keyof typeof provinceData];

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedTime = `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      setCurrentTime(formattedTime);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Process WebSocket data for daily chart with improved connectivity
  const processChartData = (rawData: { flow_rate_lph: number; status: string; timestamp: string; province: string }[]) => {
    if (!rawData.length) return [];

    // Filter and sort data to ensure proper chronological order for line connectivity
    const filteredData = rawData
      .filter(item => item.flow_rate_lph != null && 
                     !isNaN(item.flow_rate_lph) && 
                     item.flow_rate_lph >= 0 &&
                     item.timestamp) // Ensure timestamp exists
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Strict chronological order
      .filter((item, index, array) => {
        // Remove true duplicates; allow multiple points per minute
        return index === 0 || item.timestamp !== array[index - 1].timestamp;
      })
      .slice(-100); // Increased limit for better trend visualization

    // Create chart data with proper time formatting and ensure all points are connected
    const chartData = filteredData.map((item, index) => {
      const date = new Date(item.timestamp);
      const hh = date.getHours().toString().padStart(2, '0');
      const mm = date.getMinutes().toString().padStart(2, '0');
      const ss = date.getSeconds().toString().padStart(2, '0');
      return {
        time: `${hh}:${mm}:${ss}`, // Include seconds to show 15s updates distinctly
        flow: Number(item.flow_rate_lph), // Ensure numeric value for proper line connection
        timestamp: item.timestamp,
        status: item.status,
        fullData: item, // Store the complete data for this point
        index: index // Add index for debugging
      };
    });

    // Ensure data integrity for line connectivity
    return chartData.filter(item => item.flow !== null && item.flow !== undefined);
  };

  // Get province-specific data constants (same as Monitor.tsx)
  const getProvinceData = (provinceName: string) => {
    const provinceData = {
      'Northern': { baseFlow: 24, flowMultiplier: 1.0 },
      'Southern': { baseFlow: 28, flowMultiplier: 1.2 },
      'Eastern': { baseFlow: 22, flowMultiplier: 0.9 },
      'Western': { baseFlow: 26, flowMultiplier: 1.1 },
      'Kigali': { baseFlow: 30, flowMultiplier: 1.3 }
    };
    return provinceData[provinceName as keyof typeof provinceData] || provinceData['Northern'];
  };

  const generateChartData = () => {
    if (timeRange === 'D') {
      return processChartData(waterData); // Use WebSocket for 'D'
    } 
    const { baseFlow, flowMultiplier } = getProvinceData(selectedProvince);
    const provinceVariation = selectedProvince.charCodeAt(0) / 100;
    
    if (timeRange === 'M') {
      const data = [];
      const weeks = ['1st week', '2nd week', '3rd week', '4th week'];
      for (let i = 0; i < weeks.length; i++) {
        const waterFlow = Math.round((baseFlow + (10 * flowMultiplier) * 
          Math.sin((i / weeks.length) * Math.PI * (6 + provinceVariation))) / 60); // Convert to cm³/min
        data.push({
          time: weeks[i],
          flow: waterFlow
        });
      }
      return data;
    } else {
      // Year view
      const data = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < months.length; i++) {
        const waterFlow = Math.round((baseFlow + (8 * flowMultiplier) * 
          Math.sin((i / months.length) * Math.PI * (2 + provinceVariation))) / 60); // Convert to cm³/min
        data.push({
          time: months[i],
          flow: waterFlow
        });
      }
      return data;
    }
  };

  // Filter district data for the latest graph point
  const getLatestDistrictData = () => {
    if (!waterData.length || !districtData.length) return [];

    const latestPoint = waterData
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (!latestPoint) return [];

    return districtData
      .filter(item => item.timestamp === latestPoint.timestamp)
      .sort((a, b) => a.district.localeCompare(b.district));
  };

  const latestDistrictData = getLatestDistrictData();

  // Get latest water data for consistent display (same as dashboard)
  const getLatestWaterData = () => {
    if (!waterData.length) return { flow_rate_lph: 0, status: 'normal' };
    
    return waterData
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  const latestWaterData = getLatestWaterData();

  // Function to get historical data for a specific timestamp
  const getHistoricalDataForTimestamp = (timestamp: string) => {
    // Find the water data point for this timestamp
    const waterPoint = waterData.find(item => item.timestamp === timestamp);
    if (!waterPoint) return null;

    // Get district data for this timestamp
    const districtDataForTimestamp = districtData.filter(item => item.timestamp === timestamp);
    
    // Get critical readings for this timestamp (if any)
    const criticalReadingsForTimestamp = criticalReadings.filter(item => 
      new Date(item.timestamp || '').getTime() <= new Date(timestamp).getTime()
    );

    return {
      waterData: waterPoint,
      districtData: districtDataForTimestamp,
      criticalReadings: criticalReadingsForTimestamp,
      timestamp: timestamp
    };
  };

  const chartData = generateChartData();
  
  // Use real-time district data from WebSocket
  const processedDistrictData = latestDistrictData.map((item, index) => ({
    id: index + 1,
    district: item.district,
    waterflow: `${item.flow_rate.toFixed(2)} lph`,
    status: item.status
  }));

  return (
    <MainLayout>
      <div className="pt-2 px-6 pb-6 bg-gray-50 min-h-screen space-y-4">
        {/* Header */}
          <div className="flex items-center gap-3">
          <img src={currentProvince?.icon} alt={currentProvince?.name} className="h-8 w-8 object-contain" />
              <h1 className="text-2xl font-bold text-foreground">{currentProvince?.name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Main Chart */}
          <div className="md:col-span-2">
        {/* Real Time Monitoring Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Real Time Monitoring - {currentProvince?.name}</CardTitle>
              <p className="text-sm text-gray-500">Live water flow and pressure monitoring</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{currentTime}</span>
                      <Clock className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <div className="flex gap-1">
                {(['D', 'M', 'Y'] as const).map((period) => (
                  <Button
                    key={period}
                    variant={timeRange === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(period)}
                    className={timeRange === period ? 'bg-blue-500 hover:bg-blue-600' : ''}
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80 relative">
              {chartData.length === 0 && timeRange === 'D' ? (
                <div className="flex items-center justify-center h-full text-gray-500">Loading real-time data...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                    margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                    onClick={(data) => {
                      if (data && data.activePayload && data.activePayload[0]) {
                        const pointData = data.activePayload[0].payload;
                        if (pointData && pointData.fullData) {
                          const historicalData = getHistoricalDataForTimestamp(pointData.fullData.timestamp);
                          setSelectedHistoricalData(historicalData);
                          setIsHistoricalView(true);
                        }
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="flowLineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0095ff" />
                        <stop offset="100%" stopColor="#0095ff" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis 
                       dataKey="time" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={false}
                       hide={true}
                     />
                    <YAxis hide />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ stroke: '#ccc', strokeWidth: 1 }}
                      allowEscapeViewBox={{ x: true, y: true }}
                      wrapperStyle={{ zIndex: 100 }}
                    />
                    <Line 
                      type="monotone"
                      dataKey="flow" 
                      stroke="#0095ff"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: '#fff', stroke: '#0095ff', strokeWidth: 3 }}
                      isAnimationActive={false}
                      connectNulls={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              <div className="flex items-center justify-end space-x-6 absolute bottom-[-15px] right-4">
                <div className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-xs text-gray-600">water flow</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
          
          {/* Right Column - Past Hour and Average */}
          <div>
            {/* Past Hour Card */}
            <div className="bg-white mb-6 rounded-lg shadow-sm">
              <div className="p-4">
                <div className="flex flex-col mb-2">
                  <div className="text-base font-medium mb-1">Past Minute</div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-gray-400" />
                    <span className="text-xs text-gray-400">{currentTime}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center my-2 relative">
                  {/* Blue Circle for Flow */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-30 h-20 rounded-full bg-blue-500 text-white z-10 mb-1">
                      <div className="text-center">
                        <span className="text-base font-small px-1">
                          {isHistoricalView && selectedHistoricalData 
                            ? selectedHistoricalData.waterData.flow_rate_lph.toFixed(2)
                            : pastHour.average.toFixed(2)
                          } lph
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {isHistoricalView ? 'Historical Flow' : 'Past Hour Average'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center mt-3">
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-1 text-foreground" />
                    <span className="mr-1 text-xs font-bold text-foreground">Status</span>
                    <div className="text-green-700 text-xs px-3 py-1 rounded-full font-medium" style={{backgroundColor: 'rgba(52, 211, 153, 0.25)', border: '1px solid rgba(52, 211, 153, 0.5)'}}>
                     {pastHour.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Average Card */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4">
                <div className="text-base font-medium mb-3">Average</div>
                
                <div className="flex items-center justify-center my-2 relative">
                  {/* Blue Circle for Flow */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-30 h-20 rounded-full bg-blue-500 text-white z-10 mb-1">
                      <div className="text-center">
                        <span className="text-base font-medium px-1 ">{dailyAverage.average.toFixed(2)} lph</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">Daily Average</span>
                  </div>
                </div>
                <div className="flex items-center justify-center mt-3">
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-1 text-foreground" />
                    <span className="mr-1 text-xs font-bold text-foreground">Status</span>
                    <div className="text-green-700 text-xs px-3 py-1 rounded-full font-medium" style={{backgroundColor: 'rgba(52, 211, 153, 0.25)', border: '1px solid rgba(52, 211, 153, 0.5)'}}>
                    {dailyAverage.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h2 className="text-lg font-medium">History</h2>
              <span className="text-sm text-gray-500 ml-1">
                {isHistoricalView && selectedHistoricalData 
                  ? `(${new Date(selectedHistoricalData.timestamp).toLocaleTimeString()})`
                  : '(past hour)'
                }
              </span>
            </div>
            <div className="flex gap-2">
              {isHistoricalView && (
                <button 
                  className="bg-gray-500 text-white text-sm px-3 py-1 rounded-md"
                  onClick={() => {
                    setIsHistoricalView(false);
                    setSelectedHistoricalData(null);
                  }}
                >
                  Back to Current
                </button>
              )}
              <button className="bg-blue-500 text-white text-sm px-3 py-1 rounded-md">
                See more
              </button>
            </div>
          </div>
          
          {/* History Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
              <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left text-sm font-medium">N°</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">District</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Waterflow</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
              <tbody>
                {processedDistrictData.length > 0 ? (
                  processedDistrictData.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3 px-4 text-sm">{item.id}</td>
                      <td className="py-3 px-4 text-sm">{item.district}</td>
                      <td className="py-3 px-4 text-sm">{item.waterflow}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.status as any} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-sm text-gray-500 text-center">
                      No district data available 
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>
        </div>

        {/* Historical Data Display */}
        {selectedHistoricalData && (
          <div className="mt-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Historical Data</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedHistoricalData(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {new Date(selectedHistoricalData.timestamp).toLocaleString()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Water Flow Data */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Water Flow</h3>
                  <div className="text-2xl font-bold text-blue-900">
                    {selectedHistoricalData.waterData.flow_rate_lph.toFixed(2)} lph
                  </div>
                  <StatusBadge status={selectedHistoricalData.waterData.status as any} />
                </div>
                
                {/* District Count */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800 mb-2">Districts</h3>
                  <div className="text-2xl font-bold text-green-900">
                    {selectedHistoricalData.districtData.length}
                  </div>
                  <span className="text-xs text-green-600">Active districts</span>
                </div>
              </div>
            </div>

            {/* District Data for Selected Time */}
            {selectedHistoricalData.districtData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm mb-4">
                <h3 className="text-lg font-medium p-4 border-b">District Data at {new Date(selectedHistoricalData.timestamp).toLocaleTimeString()}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left text-sm font-medium">N°</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">District</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Waterflow</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedHistoricalData.districtData.map((item, index) => (
                        <tr key={`${item.timestamp}-${item.district}`} className="border-b">
                          <td className="py-3 px-4 text-sm">{index + 1}</td>
                          <td className="py-3 px-4 text-sm">{item.district}</td>
                          <td className="py-3 px-4 text-sm">{item.flow_rate.toFixed(2)} lph</td>
                          <td className="py-3 px-4">
                            <StatusBadge status={item.status as any} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Critical Readings for Selected Time */}
            {selectedHistoricalData.criticalReadings.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <h3 className="text-lg font-medium p-4 border-b">Critical Readings at {new Date(selectedHistoricalData.timestamp).toLocaleTimeString()}</h3>
                <div className="p-4">
                  {selectedHistoricalData.criticalReadings.map((reading, index) => (
                    <div key={index} className="bg-red-50 p-3 rounded-lg mb-2">
                      <div className="flex items-center mb-2">
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-2">
                          <Activity className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-medium">{reading.province}/{reading.district}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                            <span className="text-sm">{reading.waterflow.toFixed(2)} lph</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Activity className="w-3 h-3 mr-1 text-foreground" />
                          <span className="mr-1 text-xs font-bold text-foreground">Status</span>
                          <StatusBadge status={reading.status as any} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Critical Readings Section */}
        <div className="mt-8 mb-6">
          <h2 className="text-lg font-medium mb-4">Current Critical Readings (Last 24 Hours)</h2>
          {criticalReadings.length > 0 ? (
            criticalReadings.map((reading, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <div className="flex items-center mb-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                    <Activity className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-medium">{reading.province}/{reading.district}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm">{reading.waterflow.toFixed(2)} lph</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Activity className="w-3 h-3 mr-1 text-foreground" />
                    <span className="mr-1 text-xs font-bold text-foreground">Status</span>
                    <StatusBadge status={reading.status as any} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500 text-center">No critical readings available</div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ProvinceMonitor;
