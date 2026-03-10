import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowUpRight, CheckCircle, MapPin, Activity, Clock, Timer, Calendar, ArrowLeftRight, MoveHorizontal, RefreshCw } from 'lucide-react';
import { useMonitorData } from '@/contexts/MonitorDataContext';
import { getRecentLeak, getTotalLeakagesPerProvince, getDeviceCount, getUserCountPerProvince } from '@/services/api.js';

const Dashboard = () => {
  const { monitorData } = useMonitorData();
  
  // State for recent leakage data
  const [recentLeakage, setRecentLeakage] = useState({
    waterLost: '20',
    timeTaken: '20',
    location: 'Kigali, Kicukiro-Kamashahi',
    status: 'Resolved',
    severity: 'High',
    occurredAt: '',
    leakId: null
  });
  const [leakageLoading, setLeakageLoading] = useState(false);
  const [leakageError, setLeakageError] = useState('');
  
  // State for total leakages per province
  const [leakageStats, setLeakageStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  
  // State for device count data
  const [deviceData, setDeviceData] = useState([]);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [deviceError, setDeviceError] = useState('');
  
  // State for user count data
  const [userCountData, setUserCountData] = useState([]);
  const [userCountLoading, setUserCountLoading] = useState(false);
  const [userCountError, setUserCountError] = useState('');
  
  // Province mapping for WebSocket data
  const provinceMapping = {
    'north': 'Northern',
    'south': 'Southern', 
    'east': 'Eastern',
    'west': 'Western',
    'kigali': 'Kigali'
  };

  // Fetch recent leakage data
  useEffect(() => {
    const fetchRecentLeakage = async () => {
      try {
        setLeakageLoading(true);
        setLeakageError('');
        const res = await getRecentLeak();
        /* console.log("Received Recent Leakage Data ", res.data); */
        
        if (res.data.leak) {
          const leak = res.data.leak;
          const occurredDate = new Date(leak.occurred_at);
          const now = new Date();
          const timeDiff = Math.floor((now - occurredDate) / (1000 * 60)); // minutes
          
          setRecentLeakage({
            waterLost: leak.water_lost_litres.toFixed(2),
            timeTaken: timeDiff.toString(),
            location: leak.location,
            status: mapLeakageStatus(leak.status),
            severity: leak.severity,
            occurredAt: leak.occurred_at,
            leakId: leak.leak_id
          });
        }
      } catch (err) {
        setLeakageError(err.message || 'Failed to fetch recent leakage data');
        /* console.log("Failed to fetch recent leakage data", err.message); */
        // Keep default values on error
      } finally {
        setLeakageLoading(false);
      }
    };
    
    fetchRecentLeakage();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchRecentLeakage, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch total leakages per province
  useEffect(() => {
    const fetchLeakageStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError('');
        const res = await getTotalLeakagesPerProvince();
        /* console.log("Received Leakage Stats Data ", res.data); */
        
        if (res.data.provinces) {
          const stats = res.data.provinces.map(province => ({
            region: province.province,
            count: province.total_leakages,
            color: getProvinceColor(province.province),
            textColor: getProvinceTextColor(province.province),
            iconSrc: getProvinceIcon(province.province)
          }));
          setLeakageStats(stats);
        }
      } catch (err) {
        setStatsError(err.message || 'Failed to fetch leakage statistics');
        /* console.log("Failed to fetch leakage statistics", err.message); */
        // Keep default values on error
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchLeakageStats();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchLeakageStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch device count data
  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        setDeviceLoading(true);
        setDeviceError('');
        const res = await getDeviceCount();
        /* console.log("Received Device Count Data ", res.data); */
        
        if (res.data) {
          const devices = [
            { id: 1, type: 'ESP32', total: res.data.ESP32 || 0 },
            { id: 2, type: 'Smart Valves', total: res.data['Smart Valves'] || 0 },
            { id: 3, type: 'Sensors', total: res.data.Sensor || 0 },
          ];
          setDeviceData(devices);
        }
      } catch (err) {
        setDeviceError(err.message || 'Failed to fetch device data');
        /* console.log("Failed to fetch device data", err.message); */
        // Keep default values on error
        setDeviceData([
          { id: 1, type: 'ESP32', total: 0 },
          { id: 2, type: 'Smart Valves', total: 0 },
          { id: 3, type: 'Sensors', total: 0 },
        ]);
      } finally {
        setDeviceLoading(false);
      }
    };
    
    fetchDeviceData();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchDeviceData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch user count data
  useEffect(() => {
    const fetchUserCountData = async () => {
      try {
        setUserCountLoading(true);
        setUserCountError('');
        const res = await getUserCountPerProvince();
        /* console.log("Received User Count Data ", res.data); */
        
        if (res.data && res.data.provinces) {
          const userCounts = res.data.provinces.map(province => ({
            region: province.province,
            value: province.user_count || 0,
            unit: 'users',
            bgColor: getProvinceBgColor(province.province),
            textColor: getProvinceTextColor(province.province),
            iconText: getProvinceInitial(province.province),
            iconSrc: getProvinceIcon(province.province)
          }));
          setUserCountData(userCounts);
        }
      } catch (err) {
        setUserCountError(err.message || 'Failed to fetch user count data');
        /* console.log("Failed to fetch user count data", err.message); */
        // Keep default values on error
        setUserCountData([
          { region: 'North', value: 0, unit: 'users', bgColor: 'bg-yellow-50', textColor: 'text-yellow-500', iconText: 'N', iconSrc: '/assets/North.svg' },
          { region: 'South', value: 0, unit: 'users', bgColor: 'bg-blue-50', textColor: 'text-blue-500', iconText: 'S', iconSrc: '/assets/South.svg' },
          { region: 'East', value: 0, unit: 'users', bgColor: 'bg-orange-50', textColor: 'text-orange-500', iconText: 'E', iconSrc: '/assets/East.svg' },
          { region: 'West', value: 0, unit: 'users', bgColor: 'bg-green-50', textColor: 'text-green-500', iconText: 'W', iconSrc: '/assets/West.svg' },
          { region: 'Kigali', value: 0, unit: 'users', bgColor: 'bg-purple-50', textColor: 'text-purple-500', iconText: 'K', iconSrc: '/assets/Kigali.svg' },
        ]);
      } finally {
        setUserCountLoading(false);
      }
    };
    
    fetchUserCountData();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchUserCountData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Map backend status to frontend status
  const mapLeakageStatus = (status) => {
    switch (status.toUpperCase()) {
      case 'INVESTIGATING':
        return 'Investigating';
      case 'RESOLVED':
        return 'Resolved';
      case 'PENDING':
        return 'Pending';
      default:
        return 'Resolved';
    }
  };

  // Helper functions for province styling
  const getProvinceColor = (province) => {
    switch (province) {
      case 'Northern': return 'rgba(254, 240, 138, 0.25)';
      case 'Southern': return 'rgba(191, 219, 254, 0.25)';
      case 'Eastern': return 'rgba(253, 186, 116, 0.25)';
      case 'Western': return 'rgba(167, 243, 208, 0.25)';
      case 'Kigali': return 'rgba(233, 213, 255, 0.25)';
      default: return 'rgba(191, 219, 254, 0.25)';
    }
  };

  const getProvinceTextColor = (province) => {
    switch (province) {
      case 'Northern': return 'rgba(250, 204, 21, 0.6)';
      case 'Southern': return 'rgba(96, 165, 250, 0.6)';
      case 'Eastern': return 'rgba(251, 146, 60, 0.6)';
      case 'Western': return 'rgba(52, 211, 153, 0.6)';
      case 'Kigali': return 'rgba(192, 132, 252, 0.6)';
      default: return 'rgba(96, 165, 250, 0.6)';
    }
  };

  const getProvinceIcon = (province) => {
    switch (province) {
      case 'Northern': return '/assets/North.svg';
      case 'Southern': return '/assets/South.svg';
      case 'Eastern': return '/assets/East.svg';
      case 'Western': return '/assets/West.svg';
      case 'Kigali': return '/assets/Kigali.svg';
      default: return '/assets/South.svg';
    }
  };

  const getProvinceBgColor = (province) => {
    switch (province) {
      case 'Northern': return 'bg-yellow-50 dark:bg-yellow-950';
      case 'Southern': return 'bg-blue-50 dark:bg-blue-950';
      case 'Eastern': return 'bg-orange-50 dark:bg-orange-950';
      case 'Western': return 'bg-green-50 dark:bg-green-950';
      case 'Kigali': return 'bg-purple-50 dark:bg-purple-950';
      default: return 'bg-blue-50 dark:bg-blue-950';
    }
  };

  const getProvinceInitial = (province) => {
    switch (province) {
      case 'Northern': return 'N';
      case 'Southern': return 'S';
      case 'Eastern': return 'E';
      case 'Western': return 'W';
      case 'Kigali': return 'K';
      default: return 'S';
    }
  };

  // Get daily average data for each province
  const getProvinceData = (provinceId: string) => {
    const provinceName = provinceMapping[provinceId as keyof typeof provinceMapping];
    const dailyAverage = monitorData.dailyAverage[provinceName];
    
    if (dailyAverage && dailyAverage.average) {
      return dailyAverage.average.toFixed(2);
    }
    return '0.00';
  };

  const regions = [
    { 
      id: 'north', 
      name: 'North', 
      value: getProvinceData('north'), 
      unit: 'lph', 
      bgColor: 'bg-card', 
      textColor: 'text-foreground',
      iconBg: 'bg-yellow-500',
      iconText: 'N',
      iconSrc: '/assets/North.svg'
    },
    { 
      id: 'south', 
      name: 'South', 
      value: getProvinceData('south'), 
      unit: 'lph', 
      bgColor: 'bg-card', 
      textColor: 'text-foreground',
      iconBg: 'bg-blue-500',
      iconText: 'S',
      iconSrc: '/assets/South.svg'
    },
    { 
      id: 'east', 
      name: 'East', 
      value: getProvinceData('east'), 
      unit: 'lph', 
      bgColor: 'bg-card', 
      textColor: 'text-foreground',
      iconBg: 'bg-orange-500',
      iconText: 'E',
      iconSrc: '/assets/East.svg'
    },
    { 
      id: 'west', 
      name: 'West', 
      value: getProvinceData('west'), 
      unit: 'lph', 
      bgColor: 'bg-card',
      textColor: 'text-foreground', 
      iconBg: 'bg-green-500',
      iconText: 'W',
      iconSrc: '/assets/West.svg'
    },
    { 
      id: 'kigali', 
      name: 'Kigali', 
      value: getProvinceData('kigali'), 
      unit: 'lph', 
      bgColor: 'bg-card', 
      textColor: 'text-foreground',
      iconBg: 'bg-purple-500',
      iconText: 'K',
      iconSrc: '/assets/Kigali.svg'
    },
  ];

  // Use real leakage stats or fallback to default
  const displayStats = leakageStats.length > 0 ? leakageStats : [
    { region: 'Northern', count: 0, color: 'rgba(254, 240, 138, 0.25)', textColor: 'rgba(250, 204, 21, 0.6)', iconSrc: '/assets/North.svg' },
    { region: 'Southern', count: 0, color: 'rgba(191, 219, 254, 0.25)', textColor: 'rgba(96, 165, 250, 0.6)', iconSrc: '/assets/South.svg' },
    { region: 'Eastern', count: 0, color: 'rgba(253, 186, 116, 0.25)', textColor: 'rgba(251, 146, 60, 0.6)', iconSrc: '/assets/East.svg' },
    { region: 'Western', count: 0, color: 'rgba(167, 243, 208, 0.25)', textColor: 'rgba(52, 211, 153, 0.6)', iconSrc: '/assets/West.svg' },
    { region: 'Kigali', count: 0, color: 'rgba(233, 213, 255, 0.25)', textColor: 'rgba(192, 132, 252, 0.6)', iconSrc: '/assets/Kigali.svg' },
  ];

  // Use real user count data or fallback to default
  const customerData = userCountData.length > 0 ? userCountData : [
    { region: 'North', value: 0, unit: 'users', bgColor: 'bg-yellow-50 dark:bg-yellow-950', textColor: 'text-yellow-500 dark:text-yellow-400', iconText: 'N', iconSrc: '/assets/North.svg' },
    { region: 'South', value: 0, unit: 'users', bgColor: 'bg-blue-50 dark:bg-blue-950', textColor: 'text-blue-500 dark:text-blue-400', iconText: 'S', iconSrc: '/assets/South.svg' },
    { region: 'East', value: 0, unit: 'users', bgColor: 'bg-orange-50 dark:bg-orange-950', textColor: 'text-orange-500 dark:text-orange-400', iconText: 'E', iconSrc: '/assets/East.svg' },
    { region: 'West', value: 0, unit: 'users', bgColor: 'bg-green-50 dark:bg-green-950', textColor: 'text-green-500 dark:text-green-400', iconText: 'W', iconSrc: '/assets/West.svg' },
    { region: 'Kigali', value: 0, unit: 'users', bgColor: 'bg-purple-50 dark:bg-purple-950', textColor: 'text-purple-500 dark:text-purple-400', iconText: 'K', iconSrc: '/assets/Kigali.svg' },
  ];

  // Use real device data or fallback to default
  const displayDevices = deviceData.length > 0 ? deviceData : [
    { id: 1, type: 'ESP32', total: 0 },
    { id: 2, type: 'Smart Valves', total: 0 },
    { id: 3, type: 'Sensors', total: 0 },
  ];

  const activities = [
    { time: '07:30 AM', text: 'Leakage detected at Nyarugenge', type: 'alert' },
    { time: '08:00 AM', text: 'Sudden rise in water flow at Kicukiro', type: 'warning' },
    { time: '04:20 PM', text: 'Sudden rise in water flow at Kicukiro', type: 'info' },
  ];

  return (
    <MainLayout>
      <div className="bg-background min-h-screen dark-mode-transition">
        <h1 className="text-xl font-semibold mb-2 ml-4 mt-1 text-foreground">Overview</h1>
        <div className="grid grid-cols-5 gap-4 px-4 mb-6">
          {regions.map((region) => (
            <Link to={`/monitor/${region.id}`} key={region.id} className="no-underline">
              <div 
                className="bg-card dark:bg-card rounded-xl p-5 cursor-pointer border border-border dark-mode-transition" 
                style={{
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  background: `linear-gradient(to bottom right, ${region.id === 'north' ? '#fffbeb' : region.id === 'south' ? '#eff6ff' : region.id === 'east' ? '#fff7ed' : region.id === 'west' ? '#f0fdf4' : '#faf5ff'}, hsl(var(--card)))`
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 ${region.iconBg} rounded-full flex items-center justify-center shadow-sm`}>
                    <img src={region.iconSrc} alt={region.name} className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{region.name}</span>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground leading-tight mb-1">{region.value}</div>
                  <div className="text-xs font-medium text-foreground">{region.unit}</div>
                  <div className="text-xs font-medium text-foreground">Daily Average</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Main Grid for Leakage, Stats and Pressure */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Leakage Detection */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Leakage Detection</CardTitle>
                {leakageLoading && (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-sm text-gray-500 mb-4 text-center">Recent</div>
              {leakageError ? (
                <div className="text-center text-red-500 text-sm py-4">
                  Failed to load data
                </div>
              ) : (
                <>
                  <div className="flex justify-between px-2">
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">{recentLeakage.waterLost}</span>
                        <span className="text-xs text-gray-500 ml-1">L</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-2">water lost</div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: '#1DA1F2'}}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                          {/* Top arrow - pointing left */}
                          <line x1="4" y1="9" x2="20" y2="9" stroke="white" strokeWidth="2" />
                          <polyline points="8,5 4,9 8,13" stroke="white" strokeWidth="2" fill="none" />
                          
                          {/* Bottom arrow - pointing right */}
                          <line x1="4" y1="15" x2="20" y2="15" stroke="white" strokeWidth="2" />
                          <polyline points="16,11 20,15 16,19" stroke="white" strokeWidth="2" fill="none" />
                        </svg>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">{recentLeakage.timeTaken}</span>
                        <span className="text-xs text-gray-500 ml-1">min</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-2">Time taken</div>
                    </div>
                  </div>
                  
                  <div className="mt-5">
                    <div className="flex items-center gap-1 mb-3">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600">{recentLeakage.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className={`w-3 h-3 ${
                        recentLeakage.status === 'Resolved' ? 'text-green-500' : 
                        recentLeakage.status === 'Investigating' ? 'text-blue-500' : 
                        'text-yellow-500'
                      }`} />
                      <span className={`text-xs ${
                        recentLeakage.status === 'Resolved' ? 'text-green-500' : 
                        recentLeakage.status === 'Investigating' ? 'text-blue-500' : 
                        'text-yellow-500'
                      }`}>{recentLeakage.status}</span>
                    </div>
                  </div>
                </>
              )}
              
              <div className="mt-6">
                <Link to="/leakage">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md w-32 py-2 mx-auto block" style={{fontSize: '12px'}}>
                    See more
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border shadow-sm">
            <CardHeader className="py-2 px-4 flex justify-center">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-400 mr-1" />
                <CardTitle className="text-sm font-medium text-gray-700">stats</CardTitle>
                {statsLoading && (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500 ml-2" />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {statsError ? (
                <div className="text-center text-red-500 text-sm py-4">
                  Failed to load stats
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {displayStats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between py-3 px-4 rounded-2xl shadow-sm" style={{backgroundColor: stat.color}}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-white bg-opacity-90 rounded-full flex items-center justify-center border" style={{borderColor: stat.textColor}}>
                          <img src={stat.iconSrc} alt={stat.region} className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{stat.region}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-700 mr-2">{stat.count} leakages</span>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{backgroundColor: stat.textColor}}>
                          <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pressure */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-base font-semibold">Customers</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex justify-center gap-2 mb-2">
                {customerData.slice(0, 3).map((item, index) => (
                  <div key={index} className={`rounded-full p-1.5 text-center flex flex-col items-center justify-center aspect-square`} style={{width: '85px', height: '85px', backgroundColor: index === 0 ? 'rgba(250, 204, 21, 0.3)' : index === 1 ? 'rgba(96, 165, 250, 0.3)' : 'rgba(251, 146, 60, 0.3)'}}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center mb-0.5 border" style={{backgroundColor: index === 0 ? 'rgba(250, 204, 21, 0.6)' : index === 1 ? 'rgba(96, 165, 250, 0.6)' : 'rgba(251, 146, 60, 0.6)', borderColor: index === 0 ? 'rgba(250, 204, 21, 0.4)' : index === 1 ? 'rgba(96, 165, 250, 0.4)' : 'rgba(251, 146, 60, 0.4)'}}>
                      <img src={item.iconSrc} alt={item.region} className="w-4 h-4 dark:invert dark:brightness-0 dark:contrast-100" />
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {item.value}<span className="text-[10px] ml-0.5">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-2">
                {customerData.slice(3, 5).map((item, index) => (
                  <div key={index} className={`rounded-full p-1.5 text-center flex flex-col items-center justify-center aspect-square`} style={{width: '85px', height: '85px', backgroundColor: index === 0 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(192, 132, 252, 0.3)'}}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center mb-0.5 border" style={{backgroundColor: index === 0 ? 'rgba(52, 211, 153, 0.6)' : 'rgba(192, 132, 252, 0.6)', borderColor: index === 0 ? 'rgba(52, 211, 153, 0.4)' : 'rgba(192, 132, 252, 0.4)'}}>
                      <img src={item.iconSrc} alt={item.region} className="w-4 h-4 dark:invert dark:brightness-0 dark:contrast-100" />
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {item.value}<span className="text-[10px] ml-0.5">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Devices Table */}
        <div className="mb-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Devices</CardTitle>
                {deviceLoading && (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {deviceError ? (
                <div className="text-center text-red-500 text-sm py-4">
                  Failed to load device data
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left text-xs font-medium text-gray-500 pb-2">N°</th>
                        <th className="text-left text-xs font-medium text-gray-500 pb-2">Device Type</th>
                        <th className="text-left text-xs font-medium text-gray-500 pb-2">Total number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayDevices.map((device) => (
                        <tr key={device.id} className="border-b border-gray-100">
                          <td className="py-2 text-sm text-gray-900">{device.id}</td>
                          <td className="py-2 text-sm text-gray-900">{device.type}</td>
                          <td className="py-2 text-sm text-gray-900">{device.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity History */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Activity History</CardTitle>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 h-8 rounded-md">
                See more
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="relative">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    {index < activities.length - 1 && (
                      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-blue-100"></div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-blue-500 font-medium mb-1">{activity.time}</div>
                    <div className="text-sm text-gray-700">{activity.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
