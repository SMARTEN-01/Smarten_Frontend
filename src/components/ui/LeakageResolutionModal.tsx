import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, CheckCircle, Activity, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getLeakageById, resolveLeakage } from '@/services/api';
const HouseSearchingCuate = '/assets/House_searching-cuate_1.svg';

interface LeakageResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  leakageData: any;
  onResolved: (leakageId: number) => void; // Updated to pass leakage ID
}

const LeakageResolutionModal: React.FC<LeakageResolutionModalProps> = ({
  isOpen,
  onClose,
  leakageData,
  onResolved
}) => {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<'investigating' | 'resolved'>('investigating');
  const [showResolvedForm, setShowResolvedForm] = useState(false);
  // Get today's date in YYYY-MM-DD format for the date input
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [resolvedForm, setResolvedForm] = useState({
    date: getTodayDate(), // Set default to today's date
    plumber: '',
    note: '',
  });
  const [resolvedErrors, setResolvedErrors] = useState({ date: '', plumber: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [detailedLeakageData, setDetailedLeakageData] = useState(null);
  const [resolvedData, setResolvedData] = useState(null);

  // Fetch detailed leakage data when modal opens
  useEffect(() => {
    if (isOpen && leakageData?.id) {
      const fetchDetailedData = async () => {
        try {
          const response = await getLeakageById(leakageData.id);
          if (response && response.leakage) {
            setDetailedLeakageData(response.leakage);
          }
        } catch (error) {
          /* console.error('Failed to fetch detailed leakage data:', error); */
        }
      };
      fetchDetailedData();
    }
    
    // Reset states when modal opens
    if (isOpen) {
      setSelectedStatus('investigating');
      setShowResolvedForm(false);
      setResolvedData(null);
      setResolvedForm({ date: getTodayDate(), plumber: '', note: '' });
      setResolvedErrors({ date: '', plumber: '', note: '' });
    }
  }, [isOpen, leakageData?.id]);

  // Handle status change
  const handleStatusChange = (status: 'investigating' | 'resolved') => {
    if (status === 'resolved') {
      setShowResolvedForm(true);
      // Don't change selectedStatus yet - only change after successful form submission
    } else {
      setShowResolvedForm(false);
      setSelectedStatus('investigating');
    }
  };

  // Handle resolved form submission
  const handleResolvedFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug form values before validation
    /* console.log('Form values before validation:', {
      date: resolvedForm.date,
      plumber: resolvedForm.plumber,
      note: resolvedForm.note,
    }); */
    
    // Validation
    const errors = { date: '', plumber: '', note: '' };
    if (!resolvedForm.date) {
      errors.date = 'Date is required';
    } else {
      // Check if date is in the future
      const selectedDate = new Date(resolvedForm.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (selectedDate > today) {
        errors.date = 'Resolved date cannot be in the future';
      }
    }
    if (!resolvedForm.plumber.trim()) errors.plumber = 'Plumber name is required';
    if (!resolvedForm.note.trim()) errors.note = 'Resolution note is required';
    
    setResolvedErrors(errors);
    
    if (Object.values(errors).some(error => error)) {
      return;
    }

    try {
      setLoading(true);
      
      // Format date to DD-MM-YYYY format as expected by API
      const formatDateForAPI = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const resolutionData = {
        leakage: leakageData.id,
        resolved_date: formatDateForAPI(resolvedForm.date),
        plumber_name: resolvedForm.plumber,
        resolved_note: resolvedForm.note
      };

      /* console.log('Sending resolution data:', resolutionData); */
      /* console.log('Leakage data ID:', leakageData.id); */
      /* console.log('Leakage data:', leakageData); */
      
      // Validate leakage ID
      if (!leakageData.id || leakageData.id <= 0) {
        throw new Error('Invalid leakage ID');
      }

      const response = await resolveLeakage(resolutionData);
      /* console.log('Resolution response:', response); */
      
      toast({
        title: "Leakage Resolved",
        description: response.message || "The leakage has been successfully resolved.",
      });

      // Only update status to resolved after successful submission
      setSelectedStatus('resolved');
      
      // Save resolved data to display
      /* console.log('Saving resolved data:', {
        date: resolvedForm.date,
        plumber: resolvedForm.plumber,
        note: resolvedForm.note,
      }); */
      setResolvedData({
        date: resolvedForm.date,
        plumber: resolvedForm.plumber,
        note: resolvedForm.note,
      });
      
      // Reset form
      setResolvedForm({ date: getTodayDate(), plumber: '', note: '' });
      setShowResolvedForm(false);
      
      // Call the callback to refresh data
      /* console.log('Modal calling onResolved with leakageData:', leakageData); */
      onResolved(leakageData.id);
      
      // Don't auto-close modal - let user dismiss it manually
      
    } catch (error: any) {
      /* console.error('Resolution error:', error); */
      /* console.error('Error response:', error.response?.data); */
      /* console.error('Error status:', error.response?.status); */
      /* console.error('Error headers:', error.response?.headers); */
      
      let errorMessage = "Failed to resolve leakage.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data) {
        errorMessage = JSON.stringify(error.response.data);
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date and time
  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return 'Date not available';
    try {
      const date = new Date(dateTimeString);
      return {
        date: date.toLocaleDateString('en-US', { 
          month: '2-digit', 
          day: '2-digit', 
          year: 'numeric' 
        }),
        time: date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
      };
    } catch (error) {
      return { date: 'Date not available', time: 'Time not available' };
    }
  };

  if (!isOpen) return null;

  const displayData = detailedLeakageData || leakageData;
  const dateTime = formatDateTime(displayData?.occurredAt || displayData?.time || '');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex">
          {/* Left side - Leakage Detection Details (exact copy from main page) */}
          <div className="flex-1 flex flex-col justify-center px-8 py-8 gap-1" style={{ minWidth: 0 }}>
            <span className="text-lg font-semibold mb-2">Leakage Detection</span>
            {/* Water loss centered */}
            <div className="flex flex-col items-center justify-center mb-2" style={{margin: '0 auto'}}>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-foreground">
                  {displayData?.water_lost_litres ? Number(displayData.water_lost_litres).toFixed(1) : 
                   displayData?.waterLost ? parseFloat(displayData.waterLost.replace('L', '')).toFixed(1) : '0.0'}
                </span>
                <span className="text-sm text-gray-500 mb-1">cm³</span>
              </div>
              <div className="text-xs text-gray-500">water lost</div>
            </div>
            
            {/* Date and Time */}
            <div className="flex flex-col items-center justify-center mb-2" style={{margin: '0 auto'}}>
              <div className="text-lg font-bold text-foreground">
                {dateTime.date}
              </div>
              <div className="text-sm text-gray-500">
                {dateTime.time}
              </div>
            </div>
            
            {/* Separator line */}
            <div className="w-full h-px bg-gray-200 my-4"></div>
            
            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <MapPin size={16} className="text-foreground" />
              <span className="font-medium">Location:</span>
              <span className="text-foreground">{displayData?.location || 'Location not available'}</span>
            </div>
            
            {/* Severity */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle size={16} className="text-red-500" />
              <span className="font-medium">Severity:</span>
              <span className="text-foreground font-semibold">{displayData?.severity || 'HIGH'}</span>
            </div>
            
            {/* Action */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CheckCircle size={16} className="text-foreground" />
              <span className="font-medium">Action:</span>
              <span className="text-foreground">Yes</span>
            </div>
            
            {/* Status - show radio buttons when investigating, badge when resolved */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Activity size={16} className="text-foreground" />
              <span className="font-medium">Status</span>
              {selectedStatus === 'investigating' ? (
                <div className="flex items-center gap-4 ml-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      value="resolved" 
                      checked={showResolvedForm}
                      onChange={() => handleStatusChange('resolved')}
                      className="w-3 h-3"
                    />
                    <span className="text-xs">Resolved</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      value="investigating" 
                      checked={!showResolvedForm}
                      onChange={() => handleStatusChange('investigating')}
                      className="w-3 h-3"
                    />
                    <span className="text-xs">Investigating</span>
                  </label>
                </div>
              ) : selectedStatus === 'resolved' ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Resolved
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Investigating
                </span>
              )}
            </div>
          </div>

          {/* Right side: Ongoing Analysis or Resolved Leakage (exact copy from main page) */}
          <div className="flex-1 flex flex-col items-center justify-center p-0 relative" style={{ minWidth: 0, minHeight: 300 }}>
            <div className={`w-full h-full transition-all duration-300 ${(selectedStatus === 'investigating' && !showResolvedForm) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none absolute'}`}
              style={{ position: (selectedStatus === 'investigating' && !showResolvedForm) ? 'relative' : 'absolute' }}>
              {(selectedStatus === 'investigating' && !showResolvedForm) && (
                <div className="bg-[#3B82F6] rounded-xl flex flex-col items-center justify-center mx-auto my-6 animate-fade-in" style={{maxWidth: 340, minHeight: 240, width: '100%', display: 'flex'}}>
                  <span className="text-white text-lg font-semibold mb-2 mt-8 text-center">Ongoing Analysis of<br/>Detected Leakage</span>
                  <img src={HouseSearchingCuate} alt="Ongoing Analysis" className="w-56 h-44 object-contain mb-8" />
                </div>
              )}
            </div>
            <div className={`w-full h-full transition-all duration-300 flex items-center justify-center ${(showResolvedForm || resolvedData) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none absolute'}`}
              style={{ position: (showResolvedForm || resolvedData) ? 'relative' : 'absolute' }}>
              {showResolvedForm && !resolvedData && (
                <div className="bg-[#3B82F6] rounded-xl flex flex-col items-center justify-center mx-auto my-6 p-6 relative animate-fade-in" style={{maxWidth: 400, minHeight: 260, width: '100%', display: 'flex'}}>
                  <span className="text-white text-lg font-semibold mb-4">Resolved leakage</span>
                  <form onSubmit={handleResolvedFormSubmit} className="flex flex-col w-full gap-4 items-center">
                    <div className="flex w-full gap-4">
                      <div className="flex flex-col flex-1">
                        <label className="text-white text-sm mb-1">Date</label>
                        <input 
                          type="date" 
                          value={resolvedForm.date}
                          onChange={(e) => setResolvedForm(prev => ({ ...prev, date: e.target.value }))}
                          className="rounded-lg px-3 py-2 outline-none border-none w-full" 
                          style={{ color: resolvedForm.date ? 'black' : '#9CA3AF' }}
                          max={getTodayDate()} // Prevent future dates
                          required
                        />
                        {resolvedErrors.date && <span className="text-red-300 text-xs mt-1">{resolvedErrors.date}</span>}
                      </div>
                      <div className="flex flex-col flex-1">
                        <label className="text-white text-sm mb-1">Plumber</label>
                        <input 
                          type="text" 
                          placeholder="Plumber name" 
                          value={resolvedForm.plumber}
                          onChange={(e) => setResolvedForm(prev => ({ ...prev, plumber: e.target.value }))}
                          className="rounded-lg px-3 py-2 outline-none border-none w-full" 
                          required
                        />
                        {resolvedErrors.plumber && <span className="text-red-300 text-xs mt-1">{resolvedErrors.plumber}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col w-full">
                      <label className="text-white text-sm mb-1">Note</label>
                      <textarea 
                        placeholder="Resolution note" 
                        value={resolvedForm.note}
                        onChange={(e) => setResolvedForm(prev => ({ ...prev, note: e.target.value }))}
                        className="rounded-lg px-3 py-2 outline-none border-none w-full min-h-[80px]" 
                        required
                      />
                      {resolvedErrors.note && <span className="text-red-300 text-xs mt-1">{resolvedErrors.note}</span>}
                    </div>
                    <button type="submit" className="bg-[#0EA5E9] text-white font-semibold rounded-lg px-8 py-2 mt-2 self-center">Save</button>
                  </form>
                </div>
              )}
              {resolvedData && (
                <div className="bg-[#338CF5] rounded-xl p-6 pb-14 relative flex flex-col gap-3 w-full max-w-md mx-auto animate-fade-in overflow-hidden" style={{minHeight: 240, margin: '20px 40px 20px 20px'}}>
                  {/* console.log('Displaying resolved data:', resolvedData) */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-base font-semibold">Resolved leakage</span>
                    <Edit3 size={20} className="text-white cursor-pointer hover:text-blue-200 transition-colors" />
                  </div>
                  <div className="flex flex-row gap-8 mb-4">
                    <div>
                      <div className="text-xs text-white font-semibold">Date</div>
                      <div className="text-base text-white/80">{resolvedData.date}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white font-semibold">Plumber</div>
                      <div className="text-base text-white/80">{resolvedData.plumber}</div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="text-xs text-white font-semibold mb-1">Resolved note</div>
                    <div className="text-sm leading-snug text-blue-600 font-medium">{resolvedData.note}</div>
                  </div>
                  <div className="absolute bottom-3 right-4 flex items-center gap-2 opacity-25 select-none pointer-events-none">
                    <span className="text-white text-4xl font-extrabold tracking-wide">Success</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeakageResolutionModal;
