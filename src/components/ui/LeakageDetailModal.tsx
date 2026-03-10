import React, { useState, useEffect } from 'react';
import { X, BookOpen, MapPin, Play, AlertTriangle } from 'lucide-react';
import { getLeakageById } from '@/services/api';
import { useNotificationContext } from '@/pages/NotificationContext';
const NorthIcon = '/assets/North.svg';
const SouthIcon = '/assets/South.svg';
const EastIcon = '/assets/East.svg';
const WestIcon = '/assets/West.svg';
const KigaliIcon = '/assets/Kigali.svg';

interface LeakageDetailModalProps {
  notification: {
    id: number;
    leakage_id: number;
    timestamp: string;
    message: string;
    location: string;
    water_lost: number;
    severity: string;
    status: string;
  };
  onClose: () => void;
}

const LeakageDetailModal = ({ notification, onClose }: LeakageDetailModalProps) => {
  const { getLeakageData, setLeakageData } = useNotificationContext();
  const [switchState, setSwitchState] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(notification.status === 'RESOLVED' ? 'resolved' : 'investigating');
  const [leakageData, setLocalLeakageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug: Log the notification data
  /* console.log('=== LEAKAGE DETAIL MODAL DEBUG ==='); */
  /* console.log('LeakageDetailModal received notification:', notification); */
  /* console.log('Notification leakage_id:', notification?.leakage_id); */
  /* console.log('Notification water_lost:', notification?.water_lost); */
  /* console.log('Notification location:', notification?.location); */
  /* console.log('Notification timestamp:', notification?.timestamp); */
  /* console.log('Notification time/timestamp:', notification?.timestamp); */
  /* console.log('Full notification object keys:', notification ? Object.keys(notification) : 'No notification'); */
  /* console.log('=== END DEBUG ==='); */

  const handleSwitchToggle = () => {
    setSwitchState(!switchState);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  // Fetch detailed leakage data when modal opens using Map-based approach
  useEffect(() => {
    const fetchLeakageData = async () => {
      // Always set notification data as fallback first
      setLocalLeakageData({
        water_lost_litres: notification.water_lost || 0,
        location: notification.location || 'Location not available',
        occurred_at: notification.timestamp || new Date().toISOString(),
        status: notification.status || 'INVESTIGATING'
      });
      setLoading(false);

      if (!notification.leakage_id) {
        /* console.log('No leakage_id provided, showing notification data only'); */
        return;
      }

      // Step 1: Check if data exists in Map cache
      const cachedData = getLeakageData(notification.leakage_id);
      if (cachedData) {
        /* console.log('Using cached leakage data:', cachedData); */
        setLocalLeakageData(cachedData);
        setSelectedStatus(cachedData.status === 'RESOLVED' ? 'resolved' : 'investigating');
        return;
      }

      // Step 2: Fetch from API if not in cache
      try {
        setLoading(true);
        setError(null);
        /* console.log('Fetching leakage data for ID:', notification.leakage_id); */
        
        const response = await getLeakageById(notification.leakage_id);
        /* console.log('API Response:', response); */
        
        if (response && response.leakage) {
          const leakageData = response.leakage;
          
          // Step 3: Store in Map cache for future use
          setLeakageData(notification.leakage_id, leakageData);
          setLocalLeakageData(leakageData);
          
          // Update status based on fetched data
          setSelectedStatus(leakageData.status === 'RESOLVED' ? 'resolved' : 'investigating');
          /* console.log('Leakage data loaded and cached successfully:', leakageData); */
        } else {
          setError('No leakage data found');
        }
      } catch (err) {
        /* console.error('Error fetching leakage data:', err); */
        setError('Failed to fetch leakage details');
      } finally {
        setLoading(false);
      }
    };

    fetchLeakageData();
  }, [notification.leakage_id, getLeakageData, setLeakageData, notification.water_lost, notification.location, notification.timestamp, notification.status]);

  // Get province icon based on location
  const getProvinceIcon = (location: string | undefined) => {
    if (!location) return NorthIcon;
    if (location.includes('Northern')) return NorthIcon;
    if (location.includes('Southern')) return SouthIcon;
    if (location.includes('Eastern')) return EastIcon;
    if (location.includes('Western')) return WestIcon;
    if (location.includes('Kigali')) return KigaliIcon;
    return NorthIcon;
  };

  // Parse location to get hierarchical path
  const getLocationPath = (location: string) => {
    const parts = location.split(', ');
    if (parts.length >= 3) {
      return `${parts[parts.length - 1]} > ${parts[parts.length - 2]} > ${parts[parts.length - 3]}`;
    }
    return location;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-xl max-w-2xl w-full mx-4 relative max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-red-500 rounded-full">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-black">Leakage Detected</h2>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading leakage details...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Readings: mirror toast content (flow rate in L/h) */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Readings</span>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">
                    {leakageData ? Number(leakageData.water_lost_litres).toFixed(2) : (notification.water_lost ? Number(notification.water_lost).toFixed(2) : '0.00')}
                  </p>
                  <p className="text-sm text-gray-600">Water Lost (L)</p>
                  {/* Debug info - hidden from frontend */}
                  {/* <p className="text-xs text-gray-400 mt-1">
                    Debug: leakageData={leakageData ? 'YES' : 'NO'}, water_lost={notification.water_lost}
                  </p> */}
                </div>
              </div>

              {/* Location Section: mirror toast location */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Location</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <img 
                    src={getProvinceIcon(leakageData ? leakageData.location : notification.location)} 
                    alt="Province" 
                    className="w-8 h-8 dark:invert dark:brightness-0 dark:contrast-100"
                  />
                  <p className="text-lg text-gray-900">
                    {leakageData ? leakageData.location : (notification.location || 'Location not available')}
                  </p>
                </div>
              </div>

              {/* Timestamp under location to match toast footer */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 text-center">
                  {leakageData ? 
                    (isNaN(new Date(leakageData.occurred_at).getTime()) ? 'Date not available' : new Date(leakageData.occurred_at).toLocaleString()) : 
                    (notification.timestamp ? 
                      (isNaN(new Date(notification.timestamp).getTime()) ? 'Date not available' : new Date(notification.timestamp).toLocaleString()) : 
                      'Date not available'
                    )
                  }
                </p>
              </div>
              {/* Take Action Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Play className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Take Action</span>
                </div>
                <div className="flex items-center justify-center">
                  <button
                    onClick={handleSwitchToggle}
                    className={`relative w-32 h-16 rounded-full flex items-center transition-colors duration-300 cursor-pointer ${
                      switchState ? 'bg-green-100' : 'bg-blue-100'
                    }`}
                  >
                    <div
                      className={`absolute left-2 top-2 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-transform duration-300 shadow-md ${
                        switchState ? 'translate-x-16' : ''
                      }`}
                      style={{
                        background: '#333333',
                        color: switchState ? '#388E3C' : '#60A5FA',
                        border: `3px solid ${switchState ? '#388E3C' : '#60A5FA'}`,
                      }}
                    >
                      {switchState ? 'ON' : 'OFF'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Status</span>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      value="resolved" 
                      checked={selectedStatus === 'resolved'}
                      onChange={() => handleStatusChange('resolved')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Resolved</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      value="investigating" 
                      checked={selectedStatus === 'investigating'}
                      onChange={() => handleStatusChange('investigating')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Investigating</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeakageDetailModal;
