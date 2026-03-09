import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { ChevronDown, Droplets, Zap, Plus } from 'lucide-react';
import { ScheduledControl, getSmartValveLocation, sendCommand,getTodayScheduledControls,getAllCommands,getProvinceCommandCount } from '@/services/api.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useToast } from '@/hooks/use-toast';

// Import SVG icons
// Define SVG icons as absolute paths (assets are in the public/assets directory)
const NorthIcon = '/assets/North.svg';
const SouthIcon = '/assets/South.svg';
const EastIcon = '/assets/East.svg';
const WestIcon = '/assets/West.svg';
const KigaliIcon = '/assets/Kigali.svg';
const CalendarGif = '/assets/Calendar.gif';

interface FormData {
  location: string;
  command: string;
  scheduled_date: string;
  scheduled_time: string;
}


interface Control {
  id:number;
  location:string;
  command:string;
  scheduled_time:string;
}

interface TodayScheduledControl {
  status: string;
  date: string;
  total_controls: number;
  controls: Control[];
}

interface PastControl {
  id:number;
  command:string;
  location:string;
  status:string;

}

interface HistoryData {
  status:string;
  total_commands:number; 
  commands:PastControl[];
}


interface ProvinceCommandCount {
  status: string;
  data: { [key: string]: number };
  total_commands: number;
}

const Control = () => {
  const [locations, setLocations] = useState({});
  const [districtToProvince, setDistrictToProvince] = useState({});
  const [selectedLocation, setSelectedLocation] = useState('');
  const [switchState, setSwitchState] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    location: '',
    command: '',
    scheduled_date: '',
    scheduled_time: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const [todayScheduledControl,setTodayScheduledControl] = useState<TodayScheduledControl | null>(null);
  const [historyTableData, setHistoryTableData] = useState<HistoryData | null>(null);
  const [provinceCommandCounts, setProvinceCommandCounts] = useState<ProvinceCommandCount | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of items to show per page

  // Pagination logic for history
  const getPaginatedHistory = () => {
    if (!historyTableData?.commands) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return historyTableData.commands.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    if (!historyTableData?.commands) return 0;
    return Math.ceil(historyTableData.commands.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle date and time change from DatePicker
  const handleDateTimeChange = (date: Date | null) => {
    if (date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setFormData({
        ...formData,
        scheduled_date: `${year}-${month}-${day}`, // YYYY-MM-DD for backend
        scheduled_time: `${hours}:${minutes}`, // HH:mm for backend
      });
    }
  };

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await getSmartValveLocation();
        setLocations(res.data);
        const map = {};
        Object.keys(res.data).forEach((province) => {
          map[`province:${province}`] = province;
          res.data[province].forEach((district) => {
            map[`district:${district}`] = province;
          });
        });
        setDistrictToProvince(map);
      } catch (err) {
        setError('Failed to load locations');
      }
    };
    fetchLocation();
  }, []);

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

  const handleSwitchToggle = async () => {
    if (!selectedLocation) {
      setError('Please select a location');
      toast({
        title: 'Error',
        description: 'Please select a location',
        variant: 'destructive',
      });
      return;
    }
    const command = !switchState ? 'ON' : 'OFF';
    setSwitchState(!switchState);
    await handleCommand(command);
  };

  const handleCommand = async (command: string) => {
    if (!selectedLocation) {
      setError('Please select a location');
      toast({
        title: 'Error',
        description: 'Please select a location',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const [type, value] = selectedLocation.split(':');
      const location = type === 'province' ? { province: value } : { district: value };
      const response = await sendCommand({ command, location });
      const data = response.data || {};
      console.log('API Response:', data);

      const { message = 'No message', commands = [], error } = data;

      if (error) {
        throw new Error(error);
      }

      // Determine top-level status if missing
      let status = data.status;
      if (!status && commands.length > 0) {
        const allFailed = commands.every((cmd: any) => cmd.status === 'failed');
        const anySuccess = commands.some((cmd: any) => cmd.status === 'success');
        status = anySuccess ? (allFailed ? 'failed' : 'success') : 'failed';
        
        // If we have mixed, let's call it partial_success
        if (anySuccess && commands.some((cmd: any) => cmd.status === 'failed')) {
          status = 'partial_success';
        }
      }

      const toastVariant = (status === 'success' || status === 'partial_success') ? 'default' : 'destructive';
      const failedCommands = commands.filter((cmd: any) => cmd.status === 'failed');
      const successCommands = commands.filter((cmd: any) => cmd.status === 'success');

      let toastDescription = '';
      if (failedCommands.length > 0) {
        toastDescription += 'Failed Devices:\n';
        toastDescription += failedCommands.map((cmd: any) => `${cmd.status_message || (cmd.device_id + ': Failed')}`).join('\n');
      }
      if (successCommands.length > 0) {
        if (toastDescription) toastDescription += '\n';
        toastDescription += 'Successful Devices:\n';
        toastDescription += successCommands.map((cmd: any) => cmd.status_message || (cmd.device_id + ': Connected')).join('\n');
      }
      
      if (commands.length === 0 && !error) {
        toastDescription = message || 'Command sent successfully';
        if (!status) status = 'success';
      } else if (commands.length === 0) {
        toastDescription = 'No device response';
      }

      setSuccess(message || 'Operation successful');
      toast({
        title: status === 'success' ? 'Success' : status === 'partial_success' ? 'Partial Success' : 'Failed',
        description: toastDescription,
        variant: (status === 'success' || status === 'partial_success') ? 'default' : 'destructive',
      });
    } catch (error: any) {
      console.error('Error in handleCommand:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to send command');
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send command',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
  
    // Client-side validation and debug
    const { location, command, scheduled_date, scheduled_time } = formData;
    console.log('FormData before submission:', { location, command, scheduled_date, scheduled_time }); // Debug log
  
    if (!location || !command || !scheduled_date || !scheduled_time) {
      setError('All fields (Location, Command, Date, and Time) are required.');
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
  
    try {
      const res = await ScheduledControl(formData);
      console.log('ScheduledControl response:', res.data);
      setSuccess('✅ Scheduled Control created successfully!');
      toast({
        title: 'Scheduled Control created',
        description: 'Your schedule has been created successfully',
      });
      setFormData({ location: '', command: '', scheduled_date: '', scheduled_time: '' });
      setShowScheduleForm(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || '❌ Scheduled Control failed';
      console.log("Scheduled Control failed",error)
      setError(errorMessage);
      toast({
        title: 'Scheduled Control failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  const regions = [
    { id: 'north', name: 'Northern', icon: NorthIcon, color: '#FCD34D' },
    { id: 'south', name: 'Southern', icon: SouthIcon, color: '#60A5FA' },
    { id: 'east', name: 'Eastern', icon: EastIcon, color: '#FB923C' },
    { id: 'west', name: 'Western', icon: WestIcon, color: '#22C55E' },
    { id: 'kigali', name: 'Kigali', icon: KigaliIcon, color: '#A855F7' },
  ];
 
  // Fetch province command counts on mount
  useEffect(() => {
    const fetchProvinceCommandCounts = async () => {
      try {
        const res = await getProvinceCommandCount();
        console.log("Received Province Command Counts ", res.data);
        setProvinceCommandCounts(res.data);
      } catch (err) {
        console.error("Error fetching province command counts:", err);
        setError('Failed to load province command counts');
      }
    };
    fetchProvinceCommandCounts();
  }, []);



  const regionStyles = {
    Northern: { icon: NorthIcon, color: '#FCD34D' },
    Southern: { icon: SouthIcon, color: '#60A5FA' },
    Eastern: { icon: EastIcon, color: '#FB923C' },
    Western: { icon: WestIcon, color: '#22C55E' },
    Kigali: { icon: KigaliIcon, color: '#A855F7' },
  };




  useEffect(() => {
    const fetchCommandHistory = async () => {
      try {
        setIsLoading(true)
        const res = await getAllCommands();
        console.log("Received Command History ", res.data);
        setHistoryTableData(res.data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch  Command History');
        console.log("Failed to fetch  Command History",err.message)
      }
      finally{
        setIsLoading(false)
      }
      
    };
    fetchCommandHistory ();
  }, []);

  useEffect(() => {
    const fetchTodayScheduledControls = async () => {
      try {
        setIsLoading(true)
        const res = await getTodayScheduledControls();
        console.log("Received Today Scheduled Control ", res.data);
        setTodayScheduledControl(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch scheduled controls');
        console.log("Failed to fetch scheduled controls",err.message)
      }
      finally{
        setIsLoading(false)
      }
      
    };
    fetchTodayScheduledControls();
  }, []);

  const getLocationName = (location: string) => {
    return location.replace('district:', '');
  };



  const getRegionStyle = (locationKey: string) => {
    if (!locationKey) {
      console.debug('getRegionStyle: No locationKey provided, using default');
      return { icon: NorthIcon, color: '#6B7280' };
    }
    const province = districtToProvince[locationKey] || locationKey.split(':')[1];
    if (!province) {
      console.debug('getRegionStyle: No province found for locationKey:', locationKey);
      return { icon: NorthIcon, color: '#6B7280' };
    }
    const normalizedProvince = province.trim();
    const style = regionStyles[normalizedProvince];
    if (!style) {
      console.debug('getRegionStyle: No style found for province:', normalizedProvince);
      return { icon: NorthIcon, color: '#6B7280' };
    }
    console.debug('getRegionStyle: Found style for province:', normalizedProvince, style);
    return style;
  };

  return (
    <MainLayout>
      <div className="w-full min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-32">
        <div style={{ margin: 0, padding: 0 }}>
          {/* Header - Province Dropdown */}
          <div className="flex items-center gap-2" style={{ marginBottom: 0, paddingBottom: 0 }}>
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-base font-semibold focus:outline-none"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ minWidth: 120 }}
              >
                <span
                  className="w-7 h-7 flex items-center justify-center rounded-full"
                  style={{ background: `${getRegionStyle(selectedLocation).color}33` }}
                >
                  <img
                    src={getRegionStyle(selectedLocation).icon}
                    alt={selectedLocation.split(':')[1] || 'Select location'}
                    className="w-4 h-4"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const target = e.target as HTMLImageElement;
                      target.src = NorthIcon;
                    }}
                  />
                </span>
                <span style={{ color: getRegionStyle(selectedLocation).color, fontWeight: 700 }}>
                  {selectedLocation ? selectedLocation.split(':')[1] : 'Select location'}
                </span>
                <ChevronDown className={`ml-1 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} size={18} />
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-20 border border-gray-100 flex flex-col" ref={dropdownRef}>
                  {Object.keys(locations).map((province) => [
                    <button
                      key={`province:${province}`}
                      className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl text-left"
                      onClick={() => {
                        setSelectedLocation(`province:${province}`);
                        setDropdownOpen(false);
                      }}
                      style={{ width: '100%' }}
                    >
                      <span
                        className="w-6 h-6 flex items-center justify-center rounded-full"
                        style={{ background: `${regionStyles[province]?.color || '#6B7280'}33` }}
                      >
                        <img src={regionStyles[province]?.icon || NorthIcon} alt={province} className="w-4 h-4" />
                      </span>
                      <span style={{ color: regionStyles[province]?.color || '#6B7280', fontWeight: 700 }}>{province} (All)</span>
                    </button>,
                    ...locations[province].map((district) => (
                      <button
                        key={`district:${district}`}
                        className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl text-left"
                        onClick={() => {
                          setSelectedLocation(`district:${district}`);
                          setDropdownOpen(false);
                        }}
                        style={{ width: '100%' }}
                      >
                        <span
                          className="w-6 h-6 flex items-center justify-center rounded-full"
                          style={{ background: `${regionStyles[province]?.color || '#6B7280'}33` }}
                        >
                          <img src={regionStyles[province]?.icon || NorthIcon} alt={district} className="w-4 h-4" />
                        </span>
                        <span style={{ color: regionStyles[province]?.color || '#6B7280', fontWeight: 700 }}>
                          {province}: {district}
                        </span>
        </button>
                    )),
                  ])}
                </div>
              )}
            </div>
      </div>
          {/* Grid with toggle and controls */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 max-w-5xl mx-auto" style={{ marginTop: '16px' }}>
        {/* Control Panel */}
            <div className="lg:col-span-5">
          <SectionHeader title="Control" />
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 flex flex-col items-center">
                {/* Custom Toggle Switch */}
                <div
                  className={`relative w-[460px] h-[200px] rounded-full flex items-center transition-colors duration-300 cursor-pointer`}
                  onClick={handleSwitchToggle}
                  style={{ background: switchState ? '#D4FFE0' : '#E0E8F7' }}
                >
                  <div
                    className={`absolute left-4 top-4 w-[168px] h-[168px] rounded-full flex items-center justify-center font-bold text-6xl transition-transform duration-300 shadow-md ${
                      switchState ? 'translate-x-[284px]' : ''
                    }`}
                    style={{
                      background: '#333333',
                      color: switchState ? '#388E3C' : '#60A5FA',
                      border: `4px solid ${switchState ? '#388E3C' : '#60A5FA'}`,
                    }}
                  >
                    {switchState ? 'ON' : 'OFF'}
                  </div>
                </div>
                <div className="w-full mt-6 flex items-center justify-between text-gray-500 dark:text-gray-400 px-4">
                  <span className="flex items-center gap-2 text-sm">
                    <Zap size={16} className="text-gray-500 dark:text-gray-400" />
                    <span>Status</span>
                    <div
                      className={`px-2 py-1 text-xs rounded-full ${
                        switchState ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {switchState ? 'Online' : 'Offline'}
            </div>
              </span>
                  <span className="flex items-center gap-2 text-sm">
                    <Droplets size={16} className="text-blue-500" />
                    <span>24 cm³/h</span>
              </span>
            </div>
              </div>
          <div className="mt-6">
            <SectionHeader title="History">
              <span className="text-sm text-gray-500 dark:text-gray-400">(past hour)</span>
            </SectionHeader>
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 min-h-[350px]">
              <div className="overflow-x-auto">
                    <table className="data-table w-full">
                  <thead>
                    <tr>
                          <th className="text-left py-2">N°</th>
                          <th className="text-left py-2">Location</th>
                          <th className="text-left py-2">Command</th>
                          <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>

                        {historyTableData && historyTableData.commands?.length > 0 ? (
                          getPaginatedHistory().map((history)=> (
                            <tr key={history.id} className="border-t border-gray-100 dark:border-gray-700">
                            <td className="py-2">{history.id}</td>
                            <td className="py-2">{getLocationName(history.location)}</td>
                            <td className="py-2">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  history.command === 'ON' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {history.command}
                          </span>
                        </td>
                            <td className="py-2">
                            <span
                                 className={`text-xs font-medium px-2 py-1 rounded-full ${
                                   history.status === "success"
                                     ? "bg-[#01CE68] text-white"
                                     : history.status === "pending"
                                     ? "bg-yellow-500 text-white"
                                     : "bg-[#5180FF] text-white"
                                 }`}
                             >
                               {history.status}
                             </span>


                              {/* <StatusBadge status={history.status} /> */}
                            </td>
                          </tr>
                          ))

                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8">
                              <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                <img 
                                  src={CalendarGif} 
                                  alt="No history data" 
                                  className="w-[90%] h-[90%] max-w-80 max-h-80 mb-4 object-contain"
                                />
                                <p className="text-sm">No Past History</p>
                              </div>
                        </td>
                      </tr>
                        )}
                        
                     
                  </tbody>
                </table>
              </div>
                  {/* Pagination */}
                  {historyTableData && historyTableData.commands?.length > 0 && getTotalPages() > 1 && (
                    <div className="mt-4 flex justify-center">
                      <div className="flex items-center space-x-2">
                        {/* Previous Button */}
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          &lt;
                        </button>

                        {/* Page Numbers */}
                        {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        {/* Next Button */}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === getTotalPages()}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            currentPage === getTotalPages()
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          &gt;
                        </button>
                      </div>
              </div>
                  )}
            </div>
          </div>
        </div>
        {/* Scheduled Controls */}
        <div className="lg:col-span-2">
          <SectionHeader title="Scheduled Controls">
            <button
              onClick={() => setShowScheduleForm(true)}
                  className="flex items-center gap-1 bg-blue-500 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-600 transition-colors"
            >
                  <Plus className="w-4 h-4" />
              Add
            </button>
          </SectionHeader>
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4 min-h-[350px]">
            {showScheduleForm ? (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto relative">
                      <button
                        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => setShowScheduleForm(false)}
                      >
                        &times;
                      </button>
                      <h3 className="text-lg font-medium mb-4 text-center text-gray-900 dark:text-white">Make your control schedule</h3>
                <form onSubmit={handleSubmitSchedule}>
                  <div className="space-y-4">
                    <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Location*
                      </label>
                            <select
                              name="location"
                              value={formData.location}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select location</option>
                              {Object.keys(locations).map((province) => [
                                <option key={`province:${province}`} value={`province:${province}`}>
                                  {province} (All)
                                </option>,
                                ...locations[province].map((district) => (
                                  <option key={`district:${district}`} value={`district:${district}`}>
                                    {province}: {district}
                                  </option>
                                )),
                              ])}
                            </select>
                    </div>
                    <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Command*
                      </label>
                      <input 
                        type="text" 
                              name="command"
                              value={formData.command}
                              onChange={handleChange}
                              placeholder="e.g ON / OFF"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                              Date & Time*
                      </label>
                            <DatePicker
                              selected={
                                formData.scheduled_date && formData.scheduled_time
                                  ? new Date(`${formData.scheduled_date}T${formData.scheduled_time}:00`)
                                  : null
                              }
                              onChange={handleDateTimeChange}
                              showTimeSelect
                              timeFormat="HH:mm"
                              timeIntervals={15}
                              dateFormat="yyyy-MM-dd HH:mm"
                              placeholderText="Select Date and Time"
                              className={`w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                error && (!formData.scheduled_date || !formData.scheduled_time)
                                  ? 'border-red-500'
                                  : 'border-gray-300 dark:border-gray-700'
                              }`}
                            />
                            {error && (!formData.scheduled_date || !formData.scheduled_time) && (
                              <p className="mt-1 text-xs text-red-500">Date and Time are required.</p>
                            )}
                    </div>
                    <div className="pt-4 flex justify-center">
                      <button 
                        type="submit" 
                              className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-md transition-colors"
                              disabled={isLoading}
                      >
                              {isLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
                  </div>
                ) : todayScheduledControl && todayScheduledControl.controls?.length > 0 ? (
              <div className="space-y-4">
                    {todayScheduledControl.controls.map((control) => (
                      <div key={control.id} className="flex items-start">
                    <div className="mt-1 mr-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <div className="h-full w-0.5 bg-blue-200 dark:bg-blue-900/30 mx-auto mt-1"></div>
                    </div>
                    <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{control.scheduled_time}</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            Turn {control.command} in <span className="font-semibold">{getLocationName(control.location)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <img 
                      src={CalendarGif} 
                      alt="No scheduled controls" 
                      className="w-[90%] h-[90%] max-w-80 max-h-80 mb-4 object-contain"
                    />
                    <p className="text-sm">No Scheduled Controls</p>
              </div>
            )}
          </div>
          <div className="mt-6">
            <SectionHeader title="Stats" />
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4 min-h-[350px]">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex justify-center gap-3">
                      {regions.slice(0, 3).map((region) => (
                        <div
                          key={region.id}
                          className="flex flex-col items-center justify-center p-2 rounded-full"
                          style={{ background: `${region.color}33`, width: '80px', height: '80px' }}
                        >
                          <img src={region.icon} alt={region.name} className="w-10 h-10" />
                          <span className="text-xs text-foreground font-bold">
                          {provinceCommandCounts?.data?.[region.name] || 0} cmd
                            </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center gap-3">
                      {regions.slice(3, 5).map((region) => (
                        <div
                          key={region.id}
                          className="flex flex-col items-center justify-center p-2 rounded-full"
                          style={{ background: `${region.color}33`, width: '80px', height: '80px' }}
                        >
                          <img src={region.icon} alt={region.name} className="w-10 h-10" />
                          <span className="text-xs text-foreground font-bold">
                          {provinceCommandCounts?.data?.[region.name] || 0} cmd
                            </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Control;