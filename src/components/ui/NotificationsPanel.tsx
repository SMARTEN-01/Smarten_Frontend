import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
// Define SVG icons as absolute paths (assets are in the public/assets directory)
const Frame1201Icon = '/assets/Frame 1201.svg';
const LeakageButtonIcon = '/assets/Leakage button.svg';
const PeopleIcon = '/assets/People.svg';
const ToggleRightIcon = '/assets/toggle-right 1.svg';
const DropletsIcon = '/assets/droplets.svg';
import LeakageDetailModal from './LeakageDetailModal';
import { useNotificationContext } from '@/pages/NotificationContext';

interface NotificationsPanelProps {
  onClose: () => void;
  onChangeUnread?: (newUnread: number) => void;
}

// Removed hardcoded notifications - now using only real-time notifications

const getIcon = (icon: string) => {
  switch (icon) {
    case 'leakage':
      return <img src={DropletsIcon} alt="Leakage" className="w-7 h-7 dark:invert dark:brightness-0 dark:contrast-100" />;
    case 'critical':
      return <img src={LeakageButtonIcon} alt="Critical" className="w-7 h-7 dark:invert dark:brightness-0 dark:contrast-100" />;
    case 'user':
      return <img src={PeopleIcon} alt="User" className="w-7 h-7 dark:invert dark:brightness-0 dark:contrast-100" />;
    case 'action':
      return <img src={ToggleRightIcon} alt="Action" className="w-7 h-7 dark:invert dark:brightness-0 dark:contrast-100" />;
    default:
      return null;
  }
};

const NotificationsPanel = ({ onClose }: NotificationsPanelProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationContext();
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  // Group notifications by date (convert to the format expected by the UI)
  const grouped = notifications.reduce((acc: Record<string, any[]>, notif) => {
    const date = new Date(notif.time).toLocaleDateString();
    acc[date] = acc[date] || [];
    acc[date].push({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      time: new Date(notif.time).toLocaleTimeString(),
      date: date,
      new: !notif.read,
      icon: notif.type === 'alert' ? 'leakage' : notif.type === 'warning' ? 'critical' : 'user',
      // Keep all original notification data for modal
      leakage_id: notif.leakage_id,
      water_lost: notif.water_lost,
      location: notif.location,
      timestamp: notif.timestamp,
      severity: notif.severity,
      status: notif.status,
      message: notif.message
    });
    return acc;
  }, {});

  const handleNotificationClick = (notification: any) => {
    console.log('=== NOTIFICATIONS PANEL CLICK DEBUG ===');
    console.log('NotificationsPanel: Clicking notification:', notification);
    console.log('NotificationsPanel: notification.leakage_id:', notification.leakage_id);
    console.log('NotificationsPanel: notification.water_lost:', notification.water_lost);
    console.log('NotificationsPanel: notification.location:', notification.location);
    console.log('NotificationsPanel: notification.time:', notification.time);
    console.log('NotificationsPanel: notification.timestamp:', notification.timestamp);
    console.log('Full notification object keys:', Object.keys(notification));
    console.log('=== END NOTIFICATIONS PANEL DEBUG ===');
    setSelectedNotification(notification);
    markAsRead(notification.id);
  };

  const closeModal = () => {
    setSelectedNotification(null);
  };

  return (
    <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 animate-slide-in" style={{ minWidth: 380 }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <span className="text-lg font-semibold">Notifications</span>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>
      <div className="flex items-center justify-between px-6 py-3">
        <span className="text-xs text-gray-500">Unread: {unreadCount}</span>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-blue-600 text-xs font-medium hover:underline">Mark all as read</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 max-h-[80vh]">
        {Object.keys(grouped).map(date => (
          <div key={date} className="mb-4">
            <div className="text-xs text-gray-400 font-semibold mb-2 mt-2">{date}</div>
            {grouped[date].map(notif => (
              <div key={notif.id} className="flex items-start gap-3 mb-4">
                {['user', 'action', 'leakage'].includes(notif.icon) ? (
                  <span className="w-12 h-12 flex items-center justify-center rounded-full" style={{ background: '#1862CA' }}>
                    <span className="flex items-center justify-center w-7 h-7">
                      {getIcon(notif.icon)}
                    </span>
                  </span>
                ) : (
                  <span className="w-8 h-8 flex items-center justify-center rounded-full">
                    {getIcon(notif.icon)}
                  </span>
                )}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleNotificationClick(notif)}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900" style={{fontWeight: notif.new ? 600 : 500}}>{notif.title}</span>
                    {notif.new && <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full font-semibold">New</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{notif.time}</div>
                </div>
                {notif.new && (
                  <button onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }} className="text-blue-600 text-xs font-medium hover:underline">Mark as read</button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Leakage Detail Modal */}
      {selectedNotification && (
        <LeakageDetailModal 
          notification={selectedNotification} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
};

export default NotificationsPanel; 