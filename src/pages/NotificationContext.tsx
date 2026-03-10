import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useLeakAlerts } from '@/hooks/useLeakAlerts';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: number;
  type: 'alert' | 'warning' | 'success' | 'info' ;
  title: string;
  message: string;
  time: string;
  read: boolean;
  location: string;
  // Additional fields for leakage detail modal
  leakage_id?: number;
  water_lost?: number;
  severity?: string;
  status?: string;
  timestamp?: string; // For modal compatibility
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  removeNotification: (id: number) => void;
  markAllAsRead: () => void;
  getLeakageData: (leakageId: number) => any;
  setLeakageData: (leakageId: number, data: any) => void;
  // Toast modal functionality
  selectedToastNotification: Notification | null;
  openToastModal: (notification: Notification) => void;
  closeToastModal: () => void;
  // Session cleanup functionality
  cleanupReadNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const alerts = useLeakAlerts();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Track processed alerts to prevent re-processing on re-renders or stale array references
  const processedAlertKeysRef = useRef<Set<string>>(new Set());
  // Map to store leakage data by leakage_id for quick retrieval
  const [leakageDataMap, setLeakageDataMap] = useState<Map<number, any>>(new Map());
  // Toast modal state
  const [selectedToastNotification, setSelectedToastNotification] = useState<Notification | null>(null);
  const STORAGE_KEY = 'smarten.notifications.v1';

  // Hydrate notifications from localStorage on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: Notification[] = JSON.parse(raw);
        if (Array.isArray(saved)) {
          // Only load unread notifications (read notifications are session-only)
          const unreadNotifications = saved.filter(notification => !notification.read);
          setNotifications(unreadNotifications);
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  // Persist only unread notifications to localStorage
  useEffect(() => {
    try {
      // Only save unread notifications to localStorage
      const unreadNotifications = notifications.filter(notification => !notification.read);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unreadNotifications));
    } catch (e) {
      // Ignore storage errors
    }
  }, [notifications]);

  // Process real-time notifications from WebSocket alerts
  useEffect(() => {
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return;
    }

    alerts.forEach((alert) => {
      // Build a unique key per alert occurrence (id + timestamp)
      const alertTimestampRaw = (alert as any)?.timestamp;
      const alertIdRaw = (alert as any)?.leak_id;
      const uniqueKey = `${alertIdRaw ?? 'unknown'}-${alertTimestampRaw ?? 'no-ts'}`;

      // Skip if already processed
      if (processedAlertKeysRef.current.has(uniqueKey)) {
        return;
      }

      if (alert.status === 'potential_leak') {
        // Validate timestamp to prevent "Invalid Date" issues; fallback to now if invalid
        const rawTs = alert.timestamp;
        const isValidTimestamp = rawTs && !isNaN(new Date(rawTs).getTime());
        const timestamp = isValidTimestamp ? rawTs : new Date().toISOString();

         const newNotification: Notification = {
           id: alert.leak_id,
           type: alert.severity === 'HIGH' ? 'alert' : 'warning',
           title: 'Leakage Detected',
           message: `Water leakage detected at ${alert.village}, ${alert.district}. Flow Rate: ${alert.flow_rate_lph} L/h. Immediate attention required.`,
           time: timestamp,
           read: false,
           location: `${alert.village}, ${alert.district}, ${alert.province}, ${alert.country}`,
           // Additional leakage data for modal - store the leak_id for API calls
           leakage_id: alert.leak_id, // This is the ID we'll send to the API
           water_lost: alert.flow_rate_lph || 0,
           severity: alert.severity,
           status: 'INVESTIGATING', // Default status
           // Add timestamp field for modal compatibility
           timestamp: timestamp,
         };

        // Debug: Log the alert data and created notification
        /* console.log('=== WEBSOCKET ALERT DEBUG ==='); */
        /* console.log('WebSocket alert received:', alert); */
        /* console.log('Alert leak_id:', alert.leak_id); */
        /* console.log('Alert flow_rate_lph:', alert.flow_rate_lph); */
        /* console.log('Alert village:', alert.village); */
        /* console.log('Alert district:', alert.district); */
        /* console.log('Alert province:', alert.province); */
        /* console.log('Alert country:', alert.country); */
        /* console.log('Alert timestamp:', alert.timestamp); */
        /* console.log('Created notification:', newNotification); */
        /* console.log('Created notification with leakage_id:', newNotification.leakage_id); */
        /* console.log('Created notification water_lost:', newNotification.water_lost); */
        /* console.log('Created notification location:', newNotification.location); */
        /* console.log('=== END WEBSOCKET DEBUG ==='); */

        setNotifications((prev) => {
          // If an item with same id and exact time exists, skip; otherwise append
          if (prev.some((n) => n.id === newNotification.id && n.time === newNotification.time)) {
            return prev;
          }

          return [...prev, newNotification];
        });

        // Mark this alert as processed after enqueueing
        processedAlertKeysRef.current.add(uniqueKey);
      }
    });
  }, [alerts, toast]);

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Map functions for leakage data
  const getLeakageData = (leakageId: number) => {
    return leakageDataMap.get(leakageId);
  };

  const setLeakageData = (leakageId: number, data: any) => {
    setLeakageDataMap(prev => {
      const newMap = new Map(prev);
      newMap.set(leakageId, data);
      return newMap;
    });
  };

  // Toast modal functions
  const openToastModal = (notification: Notification) => {
    setSelectedToastNotification(notification);
  };

  const closeToastModal = () => {
    setSelectedToastNotification(null);
  };

  // Function to manually clean up read notifications
  const cleanupReadNotifications = () => {
    setNotifications(prev => {
      const unreadNotifications = prev.filter(notification => !notification.read);
      return unreadNotifications;
    });
  };

  // Clean up read notifications on page unload (session end)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Remove read notifications from localStorage when session ends
      try {
        const unreadNotifications = notifications.filter(notification => !notification.read);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(unreadNotifications));
      } catch (e) {
        // Ignore storage errors
      }
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{ 
        notifications, 
        unreadCount, 
        markAsRead, 
        removeNotification, 
        markAllAsRead,
        getLeakageData,
        setLeakageData,
        selectedToastNotification,
        openToastModal,
        closeToastModal,
        cleanupReadNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (undefined === context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};