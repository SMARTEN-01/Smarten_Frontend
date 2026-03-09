import { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Activity, ChevronDown, RefreshCw, AlertTriangle, Trash2, Droplets, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts';
import {useWaterReadings} from '@/hooks/useWaterReadings';
import { useMonitorData } from '@/contexts/MonitorDataContext';
import { simulateWater, stopSimulateWater } from '@/services/api';

// Import province icons
// Define province icons as absolute paths (assets are in the public/assets directory)
const NorthIcon = '/assets/North.svg';
const SouthIcon = '/assets/South.svg';
const EastIcon = '/assets/East.svg';
const WestIcon = '/assets/West.svg';
const KigaliIcon = '/assets/Kigali.svg';
const GroupIcon = '/assets/Group.svg';

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

const StatusBadge = ({ status }: { status: string }) => {
  // Normalize status to lowercase and trim whitespace
  const normalizedStatus = status?.toLowerCase().trim() as 'normal' | 'underflow' | 'overflow' | string;

  const getStatusDetails = () => {
    switch (normalizedStatus) {
      case 'normal':
        return { 
          textColor: 'text-green-700', 
          bgColor: 'rgba(52, 211, 153, 0.25)', 
          borderColor: 'rgba(52, 211, 153, 0.5)',
          text: 'normal' 
        };
      case 'underflow':
        return { 
          textColor: 'text-orange-700', 
          bgColor: 'rgba(251, 146, 60, 0.25)', 
          borderColor: 'rgba(251, 146, 60, 0.5)',
          text: 'underflow' 
        };
      case 'overflow':
        return { 
          textColor: 'text-red-700', 
          bgColor: 'rgba(239, 68, 68, 0.25)', 
          borderColor: 'rgba(239, 68, 68, 0.5)',
          text: 'overflow' 
        };
      default:
        return { 
          textColor: 'text-foreground', 
          bgColor: 'rgba(156, 163, 175, 0.25)', 
          borderColor: 'rgba(156, 163, 175, 0.5)',
          text: `unknown (${status})` // Show raw status for debugging
        };
    }
  };

  const { textColor, bgColor, borderColor, text } = getStatusDetails();

  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${textColor}`} 
           style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
        {text}
      </div>
    </div>
  );
};


const Monitor = () => {
  const [selectedProvince, setSelectedProvince] = useState('Northern');
  const [timeRange, setTimeRange] = useState<'D' | 'M' | 'Y'>('D');
  const [currentTime, setCurrentTime] = useState('16:00 PM');
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [activeDataPoint, setActiveDataPoint] = useState<number | null>(null);
  const [selectedHistoricalData, setSelectedHistoricalData] = useState<{
    waterData: any;
    districtData: any[];
    criticalReadings: any[];
    timestamp: string;
  } | null>(null);
  const [isHistoricalView, setIsHistoricalView] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // History pagination (6 per page)
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 6;

  // Use WebSocket hook
  const { waterData, districtData, criticalReadings, pastHour, dailyAverage, connectionStatus, errorMessage, isDataStale } = useWaterReadings(selectedProvince);
  const { clearData, getConnectionStatus } = useMonitorData();
  
  console.log("Fetched real time data for", selectedProvince, ":", waterData);
  console.log("Number of data points:", waterData.length);
  
  
  useEffect(() => {
    // Update the current time every minute
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

  // Reset pagination when switching between historical and current views
  useEffect(() => {
    setHistoryPage(1);
  }, [isHistoricalView]);

  // Process WebSocket data for daily chart with improved connectivity
  const processChartData = (rawData: { flow_rate_lph: number; status: string; timestamp: string; province: string }[]) => {
    if (!rawData.length) return [];

    // Filter and sort data to ensure proper chronological order for line connectivity
    const filteredData = rawData
      .filter(item => item.province === selectedProvince && 
                     item.flow_rate_lph != null && 
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
console.log(latestDistrictData)

// Pagination logic for history data
const totalHistoryPages = Math.max(1, Math.ceil(latestDistrictData.length / HISTORY_PAGE_SIZE));
const historyStartIndex = (historyPage - 1) * HISTORY_PAGE_SIZE;
const historyEndIndex = historyStartIndex + HISTORY_PAGE_SIZE;
const paginatedHistoryData = latestDistrictData.slice(historyStartIndex, historyEndIndex);

// Get latest water data for consistent display (same as dashboard and provincial monitor)
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

  // Get province-specific data constants
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
        const waterFlow = Math.round(baseFlow + (10 * flowMultiplier) * 
          Math.sin((i / weeks.length) * Math.PI * (6 + provinceVariation)));
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
        const waterFlow = Math.round(baseFlow + (8 * flowMultiplier) * 
          Math.sin((i / months.length) * Math.PI * (2 + provinceVariation)));
        data.push({
          time: months[i],
          flow: waterFlow
        });
      }
      return data;
    }
  };

  // Provinces data for dropdown with official icons
  const provinces = [
    { id: 'north', name: 'Northern', color: 'bg-[#F7D917]', letter: 'N', iconSrc: NorthIcon },
    { id: 'south', name: 'Southern', color: 'bg-[#396EB0]', letter: 'S', iconSrc: SouthIcon },
    { id: 'east', name: 'Eastern', color: 'bg-[#FD7E14]', letter: 'E', iconSrc: EastIcon },
    { id: 'west', name: 'Western', color: 'bg-[#22C55E]', letter: 'W', iconSrc: WestIcon },
    { id: 'kigali', name: 'Kigali', color: 'bg-[#AF52DE]', letter: 'K', iconSrc: KigaliIcon },
  ];

  // Get current values based on province and time range
  const getCurrentValues = () => {
    // Get data for current province
    const { baseFlow } = getProvinceData(selectedProvince);
    
    // Add variation based on time range
    let flowModifier = 0;
    
    if (timeRange === 'M') {
      flowModifier = 2;
    } else if (timeRange === 'Y') {
      flowModifier = 4;
    }
    
    return { 
      flow: `${baseFlow + flowModifier} cm³/h`
    };
  };
  
  // Get past hour values based on province
  const getPastHourValues = () => {
    // Get data for current province with slight variations
    const { baseFlow } = getProvinceData(selectedProvince);
    const pastHourFlow = baseFlow - 2; // Slightly lower than current
    
    return { 
      flow: `${pastHourFlow} cm³/h`
    };
  };
  
  // Get average values based on province and time range
  const getAverageValues = () => {
    // Get data for current province
    const { baseFlow } = getProvinceData(selectedProvince);
    
    // Average is usually close to base flow
    return { 
      flow: `${baseFlow} cm³/h`
    };
  };
  
  const getActiveProvince = () => {
    return provinces.find(p => p.name === selectedProvince) || provinces[0];
  };

  const chartData = generateChartData();
  const currentValues = getCurrentValues();
  const pastHourValues = getPastHourValues();
  const averageValues = getAverageValues();
  const activeProvince = getActiveProvince();

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    setShowProvinceDropdown(false);
  };

  const [isSimulatingWater, setIsSimulatingWater] = useState(false);

  const handleSimulateWater = async () => {
    setIsSimulatingWater(true);
    try {
      await simulateWater();
      // Optional: show a toast or message
    } catch (err) {
      console.error('Error simulating water:', err);
      setIsSimulatingWater(false);
    }
  };

  const handleStopSimulateWater = async () => {
    try {
      await stopSimulateWater();
    } catch (err) {
      console.error('Error stopping water simulation:', err);
    } finally {
      setIsSimulatingWater(false);
    }
  };

  return (
    <MainLayout title={selectedProvince}>
      {/* Data Status Indicator */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isDataStale && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">Data may be outdated</span>
            </div>
          )}
          {connectionStatus === 'connected' && !isDataStale && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">Live data</span>
            </div>
          )}
          {connectionStatus === 'error' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">Connection error</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Connection Status for All Provinces */}
          <div className="flex items-center gap-1">
            {['Northern', 'Southern', 'Eastern', 'Western', 'Kigali'].map(province => {
              const status = getConnectionStatus()[province];
              return (
                <div
                  key={province}
                  className={`w-2 h-2 rounded-full ${
                    status?.isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={`${province}: ${status?.isConnected ? 'Connected' : 'Disconnected'}`}
                />
              );
            })}
          </div>
          
          <div className="flex gap-1 items-center border-r pr-2 mr-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateWater}
                disabled={isSimulatingWater}
                className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Droplets className={`w-4 h-4 ${isSimulatingWater ? 'animate-pulse' : ''}`} />
                {isSimulatingWater ? 'Simulating...' : 'Simulate'}
              </Button>
              {isSimulatingWater && (
                <Button variant="outline" size="sm" onClick={handleStopSimulateWater} className="text-red-500 border-red-200 hover:bg-red-50">
                    Stop
                </Button>
              )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={clearData}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Data
          </Button>
        </div>
      </div>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Main Chart */}
          <div className="md:col-span-2">
            {/* Header with Province Selection and Time Period Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 cursor-pointer relative" onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}>
                <div className="h-8 w-8 flex items-center justify-center">
                  <img src={activeProvince.iconSrc} alt={activeProvince.name} className="h-8 w-8 object-contain" />
                </div>
                <h2 className="text-lg font-semibold">{activeProvince.name}</h2>
                <ChevronDown className="h-4 w-4 text-gray-500" />
                
                {/* Province Dropdown */}
                {showProvinceDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white shadow-lg rounded-md z-10">
                    {provinces.map(province => (
                      <div 
                        key={province.id}
                        className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleProvinceSelect(province.name)}
                      >
                        <div className="h-6 w-6 flex items-center justify-center mr-2">
                          <img src={province.iconSrc} alt={province.name} className="h-6 w-6 object-contain" />
                        </div>
                        <span className="text-sm">{province.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Real Time Monitoring Chart Card */}
            <Card className="mb-6 shadow-sm border border-gray-100">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-medium">Real time monitoring</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{currentTime}</span>
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4 px-4">
                <div className="flex items-center justify-end mb-2">
                  
                  <div className="flex items-center justify-end gap-1 mb-4">
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium cursor-pointer ${
                        timeRange === 'D' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                      onClick={() => setTimeRange('D')}
                    >
                      D
                    </div>
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium cursor-pointer ${
                        timeRange === 'M' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                      onClick={() => setTimeRange('M')}
                    >
                      M
                    </div>
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium cursor-pointer ${
                        timeRange === 'Y' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                      onClick={() => setTimeRange('Y')}
                    >
                      Y
                    </div>
                  </div>
                </div>
                
                {/* Chart */}
                <div className="w-full h-56 relative">
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
                     {isHistoricalView && selectedHistoricalData 
                       ? selectedHistoricalData.waterData.status
                       : pastHour.status
                     }
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
                        <span className="text-base font-medium px-1 ">
                          {isHistoricalView && selectedHistoricalData 
                            ? selectedHistoricalData.waterData.flow_rate_lph.toFixed(2)
                            : dailyAverage.average.toFixed(2)
                          } lph
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {isHistoricalView ? 'Historical Flow' : 'Daily Average'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center mt-3">
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-1 text-foreground" />
                    <span className="mr-1 text-xs font-bold text-foreground">Status</span>
                    <div className="text-green-700 text-xs px-3 py-1 rounded-full font-medium" style={{backgroundColor: 'rgba(52, 211, 153, 0.25)', border: '1px solid rgba(52, 211, 153, 0.5)'}}>
                    {isHistoricalView && selectedHistoricalData 
                      ? selectedHistoricalData.waterData.status
                      : dailyAverage.status
                    }
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
              {(isHistoricalView && selectedHistoricalData ? selectedHistoricalData.districtData : paginatedHistoryData).length > 0 ? (
                  (isHistoricalView && selectedHistoricalData ? selectedHistoricalData.districtData : paginatedHistoryData).map((item, index) => (
                    <tr key={`${item.timestamp}-${item.district}`} className="border-b">
                      <td className="py-3 px-4 text-sm">{historyStartIndex + index + 1}</td>
                      <td className="py-3 px-4 text-sm">{item.district}</td>
                      <td className="py-3 px-4 text-sm">{item.flow_rate.toFixed(2)} lph</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.status} />
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
          
          {/* Pagination controls - only show for current view (not historical) and when there are more than 6 records */}
          {!isHistoricalView && latestDistrictData.length > HISTORY_PAGE_SIZE && (
            <div className="flex items-center justify-center gap-3 mt-4 select-none">
              <button
                className={`px-2 py-1 text-sm ${historyPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-foreground hover:text-foreground'}`}
                onClick={() => historyPage > 1 && setHistoryPage(1)}
                disabled={historyPage === 1}
                aria-label="First page"
              >
                «
              </button>
              <button
                className={`px-2 py-1 text-sm ${historyPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-foreground hover:text-foreground'}`}
                onClick={() => historyPage > 1 && setHistoryPage(historyPage - 1)}
                disabled={historyPage === 1}
                aria-label="Previous page"
              >
                ‹
              </button>
              {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === historyPage;
                return (
                  <button
                    key={pageNum}
                    className={`min-w-[28px] h-7 rounded-md text-sm font-medium ${isActive ? 'bg-blue-500 text-white' : 'text-foreground hover:bg-gray-100'}`}
                    onClick={() => setHistoryPage(pageNum)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className={`px-2 py-1 text-sm ${historyPage === totalHistoryPages ? 'text-gray-300 cursor-not-allowed' : 'text-foreground hover:text-foreground'}`}
                onClick={() => historyPage < totalHistoryPages && setHistoryPage(historyPage + 1)}
                disabled={historyPage === totalHistoryPages}
                aria-label="Next page"
              >
                ›
              </button>
              <button
                className={`px-2 py-1 text-sm ${historyPage === totalHistoryPages ? 'text-gray-300 cursor-not-allowed' : 'text-foreground hover:text-foreground'}`}
                onClick={() => historyPage < totalHistoryPages && setHistoryPage(totalHistoryPages)}
                disabled={historyPage === totalHistoryPages}
                aria-label="Last page"
              >
                »
              </button>
            </div>
          )}
        </div>

        {/* Critical Readings */}
        <div className="mt-8 mb-6">
          <h2 className="text-lg font-medium mb-4">
            {isHistoricalView && selectedHistoricalData 
              ? `Critical Readings at ${new Date(selectedHistoricalData.timestamp).toLocaleTimeString()}`
              : 'Critical Readings (Last 24 Hours)'
            }
          </h2>
          {(isHistoricalView && selectedHistoricalData ? selectedHistoricalData.criticalReadings : criticalReadings).length > 0 ? (
            (isHistoricalView && selectedHistoricalData ? selectedHistoricalData.criticalReadings : criticalReadings).map((reading, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <div className="flex items-center mb-2">
                  <img src={GroupIcon} alt="Group Icon" className="w-5 h-5 mr-2" />
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
                    <Activity className="w-3 h-3 mr-1 text-black" />
                    <span className="mr-1 text-xs font-bold text-black">Status</span>
                    <StatusBadge status={reading.status} />
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
        
        {/* Critical Readings Section */}
        {/* <div className="mt-8 mb-6">
          <h2 className="text-lg font-medium mb-4">Critical readings</h2>
          
          <div className="space-y-4"> */}
            {/* Critical Item 1 */}
            {/* <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <img src={GroupIcon} alt="Group Icon" className="w-5 h-5 mr-2" />
                <span className="font-medium">North/Rulindo/Base</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6"> */}
                  {/* <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm">24 cm³/h</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Activity className="w-3 h-3 mr-1 text-black" />
                  <span className="mr-1 text-xs font-bold text-black">Status</span>
                  <div className="text-orange-700 text-xs px-4 py-2 rounded-full font-medium" style={{backgroundColor: 'rgba(251, 146, 60, 0.5)', border: '1px solid rgba(251, 146, 60, 0.8)', opacity: 0.9}}>
                    underflow
                  </div>
                </div>
              </div>
            </div> */}
            
            {/* Critical Item 2 */}
            {/* <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <img src={GroupIcon} alt="Group Icon" className="w-5 h-5 mr-2" />
                <span className="font-medium">Kigali/Kicukiro/Kamashashi</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm">24 cm³/h</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Activity className="w-3 h-3 mr-1 text-black" />
                  <span className="mr-1 text-xs font-bold text-black">Status</span>
                  <div className="text-red-700 text-xs px-4 py-2 rounded-full font-medium" style={{backgroundColor: 'rgba(239, 68, 68, 0.5)', border: '1px solid rgba(239, 68, 68, 0.8)', opacity: 0.9}}>
                    overflow
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </MainLayout>
  );
};

export default Monitor;
