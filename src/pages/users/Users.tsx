
import { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LineChart from '@/components/ui/LineChart';
import RegionIcon from '@/components/ui/RegionIcon';
import { Search, Users as UsersIcon, TrendingUp, UserPlus } from 'lucide-react';
const NorthIcon = '/assets/North.svg';
const SouthIcon = '/assets/South.svg';
const EastIcon = '/assets/East.svg';
const WestIcon = '/assets/West.svg';
const KigaliIcon = '/assets/Kigali.svg';

const Users = () => {
  const [selectedRegion, setSelectedRegion] = useState('north');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('month');

  const regions = [
    { id: 'north', name: 'North', users: '20,000', growth: '+12%', color: 'bg-yellow-50', iconBg: 'bg-yellow-500', buttonColor: 'bg-yellow-500 hover:bg-yellow-600' },
    { id: 'south', name: 'South', users: '59,000', growth: '+8%', color: 'bg-blue-50', iconBg: 'bg-blue-500', buttonColor: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'east', name: 'East', users: '100,000', growth: '+15%', color: 'bg-orange-50', iconBg: 'bg-orange-500', buttonColor: 'bg-orange-500 hover:bg-orange-600' },
    { id: 'west', name: 'West', users: '420,000', growth: '+10%', color: 'bg-green-50', iconBg: 'bg-green-500', buttonColor: 'bg-green-500 hover:bg-green-600' },
    { id: 'kigali', name: 'Kigali', users: '120,000', growth: '+18%', color: 'bg-purple-50', iconBg: 'bg-purple-500', buttonColor: 'bg-purple-500 hover:bg-purple-600' },
  ];


  const dayData = Array.from({ length: 31 }, (_, i) => ({ label: `${i + 1}`, value: Math.floor(Math.random() * 100) + 10, display: `${Math.floor(Math.random() * 100) + 10}k litres` }));
  const monthData = [
    { label: '1st week', value: 20, display: '20k litres' },
    { label: '2nd week', value: 100, display: '100k litres' },
    { label: '3rd week', value: 0, display: '0' },
    { label: '4th week', value: 0, display: '0' },
  ];
  const yearData = [
    { label: 'Jan', value: 320, display: '320k litres' },
    { label: 'Feb', value: 410, display: '410k litres' },
    { label: 'Mar', value: 380, display: '380k litres' },
    { label: 'Apr', value: 500, display: '500k litres' },
    { label: 'May', value: 420, display: '420k litres' },
    { label: 'Jun', value: 390, display: '390k litres' },
    { label: 'Jul', value: 450, display: '450k litres' },
    { label: 'Aug', value: 470, display: '470k litres' },
    { label: 'Sep', value: 430, display: '430k litres' },
    { label: 'Oct', value: 410, display: '410k litres' },
    { label: 'Nov', value: 400, display: '400k litres' },
    { label: 'Dec', value: 440, display: '440k litres' },
  ];

  let chartBars = monthData;
  let barWidth = 'w-24'; // even wider bars for clarity
  let barGap = 'gap-16'; // more space between bars for visual separation
  let barMaxHeight = 240;
  let chartOverflowX = 'visible';
  if (viewMode === 'day') {
    chartBars = dayData;
    barWidth = 'w-12';
    barGap = 'gap-4';
    barMaxHeight = 180;
    chartOverflowX = 'auto';
  } else if (viewMode === 'year') {
    chartBars = yearData;
    barWidth = 'w-24';
    barGap = 'gap-16';
    barMaxHeight = 160;
    chartOverflowX = 'auto'; // enable horizontal scroll for years
  } else if (viewMode === 'month') {
    chartBars = monthData;
    barWidth = 'w-24';
    barGap = 'gap-16';
    barMaxHeight = 240;
    chartOverflowX = 'auto';
  }

  const consumptionData = [
    { region: 'north', percentage: 60, consumed: 92482, efficiency: 'Good' },
    { region: 'south', percentage: 55, consumed: 87321, efficiency: 'Average' },
    { region: 'east', percentage: 68, consumed: 105673, efficiency: 'Excellent' },
    { region: 'west', percentage: 72, consumed: 298456, efficiency: 'Excellent' },
    { region: 'kigali', percentage: 58, consumed: 98234, efficiency: 'Good' },
  ];

  const recentUsers = [
    { id: 1, name: 'Jean Baptiste', email: 'jean@example.com', region: 'Kigali', joinDate: '2024-01-15', status: 'Active' },
    { id: 2, name: 'Marie Claire', email: 'marie@example.com', region: 'North', joinDate: '2024-01-14', status: 'Active' },
    { id: 3, name: 'Paul Rwagasore', email: 'paul@example.com', region: 'South', joinDate: '2024-01-13', status: 'Pending' },
    { id: 4, name: 'Grace Uwimana', email: 'grace@example.com', region: 'East', joinDate: '2024-01-12', status: 'Active' },
    { id: 5, name: 'David Nkurunziza', email: 'david@example.com', region: 'West', joinDate: '2024-01-11', status: 'Active' },
  ];

  const regionAssets = {
    north: { icon: NorthIcon, color: '#FCD34D', btn: 'bg-yellow-400 hover:bg-yellow-500 text-white', text: 'text-yellow-500' },
    south: { icon: SouthIcon, color: '#60A5FA', btn: 'bg-blue-400 hover:bg-blue-500 text-white', text: 'text-blue-500' },
    east: { icon: EastIcon, color: '#FB923C', btn: 'bg-orange-400 hover:bg-orange-500 text-white', text: 'text-orange-500' },
    west: { icon: WestIcon, color: '#22C55E', btn: 'bg-green-400 hover:bg-green-500 text-white', text: 'text-green-500' },
    kigali: { icon: KigaliIcon, color: '#A855F7', btn: 'bg-purple-400 hover:bg-purple-500 text-white', text: 'text-purple-500' },
  };

  return (
    <MainLayout title="User Management">
      <div className="w-full min-h-screen bg-background px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-32 dark-mode-transition">
        {/* Top region cards */}
        <div className="flex gap-8 px-8 pt-8"> {/* Increased gap from 4 to 8 */}
          {regions.map(region => (
            <div key={region.id} className="flex-1 bg-card rounded-2xl shadow flex flex-col items-center py-4 px-2 min-w-[120px] max-w-[180px] dark-mode-transition">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: `${regionAssets[region.id].color}33` }}>
                  <img src={regionAssets[region.id].icon} alt={region.name} className="w-5 h-5" />
                </span>
                <span className={`font-semibold ${regionAssets[region.id].text}`}>{region.name}</span>
          </div>
              <div className="text-2xl font-bold text-foreground mb-1">{region.users.replace('k', 'k')}</div>
              <div className="text-xs text-foreground mb-2">Users</div>
              <Link to={`/users/detail/${region.id}`}>
                <button className={`rounded-full px-4 py-1 text-xs font-semibold text-white ${regionAssets[region.id].btn} transition`}>View users</button>
              </Link>
            </div>
          ))}
        </div>
        {/* Consumed water chart */}
        <div className="bg-card rounded-2xl shadow mt-8 mx-8 px-8 py-6 dark-mode-transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold text-foreground">Consumed water</span>
            <div className="flex gap-2">
              <button
                className={`w-8 h-8 rounded-full font-bold shadow-sm transition-colors ${viewMode === 'day' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setViewMode('day')}
              >D</button>
              <button
                className={`w-8 h-8 rounded-full font-bold shadow-sm transition-colors ${viewMode === 'month' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setViewMode('month')}
              >M</button>
              <button
                className={`w-8 h-8 rounded-full font-bold shadow-sm transition-colors ${viewMode === 'year' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setViewMode('year')}
              >Y</button>
            </div>
                </div>
          <div className={`flex items-end ${barGap} h-64 mt-4 mb-2 px-2 justify-center`} style={{ minHeight: '220px', overflowX: chartOverflowX as any }}>
            {chartBars.map((bar, idx) => {
              // Calculate height, cap for each view
              let barHeight = bar.value * (viewMode === 'year' ? 0.7 : viewMode === 'month' ? 4 : 2) + 40;
              if (viewMode === 'year' && barHeight > barMaxHeight) barHeight = barMaxHeight;
              if (viewMode === 'day' && barHeight > barMaxHeight) barHeight = barMaxHeight;
              // For month view, allow scroll, don't cap
              return (
                <div key={bar.label} className="flex flex-col items-center">
                  <div className={`relative flex items-end justify-center ${barWidth}`} style={{ height: `${barHeight}px` }}>
                    <div className={`h-full bg-blue-400 border border-white rounded-t-lg shadow-sm flex items-center justify-center ${barWidth}`} style={{ minHeight: '40px', position: 'relative' }}>
                      <span className="text-xs font-semibold text-white" style={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)', textAlign: 'center' }}>
                        {(viewMode === 'month' || viewMode === 'year') && bar.display ? bar.display : (bar.value === 0 ? '0' : (bar.value === 100 ? '100k litres' : '20k litres'))}
                      </span>
                </div>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{bar.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <svg width="24" height="24" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C12 2 7 8.5 7 13a5 5 0 0 0 10 0c0-4.5-5-11-5-11z"/><circle cx="12" cy="17" r="1"/></svg>
            <span className="text-base font-semibold text-foreground">1M litres</span>
            <span className="text-sm text-muted-foreground">consumed water</span>
          </div>
        </div>
        {/* Regional consumption breakdown */}
        <div className="bg-card rounded-2xl shadow mt-8 mx-8 px-8 py-6 dark-mode-transition">
          <div className="flex items-center mb-6">
            <span className="text-lg font-semibold text-foreground">Consumed water</span>
              </div>
          <div className="flex gap-4">
            {regions.map((region, idx) => (
              <div key={region.id} className="flex-1 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: `${regionAssets[region.id].color}33` }}>
                    <img src={regionAssets[region.id].icon} alt={region.name} className="w-5 h-5" />
                  </span>
                  <span className={`font-semibold ${regionAssets[region.id].text}`}>{region.name}</span>
                </div>
                <div className="relative w-16 h-16 mb-2">
                  <svg width="64" height="64">
                    <circle cx="32" cy="32" r="28" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                    <circle cx="32" cy="32" r="28" stroke={regionAssets[region.id].color} strokeWidth="8" fill="none" strokeDasharray={2 * Math.PI * 28} strokeDashoffset={(1 - 0.6) * 2 * Math.PI * 28} style={{ transition: 'stroke-dashoffset 0.5s' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-foreground">60%</span>
                </div>
                </div>
                <div className="text-lg font-bold text-foreground">92,482</div>
                <div className="text-xs text-foreground">liters consumed</div>
                  </div>
                ))}
              </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Users;
