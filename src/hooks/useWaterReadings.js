import { useEffect, useState } from "react";
import { useMonitorData } from "../contexts/MonitorDataContext";
import { globalWebSocketService } from "../services/GlobalWebSocketService";

export const useWaterReadings = (province) => {
  const { 
    monitorData, 
    isDataStale,
    getConnectionStatus 
  } = useMonitorData();
  
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Use data from context instead of local state
  const waterData = monitorData.waterData.filter(item => item.province === province);
  const districtData = monitorData.districtData.filter(item => item.province === province);
  const criticalReadings = monitorData.criticalReadings.filter(item => item.province === province);
  const pastHour = monitorData.pastHour[province] || { average: 0, status: 'normal' };
  const dailyAverage = monitorData.dailyAverage[province] || { average: 0, status: 'normal' };

  useEffect(() => {
    if (!province) {
      /* console.log("No province provided for WebSocket"); */
      setConnectionStatus('error');
      setErrorMessage('No province provided');
      return;
    }

    const normalizedProvince = province.charAt(0).toUpperCase() + province.slice(1).toLowerCase();
    
    // Monitor connection status for this province
    const checkConnectionStatus = () => {
      const status = globalWebSocketService.getProvinceConnectionStatus(normalizedProvince);
      if (status) {
        setConnectionStatus(status.isConnected ? 'connected' : 'disconnected');
        setErrorMessage(null);
        } else {
          setConnectionStatus('connecting');
        setErrorMessage('Connection not established');
      }
    };

    // Check status immediately
    checkConnectionStatus();
    
    // Check status periodically
    const statusInterval = setInterval(checkConnectionStatus, 15000);

    return () => {
      clearInterval(statusInterval);
    };
  }, [province]);

  useEffect(() => {
    /* console.log("Updated waterData:", waterData); */
    /* console.log("Updated districtData:", districtData); */
    /* console.log("Updated criticalReadings:", criticalReadings); */
    /* console.log("Updated pastHour:", pastHour); */
    /* console.log("Updated dailyAverage:", dailyAverage); */
    /* console.log("Connection status:", connectionStatus, "Error:", errorMessage); */
    /* console.log("Data is stale:", isDataStale); */
  }, [waterData, districtData, criticalReadings, pastHour, dailyAverage, connectionStatus, errorMessage, isDataStale]);

  return { waterData, districtData, criticalReadings, pastHour, dailyAverage, connectionStatus, errorMessage, isDataStale };
};