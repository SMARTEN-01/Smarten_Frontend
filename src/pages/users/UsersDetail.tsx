import { useState, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MapPin, ChevronDown } from 'lucide-react';
import UserDetailModal from '@/components/ui/UserDetailModal';
const UsersIcon = '/assets/Users.svg';
const WaterIcon = '/assets/water.svg';
const NorthIcon = '/assets/North.svg';
const SouthIcon = '/assets/South.svg';
const EastIcon = '/assets/East.svg';
const WestIcon = '/assets/West.svg';
const KigaliIcon = '/assets/Kigali.svg';

const UsersDetail = () => {
  const { province } = useParams();
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState(province || 'north');

  // Update selectedRegion when URL parameter changes
  useEffect(() => {
    if (province) {
      setSelectedRegion(province);
    }
  }, [province]);
  const [selectedDistrict, setSelectedDistrict] = useState('rulindo');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBase, setSelectedBase] = useState('Base');
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [baseDropdownOpen, setBaseDropdownOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const regionDropdownRef = useRef<HTMLDivElement>(null);
  const districtDropdownRef = useRef<HTMLDivElement>(null);
  const baseDropdownRef = useRef<HTMLDivElement>(null);

  // Province data with official icons
  const provinces = [
    { id: 'north', name: 'North', icon: NorthIcon, color: '#F3C623', districts: ['rulindo', 'gakenke', 'burera', 'musanze', 'gicumbi'] },
    { id: 'south', name: 'South', icon: SouthIcon, color: '#0E9CFF', districts: ['huye', 'nyanza', 'gikongoro', 'nyaruguru', 'muhanga', 'kamonyi', 'ruhango'] },
    { id: 'east', name: 'East', icon: EastIcon, color: '#F97316', districts: ['rwamagana', 'nyagatare', 'gatsibo', 'kayonza', 'kirehe', 'ngoma', 'bugesera'] },
    { id: 'west', name: 'West', icon: WestIcon, color: '#22C55E', districts: ['rubavu', 'nyabihu', 'karongi', 'rutsiro', 'nyamasheke', 'rusizi'] },
    { id: 'kigali', name: 'Kigali', icon: KigaliIcon, color: '#A855F7', districts: ['gasabo', 'kicukiro', 'nyarugenge'] },
  ];

  // District names mapping
  const districtNames: { [key: string]: string } = {
    'rulindo': 'Rulindo', 'gakenke': 'Gakenke', 'burera': 'Burera', 'musanze': 'Musanze', 'gicumbi': 'Gicumbi',
    'huye': 'Huye', 'nyanza': 'Nyanza', 'gikongoro': 'Gikongoro', 'nyaruguru': 'Nyaruguru', 'muhanga': 'Muhanga', 'kamonyi': 'Kamonyi', 'ruhango': 'Ruhango',
    'rwamagana': 'Rwamagana', 'nyagatare': 'Nyagatare', 'gatsibo': 'Gatsibo', 'kayonza': 'Kayonza', 'kirehe': 'Kirehe', 'ngoma': 'Ngoma', 'bugesera': 'Bugesera',
    'rubavu': 'Rubavu', 'nyabihu': 'Nyabihu', 'karongi': 'Karongi', 'rutsiro': 'Rutsiro', 'nyamasheke': 'Nyamasheke', 'rusizi': 'Rusizi',
    'gasabo': 'Gasabo', 'kicukiro': 'Kicukiro', 'nyarugenge': 'Nyarugenge'
  };

  // Dynamic data based on selected province and district
  const getProvinceData = (provinceId: string) => {
    const data: { [key: string]: { users: number; consumption: number; deviceCount: number; usersList: any[] } } = {
      north: {
        users: 5398,
        consumption: 92482,
        deviceCount: 1900,
        usersList: [
          { id: 1, name: 'Uwera liza', location: 'Cyohoha', consumed: '20k', unit: 'liters/month' },
          { id: 2, name: 'Mugisha Patrick', location: 'Cyohoha', consumed: '45k', unit: 'liters/month' },
          { id: 3, name: 'Kaliza Joannah', location: 'Cyohoha', consumed: '20k', unit: 'liters/month' },
          { id: 4, name: 'Cyubahiro Yvan', location: 'Cyohoha', consumed: '20k', unit: 'liters/month' },
          { id: 5, name: 'Umwari Vanessa', location: 'Cyohoha', consumed: '20k', unit: 'liters/month' },
          { id: 6, name: 'Kimenyi Yves', location: 'Cyohoha', consumed: '20k', unit: 'liters/month' },
          { id: 7, name: 'Uwase Honorine', location: 'Cyohoha', consumed: '20k', unit: 'liters/month' },
          { id: 8, name: 'Muvunyi Guillain', location: 'Cyohoha', consumed: '20k', unit: 'liters/month' },
          { id: 9, name: 'Keza Louange', location: 'Cyohoha', consumed: '20k', unit: 'liters/month' },
          { id: 10, name: 'Bigwi Aloys', location: 'Cyohoha', consumed: '20k', unit: 'liters/month' },
        ]
      },
      south: {
        users: 3200,
        consumption: 65432,
        deviceCount: 1200,
        usersList: [
          { id: 1, name: 'Nkurunziza Jean', location: 'Huye', consumed: '25k', unit: 'liters/month' },
          { id: 2, name: 'Mukamana Grace', location: 'Huye', consumed: '30k', unit: 'liters/month' },
          { id: 3, name: 'Niyonsenga Paul', location: 'Nyanza', consumed: '22k', unit: 'liters/month' },
          { id: 4, name: 'Uwimana Marie', location: 'Nyanza', consumed: '28k', unit: 'liters/month' },
          { id: 5, name: 'Nkurunziza Eric', location: 'Gikongoro', consumed: '24k', unit: 'liters/month' },
          { id: 6, name: 'Mukamana Alice', location: 'Gikongoro', consumed: '26k', unit: 'liters/month' },
          { id: 7, name: 'Niyonsenga David', location: 'Muhanga', consumed: '23k', unit: 'liters/month' },
          { id: 8, name: 'Uwimana Claire', location: 'Muhanga', consumed: '27k', unit: 'liters/month' },
          { id: 9, name: 'Nkurunziza Peter', location: 'Kamonyi', consumed: '25k', unit: 'liters/month' },
          { id: 10, name: 'Mukamana Rose', location: 'Kamonyi', consumed: '29k', unit: 'liters/month' },
        ]
      },
      east: {
        users: 4200,
        consumption: 78901,
        deviceCount: 1500,
        usersList: [
          { id: 1, name: 'Mugisha John', location: 'Rwamagana', consumed: '32k', unit: 'liters/month' },
          { id: 2, name: 'Nyiraneza Sarah', location: 'Rwamagana', consumed: '35k', unit: 'liters/month' },
          { id: 3, name: 'Nkurunziza James', location: 'Nyagatare', consumed: '28k', unit: 'liters/month' },
          { id: 4, name: 'Mukamana Faith', location: 'Nyagatare', consumed: '31k', unit: 'liters/month' },
          { id: 5, name: 'Niyonsenga Mark', location: 'Gatsibo', consumed: '29k', unit: 'liters/month' },
          { id: 6, name: 'Uwimana Hope', location: 'Gatsibo', consumed: '33k', unit: 'liters/month' },
          { id: 7, name: 'Nkurunziza Luke', location: 'Kayonza', consumed: '30k', unit: 'liters/month' },
          { id: 8, name: 'Mukamana Joy', location: 'Kayonza', consumed: '34k', unit: 'liters/month' },
          { id: 9, name: 'Niyonsenga Paul', location: 'Kirehe', consumed: '27k', unit: 'liters/month' },
          { id: 10, name: 'Uwimana Peace', location: 'Kirehe', consumed: '32k', unit: 'liters/month' },
        ]
      },
      west: {
        users: 3800,
        consumption: 71234,
        deviceCount: 1400,
        usersList: [
          { id: 1, name: 'Nkurunziza Peter', location: 'Rubavu', consumed: '26k', unit: 'liters/month' },
          { id: 2, name: 'Mukamana Grace', location: 'Rubavu', consumed: '29k', unit: 'liters/month' },
          { id: 3, name: 'Niyonsenga David', location: 'Nyabihu', consumed: '24k', unit: 'liters/month' },
          { id: 4, name: 'Uwimana Claire', location: 'Nyabihu', consumed: '28k', unit: 'liters/month' },
          { id: 5, name: 'Nkurunziza Eric', location: 'Karongi', consumed: '25k', unit: 'liters/month' },
          { id: 6, name: 'Mukamana Alice', location: 'Karongi', consumed: '27k', unit: 'liters/month' },
          { id: 7, name: 'Niyonsenga Mark', location: 'Rutsiro', consumed: '23k', unit: 'liters/month' },
          { id: 8, name: 'Uwimana Hope', location: 'Rutsiro', consumed: '26k', unit: 'liters/month' },
          { id: 9, name: 'Nkurunziza John', location: 'Nyamasheke', consumed: '24k', unit: 'liters/month' },
          { id: 10, name: 'Mukamana Sarah', location: 'Nyamasheke', consumed: '28k', unit: 'liters/month' },
        ]
      },
      kigali: {
        users: 8500,
        consumption: 156789,
        deviceCount: 2800,
        usersList: [
          { id: 1, name: 'Mugisha Jean', location: 'Gasabo', consumed: '45k', unit: 'liters/month' },
          { id: 2, name: 'Nyiraneza Marie', location: 'Gasabo', consumed: '52k', unit: 'liters/month' },
          { id: 3, name: 'Nkurunziza Paul', location: 'Kicukiro', consumed: '38k', unit: 'liters/month' },
          { id: 4, name: 'Mukamana Grace', location: 'Kicukiro', consumed: '41k', unit: 'liters/month' },
          { id: 5, name: 'Niyonsenga David', location: 'Nyarugenge', consumed: '35k', unit: 'liters/month' },
          { id: 6, name: 'Uwimana Claire', location: 'Nyarugenge', consumed: '39k', unit: 'liters/month' },
          { id: 7, name: 'Nkurunziza Eric', location: 'Gasabo', consumed: '42k', unit: 'liters/month' },
          { id: 8, name: 'Mukamana Alice', location: 'Gasabo', consumed: '48k', unit: 'liters/month' },
          { id: 9, name: 'Niyonsenga Mark', location: 'Kicukiro', consumed: '36k', unit: 'liters/month' },
          { id: 10, name: 'Uwimana Hope', location: 'Kicukiro', consumed: '44k', unit: 'liters/month' },
        ]
      }
    };
    return data[provinceId] || data.north;
  };

  const currentProvince = provinces.find(p => p.id === selectedRegion) || provinces[0];
  const currentData = getProvinceData(selectedRegion);
  const users = currentData.usersList;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setRegionDropdownOpen(false);
      }
      if (districtDropdownRef.current && !districtDropdownRef.current.contains(event.target as Node)) {
        setDistrictDropdownOpen(false);
      }
      if (baseDropdownRef.current && !baseDropdownRef.current.contains(event.target as Node)) {
        setBaseDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId);
    setSelectedDistrict(currentProvince.districts[0]);
    setRegionDropdownOpen(false);
    navigate(`/users/detail/${regionId}`);
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setDistrictDropdownOpen(false);
  };

  const handleViewMore = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <MainLayout>
      <div className="w-full min-h-screen bg-background px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-32 dark-mode-transition">
        {/* Region and District Selectors with Stats */}
        <div className="flex items-center justify-between mt-6 ml-6 mr-6">
          {/* Left side - Dropdowns */}
          <div className="flex items-center gap-6">
            {/* Province Dropdown */}
            <div className="relative" ref={regionDropdownRef}>
              <button
                className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-full border border-border shadow-sm text-sm font-semibold focus:outline-none transition hover:shadow-md active:scale-95 dark-mode-transition"
                onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                style={{ minWidth: 100 }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: currentProvince.color }}>
                  <img src={currentProvince.icon} alt={currentProvince.name} className="w-4 h-4" />
                </div>
                <span className="text-foreground">{currentProvince.name}</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>
              
              {regionDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-card rounded-lg shadow-lg border border-border z-50 dark-mode-transition">
                  {provinces.map((province) => (
                    <button
                      key={province.id}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors dark-mode-transition"
                      onClick={() => handleRegionChange(province.id)}
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: province.color }}>
                        <img src={province.icon} alt={province.name} className="w-3 h-3" />
                      </div>
                      <span className="text-foreground font-medium text-sm">{province.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* District Dropdown */}
            <div className="relative" ref={districtDropdownRef}>
              <button
                className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-full border border-border shadow-sm text-sm font-semibold focus:outline-none transition hover:shadow-md active:scale-95 dark-mode-transition"
                onClick={() => setDistrictDropdownOpen(!districtDropdownOpen)}
                style={{ minWidth: 100 }}
              >
                <span className="text-foreground text-sm font-semibold">
                  {districtNames[selectedDistrict]}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>
              
              {districtDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-card rounded-lg shadow-lg border border-border z-50 dark-mode-transition">
                  {currentProvince.districts.map((districtId, index) => (
                    <button
                      key={districtId}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors dark-mode-transition"
                      onClick={() => handleDistrictChange(districtId)}
                    >
                      <span className="text-foreground font-medium text-sm">
                        {districtNames[districtId]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Stats Section */}
          <div className="flex items-center gap-12">
            {/* Users Count */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={UsersIcon} alt="Users" className="w-8 h-8 dark:invert dark:brightness-0 dark:contrast-100" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-foreground text-2xl font-medium">{currentData.users.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm font-medium">Users</span>
              </div>
            </div>

            {/* Total Consumption */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={WaterIcon} alt="Water" className="w-8 h-8 dark:invert dark:brightness-0 dark:contrast-100" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-foreground text-2xl font-medium">{currentData.consumption.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm font-medium">liters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card - Wider */}
        <div className="mt-8 mx-6">
          <div className="bg-card rounded-lg shadow-sm p-8 max-w-7xl dark-mode-transition">
            {/* Header with Base and Device Info */}
            <div className="flex items-center mb-8">
              <div className="relative" ref={baseDropdownRef}>
                <button
                  className="flex items-center gap-2 text-foreground text-lg font-semibold hover:text-muted-foreground transition-colors dark-mode-transition"
                  onClick={() => setBaseDropdownOpen(!baseDropdownOpen)}
                >
                  {selectedBase}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {baseDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-32 bg-card rounded-lg shadow-lg border border-border z-50 dark-mode-transition">
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-accent transition-colors dark-mode-transition"
                      onClick={() => { setSelectedBase('Base'); setBaseDropdownOpen(false); }}
                    >
                      Base
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-accent transition-colors dark-mode-transition"
                      onClick={() => { setSelectedBase('Advanced'); setBaseDropdownOpen(false); }}
                    >
                      Advanced
                    </button>
                  </div>
                )}
              </div>
              
              {/* Horizontal Line */}
              <div className="flex-1 h-px bg-border mx-4 relative">
                {/* Diamond shape at the end */}
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-border rotate-45"></div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-foreground text-lg font-semibold">{currentData.deviceCount} esp32</span>
              </div>
            </div>

            {/* Users Table - Better Spacing */}
            <div className="w-full">
              {/* Table Header */}
              <div className="w-full h-10 bg-card shadow-sm rounded-md mb-2 flex items-center px-8 dark-mode-transition">
                <div className="w-16 text-foreground text-base font-medium">N°</div>
                <div className="w-64 ml-12 text-foreground text-base font-medium">Names</div>
                <div className="w-40 ml-16 text-foreground text-base font-medium">Location</div>
                <div className="w-40 ml-16 text-foreground text-base font-semibold text-center">Consumed</div>
                <div className="w-32 ml-16 text-foreground text-base font-medium">More</div>
              </div>

              {/* Table Rows */}
              {users.map((user, index) => (
                <div key={user.id} className="w-full h-10 bg-muted rounded-md mb-2 flex items-center px-8 dark-mode-transition">
                  <div className="w-16 text-foreground text-base font-medium">{user.id}</div>
                  <div className="w-64 ml-12 text-foreground text-base font-medium">{user.name}</div>
                  <div className="w-40 ml-16 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-foreground" />
                    <span className="text-foreground text-base font-medium">{user.location}</span>
                  </div>
                  <div className="w-40 ml-16 flex flex-col items-center justify-center">
                    <span className="text-foreground text-sm font-semibold">{user.consumed}</span>
                    <span className="text-muted-foreground text-xs font-semibold">{user.unit}</span>
                  </div>
                  <div className="w-32 ml-16">
                    <Button 
                      variant="outline" 
                      onClick={() => handleViewMore(user)}
                      className="h-6 px-3 text-xs font-semibold text-[#0E9CFF] border-[#0E9CFF] hover:bg-[#0E9CFF] hover:text-white rounded-full"
                    >
                      View more
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handlePageChange(1)}
                className="w-6 h-6 p-0"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className="w-6 h-6 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Button 
                variant={currentPage === 1 ? "default" : "ghost"}
                size="sm" 
                onClick={() => handlePageChange(1)}
                className={`w-6 h-6 p-0 ${currentPage === 1 ? 'bg-[#0E9CFF] text-white' : 'text-foreground'}`}
              >
                1
              </Button>
              <Button 
                variant={currentPage === 2 ? "default" : "ghost"}
                size="sm" 
                onClick={() => handlePageChange(2)}
                className={`w-6 h-6 p-0 ${currentPage === 2 ? 'bg-[#0E9CFF] text-white' : 'text-foreground'}`}
              >
                2
              </Button>
              <Button 
                variant={currentPage === 3 ? "default" : "ghost"}
                size="sm" 
                onClick={() => handlePageChange(3)}
                className={`w-6 h-6 p-0 ${currentPage === 3 ? 'bg-[#0E9CFF] text-white' : 'text-foreground'}`}
              >
                3
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handlePageChange(Math.min(3, currentPage + 1))}
                className="w-6 h-6 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handlePageChange(3)}
                className="w-6 h-6 p-0"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          user={selectedUser}
          province={selectedRegion}
        />
      )}
    </MainLayout>
  );
};

export default UsersDetail;
