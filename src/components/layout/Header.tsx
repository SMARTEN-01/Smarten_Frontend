
import { Bell, Search, User, ChevronDown, Settings as SettingsIcon, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface HeaderProps {
  title?: string;
  onShowNotifications?: () => void;
  unreadCount?: number;
}

const Header = ({ title, onShowNotifications, unreadCount = 0 }: HeaderProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-background flex items-center justify-between px-6 dark-mode-transition">
      {/* Hamburger menu button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleSidebar}
        className="hover:bg-accent transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </Button>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 w-72 h-8 bg-muted border-border rounded-md text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <Button variant="ghost" size="sm" className="relative p-1" onClick={onShowNotifications}>
            <div className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-2.5 -right-1 min-w-4 h-4 px-1 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-medium text-white">{Math.min(unreadCount, 99)}</span>
                </span>
              )}
            </div>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 ml-4 cursor-pointer hover:bg-accent rounded-md p-1 dark-mode-transition">
                <div className="w-7 h-7 bg-[#3A8DDE] rounded-full flex items-center justify-center">
                  <img src="/assets/WASAC_1.png" alt="WASAC" className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-foreground">WASAC</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <User className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
