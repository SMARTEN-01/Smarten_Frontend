import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { globalWebSocketService } from '../services/GlobalWebSocketService';

interface WaterDataPoint {
  flow_rate_lph: number;
  status: string;
  timestamp: string;
  province: string;
}

interface DistrictDataPoint {
  id: number;
  district: string;
  flow_rate: number;
  status: string;
  timestamp: string;
  province: string;
}

interface CriticalReading {
  province: string;
  district: string;
  status: string;
  waterflow: number;
}

interface PastHourData {
  average: number;
  status: string;
}

interface DailyAverageData {
  average: number;
  status: string;
}

interface MonitorData {
  waterData: WaterDataPoint[];
  districtData: DistrictDataPoint[];
  criticalReadings: CriticalReading[];
  pastHour: { [province: string]: PastHourData };
  dailyAverage: { [province: string]: DailyAverageData };
  lastUpdated: string;
  currentDay: string;
}

interface MonitorDataContextType {
  monitorData: MonitorData;
  clearData: () => void;
  isDataStale: boolean;
  getConnectionStatus: () => Record<string, { isConnected: boolean; lastMessageTime: number }>;
}

const MonitorDataContext = createContext<MonitorDataContextType | undefined>(undefined);

const STORAGE_KEY = 'smarten_monitor_data';
const MAX_WATER_DATA_POINTS = 100;
const MAX_DISTRICT_DATA_POINTS = 10;

const getCurrentDay = () => {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
};

const getDefaultData = (): MonitorData => ({
  waterData: [],
  districtData: [],
  criticalReadings: [],
  pastHour: {},
  dailyAverage: {},
  lastUpdated: new Date().toISOString(),
  currentDay: getCurrentDay(),
});

const loadDataFromStorage = (): MonitorData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultData();
    
    const parsed = JSON.parse(stored);
    const currentDay = getCurrentDay();
    
    // Check if data is from a different day
    if (parsed.currentDay !== currentDay) {
      console.log('New day detected, clearing old data');
      return getDefaultData();
    }
    
    // Check if data is too old (more than 24 hours)
    const lastUpdated = new Date(parsed.lastUpdated);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      console.log('Data is too old, clearing');
      return getDefaultData();
    }
    
    return parsed;
  } catch (error) {
    console.error('Error loading monitor data from storage:', error);
    return getDefaultData();
  }
};

const saveDataToStorage = (data: MonitorData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving monitor data to storage:', error);
  }
};

export const MonitorDataProvider = ({ children }: { children: ReactNode }) => {
  const [monitorData, setMonitorData] = useState<MonitorData>(getDefaultData);
  const [isDataStale, setIsDataStale] = useState(false);

  // Load data from storage on mount and fetch initial data from API
  useEffect(() => {
    const loadedData = loadDataFromStorage();
    setMonitorData(loadedData);
    
    // Fetch initial data from API to supplement storage
    const fetchInitialData = async () => {
      try {
        const { getHourlyAverages, getLastHourAverage, getCriticalReadings } = await import('../services/api');
        
        // 1. Fetch province-level averages
        const hourlyRes = await getHourlyAverages();
        if (hourlyRes.data?.data) {
          const apiWaterData = [];
          const pastHourMap = {};
          
          Object.entries(hourlyRes.data.data).forEach(([province, data]) => {
            const typedData = data as any;
            if (typedData) {
              apiWaterData.push({
                province,
                flow_rate_lph: typedData.average_flow_rate,
                status: typedData.status,
                timestamp: typedData.timestamp
              });
              pastHourMap[province] = {
                average: typedData.average_flow_rate,
                status: typedData.status
              };
            }
          });
          
          if (apiWaterData.length > 0) {
            setMonitorData(prev => ({
              ...prev,
              waterData: [...prev.waterData, ...apiWaterData].slice(-MAX_WATER_DATA_POINTS),
              pastHour: { ...prev.pastHour, ...pastHourMap },
              lastUpdated: new Date().toISOString()
            }));
          }
        }
        
        // 2. Fetch district-level averages for the history table
        const lastHourRes = await getLastHourAverage();
        if (lastHourRes.data?.data) {
          const apiDistrictData = lastHourRes.data.data.map((item, index) => ({
            id: Date.now() + index,
            district: item.district,
            flow_rate: item.average_flow_rate,
            status: item.status,
            timestamp: lastHourRes.data.hour,
            province: item.province
          }));
          
          if (apiDistrictData.length > 0) {
            setMonitorData(prev => ({
              ...prev,
              districtData: [...prev.districtData, ...apiDistrictData].slice(-MAX_DISTRICT_DATA_POINTS),
              lastUpdated: new Date().toISOString()
            }));
          }
        }
        
        // 3. Fetch critical readings
        const criticalRes = await getCriticalReadings();
        if (criticalRes.data) {
          const apiCriticalData = [];
          if (criticalRes.data.overflow) {
            apiCriticalData.push({
              province: criticalRes.data.overflow.province,
              district: 'All District',
              status: 'overflow',
              waterflow: criticalRes.data.overflow.average_flow_rate
            });
          }
          if (criticalRes.data.underflow) {
            apiCriticalData.push({
              province: criticalRes.data.underflow.province,
              district: 'All District',
              status: 'underflow',
              waterflow: criticalRes.data.underflow.average_flow_rate
            });
          }
          
          if (apiCriticalData.length > 0) {
            setMonitorData(prev => ({
              ...prev,
              criticalReadings: apiCriticalData,
              lastUpdated: new Date().toISOString()
            }));
          }
        }
        
      } catch (error) {
        console.error('Error fetching initial monitor data:', error);
      }
    };
    
    fetchInitialData();
  }, []);

  // Subscribe to global WebSocket service for all provinces
  useEffect(() => {
    const provinces = ['Northern', 'Southern', 'Eastern', 'Western', 'Kigali'];
    const unsubscribeFunctions: (() => void)[] = [];

    provinces.forEach(province => {
      const unsubscribe = globalWebSocketService.subscribe(province, (data) => {
        console.log(`📊 Received data for ${province}:`, data);
        
        // Update water data
        const waterDataPoint: WaterDataPoint = {
          flow_rate_lph: data.flow_rate_lph || 0,
          status: data.status || 'normal',
          timestamp: data.timestamp || new Date().toISOString(),
          province: data.province || province,
        };
        
        setMonitorData(prev => {
          // Treat as duplicate only if timestamp, province AND values are identical.
          // This allows multiple readings in the same minute if values change.
          const isDuplicate = prev.waterData.some(existingPoint => 
            existingPoint.timestamp === waterDataPoint.timestamp && 
            existingPoint.province === waterDataPoint.province &&
            existingPoint.flow_rate_lph === waterDataPoint.flow_rate_lph &&
            existingPoint.status === waterDataPoint.status
          );

          if (!isDuplicate) {
            const updatedData = {
              ...prev,
              waterData: [
                ...prev.waterData,
                waterDataPoint
              ].slice(-MAX_WATER_DATA_POINTS), // Keep only the last 100 points total
              lastUpdated: new Date().toISOString(),
              currentDay: getCurrentDay(),
            };
            return updatedData;
          }
          
          // Return previous data if it's a duplicate
          return prev;
        });

        // Update district data
        if (data.districts && Array.isArray(data.districts)) {
          const newDistricts = data.districts.map((district, index) => ({
            id: Date.now() + index,
            district: district.district || 'Unknown',
            flow_rate: district.flow_rate_lph || 0, // Keep as lph to match backend
            status: district.status || 'normal',
            timestamp: data.timestamp || new Date().toISOString(),
            province: data.province || province,
          }));
          
          setMonitorData(prev => {
            // Filter out duplicates for district data based on timestamp, province, and district
            const filteredNewDistricts = newDistricts.filter(newDistrict => 
              !prev.districtData.some(existingDistrict => 
                existingDistrict.timestamp === newDistrict.timestamp && 
                existingDistrict.province === newDistrict.province &&
                existingDistrict.district === newDistrict.district
              )
            );
            
            return {
              ...prev,
              districtData: [
                ...prev.districtData,
                ...filteredNewDistricts
              ].slice(-MAX_DISTRICT_DATA_POINTS), // Keep only the last 10 points total
              lastUpdated: new Date().toISOString(),
            };
          });
        }

        // Update critical readings
        if (data.critical_readings && Array.isArray(data.critical_readings)) {
          const processedReadings = data.critical_readings.map(reading => ({
            province: reading.province || province,
            district: reading.district || 'Unknown',
            status: reading.status || 'normal',
            waterflow: Number(reading.waterflow) || 0, // Keep as number for calculations
          }));
          
          setMonitorData(prev => ({
            ...prev,
            criticalReadings: [
              ...prev.criticalReadings.filter(item => item.province !== province),
              ...processedReadings
            ],
            lastUpdated: new Date().toISOString(),
          }));
        }

        // Update past hour
        if (data.past_hour) {
          setMonitorData(prev => ({
            ...prev,
            pastHour: {
              ...prev.pastHour,
              [province]: {
                average: (data.past_hour.average || 0),
                status: data.past_hour.status || 'normal'
              }
            },
            lastUpdated: new Date().toISOString(),
          }));
        }

        // Update daily average
        if (data.daily_average) {
          setMonitorData(prev => ({
            ...prev,
            dailyAverage: {
              ...prev.dailyAverage,
              [province]: {
                average: (data.daily_average.average || 0),
                status: data.daily_average.status || 'normal'
              }
            },
            lastUpdated: new Date().toISOString(),
          }));
        }
      });
      
      unsubscribeFunctions.push(unsubscribe);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Save data to storage whenever it changes
  useEffect(() => {
    saveDataToStorage(monitorData);
  }, [monitorData]);

  // Check for day changes and server disconnection
  useEffect(() => {
    const checkDataFreshness = () => {
      const currentDay = getCurrentDay();
      const now = new Date();
      const lastUpdated = new Date(monitorData.lastUpdated);
      const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      // Mark as stale if data is older than 1 hour or from a different day
      if (monitorData.currentDay !== currentDay || hoursDiff > 1) {
        setIsDataStale(true);
      } else {
        setIsDataStale(false);
      }
    };

    checkDataFreshness();
    const interval = setInterval(checkDataFreshness, 15000); // Check every minute
    return () => clearInterval(interval);
  }, [monitorData.lastUpdated, monitorData.currentDay]);

  const getConnectionStatus = () => {
    return globalWebSocketService.getConnectionStatus();
  };

  const clearData = () => {
    setMonitorData(getDefaultData());
    setIsDataStale(false);
  };

  return (
    <MonitorDataContext.Provider
      value={{
        monitorData,
        clearData,
        isDataStale,
        getConnectionStatus,
      }}
    >
      {children}
    </MonitorDataContext.Provider>
  );
};

export const useMonitorData = () => {
  const context = useContext(MonitorDataContext);
  if (context === undefined) {
    throw new Error('useMonitorData must be used within a MonitorDataProvider');
  }
  return context;
};
