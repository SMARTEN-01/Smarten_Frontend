import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus } from 'lucide-react';
import { TotalEspPerProvince, TotalSensorPerProvince, TotalSmartValvePerProvince, TotalEspPerDistrict, TotalSensorPerDistrict, TotalSmartValvePerDistrict } from '@/services/api.js';

// Import SVG icons
const NorthernIcon = '/assets/North.svg';
const SouthernIcon = '/assets/South.svg';
const EasternIcon = '/assets/East.svg';
const WesternIcon = '/assets/West.svg';
const KigaliIcon = '/assets/Kigali.svg';

interface ProvinceRecord {
  Eastern: number;
  Kigali: number;
  Northern: number;
  Southern: number;
  Western: number;
}

const DeviceSelector = () => {
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('esp32');
  const [selectedRegion, setSelectedRegion] = useState<string>('Northern');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [numberEspProvince, setNumberEspProvince] = useState<ProvinceRecord | null>(null);
  const [numberSensorProvince, setNumberSensorProvince] = useState<ProvinceRecord | null>(null);
  const [numberSmartValveProvince, setNumberSmartValveProvince] = useState<ProvinceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [numberEsp32District, setNumberEsp32District] = useState<{ [key: string]: number }>({});
  const [numberSensorDistrict, setNumberSensorDistrict] = useState<{ [key: string]: number }>({});
  const [numberSmartValveDistrict, setNumberSmartValveDistrict] = useState<{ [key: string]: number }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  // Fetch Total Number of ESP per Province
  useEffect(() => {
    const getTotalEspPerProvince = async () => {
      try {
        setIsLoading(true);
        const res = await TotalEspPerProvince();
        /* console.log("[Devices] Received total number of ESP per province ", res.data); */
        setNumberEspProvince(res.data);
      } catch (err: any) {
        /* console.log("Error while fetching total number of ESP per province ", err.message); */
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    getTotalEspPerProvince();
  }, []);

  // Fetch Total Number of Sensors per Province
  useEffect(() => {
    const getTotalSensorPerProvince = async () => {
      try {
        setIsLoading(true);
        const res = await TotalSensorPerProvince();
        /* console.log("[Devices] Received total number of Sensors per province ", res.data); */
        setNumberSensorProvince(res.data);
      } catch (err: any) {
        /* console.log("Error while fetching total number of Sensors per province ", err.message); */
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    getTotalSensorPerProvince();
  }, []);

  // Fetch Total Number of Smart Valve per Province
  useEffect(() => {
    const getTotalSmartValvePerProvince = async () => {
      try {
        setIsLoading(true);
        const res = await TotalSmartValvePerProvince();
        /* console.log("[Devices] Received total number of Smart Valve per province ", res.data); */
        setNumberSmartValveProvince(res.data);
      } catch (err: any) {
        /* console.log("Error while fetching total number of Smart Valve per province ", err.message); */
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    getTotalSmartValvePerProvince();
  }, []);

  // Fetch Total Number of ESP per District
  useEffect(() => {
    const getTotalEspPerDistrict = async () => {
      if (!selectedRegion) return;
      try {
        setIsLoading(true);
        const res = await TotalEspPerDistrict(selectedRegion);
        /* console.log("[Devices] Received total number of ESP32 per district ", res.data); */
        setNumberEsp32District(res.data);
      } catch (err: any) {
        /* console.log("Error while fetching total number of ESP32 per district ", err.message); */
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    getTotalEspPerDistrict();
  }, [selectedRegion]);

  // Fetch Total Number of Sensor per District
  useEffect(() => {
    const getTotalSensorPerDistrict = async () => {
      if (!selectedRegion) return;
      try {
        setIsLoading(true);
        const res = await TotalSensorPerDistrict(selectedRegion);
        /* console.log("[Devices] Received total number of sensors per district ", res.data); */
        setNumberSensorDistrict(res.data);
      } catch (err: any) {
        /* console.log("Error while fetching total number of sensors per district ", err.message); */
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    getTotalSensorPerDistrict();
  }, [selectedRegion]);

  // Fetch Total Number of Smart Valve per District
  useEffect(() => {
    const getTotalSmartValvePerDistrict = async () => {
      if (!selectedRegion) return;
      try {
        setIsLoading(true);
        const res = await TotalSmartValvePerDistrict(selectedRegion);
        /* console.log("[Devices] Received total number of smart valve per district ", res.data); */
        setNumberSmartValveDistrict(res.data);
      } catch (err: any) {
        /* console.log("Error while fetching total number of smart valve per district ", err.message); */
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    getTotalSmartValvePerDistrict();
  }, [selectedRegion]);

  const deviceTypes = [
    { id: 'esp32', name: 'ESP32' },
    { id: 'sensors', name: 'Sensors' },
    { id: 'smart-valves', name: 'Smart Valves' },
  ];

  const regions = [
    { id: 'Northern', name: 'Northern', value: 0, icon: NorthernIcon, color: '#FCD34D', text: 'ESP32', sensor: { flow: 0 }, smartValves: 0 },
    { id: 'Southern', name: 'Southern', value: 0, icon: SouthernIcon, color: '#60A5FA', text: 'ESP32', sensor: { flow: 0 }, smartValves: 0 },
    { id: 'Eastern', name: 'Eastern', value: 0, icon: EasternIcon, color: '#FB923C', text: 'ESP32', sensor: { flow: 0 }, smartValves: 0 },
    { id: 'Western', name: 'Western', value: 0, icon: WesternIcon, color: '#22C55E', text: 'ESP32', sensor: { flow: 0 }, smartValves: 0 },
    { id: 'Kigali', name: 'Kigali', value: 0, icon: KigaliIcon, color: '#A855F7', text: 'ESP32', sensor: { flow: 0 }, smartValves: 0 },
  ];

  const provinceDistricts = {
    Northern: [
      { id: 'Rulindo', name: 'Rulindo' },
      { id: 'Burera', name: 'Burera' },
      { id: 'Musanze', name: 'Musanze' },
      { id: 'Gicumbi', name: 'Gicumbi' },
      { id: 'Gakenke', name: 'Gakenke' },
    ],
    Southern: [
      { id: 'Huye', name: 'Huye' },
      { id: 'Nyanza', name: 'Nyanza' },
      { id: 'Gisagara', name: 'Gisagara' },
      { id: 'Nyaruguru', name: 'Nyaruguru' },
      { id: 'Kamonyi', name: 'Kamonyi' },
      { id: 'Ruhango', name: 'Ruhango' },
      { id: 'Muhanga', name: 'Muhanga' },
      { id: 'Nyamagabe', name: 'Nyamagabe' },
    ],
    Eastern: [
      { id: 'Bugesera', name: 'Bugesera' },
      { id: 'Nyagatare', name: 'Nyagatare' },
      { id: 'Gatsibo', name: 'Gatsibo' },
      { id: 'Kayonza', name: 'Kayonza' },
      { id: 'Kirehe', name: 'Kirehe' },
      { id: 'Ngoma', name: 'Ngoma' },
      { id: 'Rwamagana', name: 'Rwamagana' },
    ],
    Western: [
      { id: 'Nyabihu', name: 'Nyabihu' },
      { id: 'Karongi', name: 'Karongi' },
      { id: 'Ngororero', name: 'Ngororero' },
      { id: 'Nyamasheke', name: 'Nyamasheke' },
      { id: 'Rubavu', name: 'Rubavu' },
      { id: 'Rusizi', name: 'Rusizi' },
      { id: 'Rutsiro', name: 'Rutsiro' },
    ],
    Kigali: [
      { id: 'Gasabo', name: 'Gasabo' },
      { id: 'Nyarugenge', name: 'Nyarugenge' },
      { id: 'Kicukiro', name: 'Kicukiro' },
    ],
  };

  // Get appropriate color for the selected device type
  const getDeviceColor = () => {
    switch (selectedDeviceType) {
      case 'esp32':
        return '#0095ff';
      case 'sensors':
        return '#10b981';
      case 'smart-valves':
        return '#f97316';
      default:
        return '#0095ff';
    }
  };

  // Get appropriate title based on the selected device type
  const getDeviceTitle = () => {
    switch (selectedDeviceType) {
      case 'esp32':
        return 'ESP32';
      case 'sensors':
        return 'Sensors';
      case 'smart-valves':
        return 'Smart Valves';
      default:
        return 'ESP32';
    }
  };

  // Get districts based on selected region
  const getDistricts = () => {
    if (!selectedRegion) return [];
    return provinceDistricts[selectedRegion as keyof typeof provinceDistricts] || [];
  };

  // Get count for a district based on selected device type
  const getDistrictCount = (districtId: string) => {
    switch (selectedDeviceType) {
      case 'esp32':
        return numberEsp32District[districtId] || 0;
      case 'sensors':
        return numberSensorDistrict[districtId] || 0;
      case 'smart-valves':
        return numberSmartValveDistrict[districtId] || 0;
      default:
        return 0;
    }
  };

  // Render a district card with dynamic data
  const renderDistrictCard = (district: any) => (
    <div key={district.id} className="bg-white rounded-3xl shadow-md overflow-hidden w-[200px] flex flex-col items-center">
      <div
        className="w-full py-3 text-center font-bold text-lg"
        style={{
          background: `repeating-linear-gradient(90deg, ${regions.find(r => r.id === selectedRegion)?.color}CC, ${regions.find(r => r.id === selectedRegion)?.color}CC 12px, ${regions.find(r => r.id === selectedRegion)?.color}99 12px, ${regions.find(r => r.id === selectedRegion)?.color}99 24px)`,
          color: '#fff',
          letterSpacing: '1px',
        }}
      >
        {district.name}
      </div>
      <div className="p-5 w-full flex flex-col items-center">
        <div className="text-3xl font-extrabold text-center mb-0">{getDistrictCount(district.id)}</div>
        <div className="text-sm text-gray-500 text-center mb-4">{getDeviceTitle()}</div>
        <Link to={`/device/list/${district.id}?type=${selectedDeviceType}`} className="w-full flex justify-center">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-full px-4 py-1.5 transition-all duration-200 shadow"
            style={{ fontSize: '13px' }}
          >
            See Devices
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Choose a device</h1>
            {selectedDeviceType === 'esp32' && (
              <Button
                onClick={() => navigate('/device/register-esp')}
                className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Add ESP
              </Button>
            )}
          </div>

          {/* Device Type Selector */}
          <div className="inline-flex bg-white rounded-full p-1 border border-gray-200 shadow-sm mb-8 mx-auto">
            {deviceTypes.map((type) => (
              <button
                key={type.id}
                className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  selectedDeviceType === type.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedDeviceType(type.id)}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Regional Overview */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {regions.map((region) => (
              <div
                key={region.id}
                className={`bg-white rounded-xl shadow-md p-5 cursor-pointer flex flex-col items-center border-2 transition-all duration-200 ${
                  selectedRegion === region.id ? 'border-blue-500' : 'border-transparent'
                }`}
                onClick={() => setSelectedRegion(region.id)}
                style={{ minWidth: 180 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: `${region.color}33` }}>
                    <img src={region.icon} alt={region.name} className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-base" style={{ color: region.color }}>
                    {region.name}
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mb-1">
                  {selectedDeviceType === 'esp32' && numberEspProvince?.[region.id]?.toLocaleString()}
                  {selectedDeviceType === 'sensors' && numberSensorProvince?.[region.id]?.toLocaleString()}
                  {selectedDeviceType === 'smart-valves' && numberSmartValveProvince?.[region.id]?.toLocaleString()}
                </div>
                <div className="text-xs font-medium text-gray-500">{getDeviceTitle()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Province Dropdown and District Cards Section */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-base font-semibold focus:outline-none"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ minWidth: 120 }}
              >
                <span
                  className="w-7 h-7 flex items-center justify-center rounded-full"
                  style={{ background: `${regions.find((r) => r.id === selectedRegion)?.color}33` }}
                >
                  <img
                    src={regions.find((r) => r.id === selectedRegion)?.icon}
                    alt={regions.find((r) => r.id === selectedRegion)?.name}
                    className="w-4 h-4"
                  />
                </span>
                <span style={{ color: regions.find((r) => r.id === selectedRegion)?.color, fontWeight: 700 }}>
                  {regions.find((r) => r.id === selectedRegion)?.name}
                </span>
                <ChevronDown className={`ml-1 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} size={18} />
              </button>
              {dropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-20 border border-gray-100 flex flex-col"
                  ref={dropdownRef}
                >
                  {regions.map((region) => (
                    <button
                      key={region.id}
                      className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl text-left"
                      onClick={() => {
                        setSelectedRegion(region.id);
                        setDropdownOpen(false);
                      }}
                      style={{ width: '100%' }}
                    >
                      <span className="w-6 h-6 flex items-center justify-center rounded-full" style={{ background: `${region.color}33` }}>
                        <img src={region.icon} alt={region.name} className="w-4 h-4" />
                      </span>
                      <span style={{ color: region.color, fontWeight: 700 }}>{region.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="ml-2 text-lg font-semibold">On the district level</span>
          </div>

          {/* Loading and Error States */}
          {isLoading && <div className="text-center text-gray-500 mb-4">Loading...</div>}
          {error && <div className="text-center text-red-500 mb-4">{error}</div>}

          {/* District Cards */}
          {selectedRegion === 'Northern' ? (
            <>
              <div className="flex flex-wrap gap-8 justify-center w-full mb-8">
                {getDistricts().slice(0, 3).map((district) => renderDistrictCard(district))}
              </div>
              <div className="flex flex-wrap gap-8 justify-center w-full">
                <div className="flex-1"></div>
                {getDistricts().slice(3, 5).map((district) => renderDistrictCard(district))}
                <div className="flex-1"></div>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-8 justify-center">
              {getDistricts().map((district) => renderDistrictCard(district))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DeviceSelector;