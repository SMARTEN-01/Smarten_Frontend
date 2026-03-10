import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
  resetToDefault: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

const SIDEBAR_STATE_KEY = 'smarten_sidebar_collapsed';

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const { authState } = useAuth();
  
  // Initialize state from localStorage or default to false (expanded)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isCollapsed));
    } catch (error) {
      /* console.warn('Failed to save sidebar state to localStorage:', error); */
    }
  }, [isCollapsed]);

  // Reset sidebar to default when user logs in or session expires
  useEffect(() => {
    // Reset to default (expanded) when authentication state changes
    // This handles both login and session expiry
    if (!authState.isAuthenticated) {
      setIsCollapsed(false);
      try {
        localStorage.removeItem(SIDEBAR_STATE_KEY);
      } catch (error) {
        /* console.warn('Failed to clear sidebar state from localStorage:', error); */
      }
    }
  }, [authState.isAuthenticated]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
  };

  const resetToDefault = () => {
    setIsCollapsed(false);
    try {
      localStorage.removeItem(SIDEBAR_STATE_KEY);
    } catch (error) {
      /* console.warn('Failed to clear sidebar state from localStorage:', error); */
    }
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setCollapsed, resetToDefault }}>
      {children}
    </SidebarContext.Provider>
  );
};
