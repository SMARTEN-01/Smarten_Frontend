import { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/hooks/use-theme';

import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Palette, 
  Database, 
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Moon,
  Sun
} from 'lucide-react';
// Define SVG icons as absolute paths (assets are in the public/assets directory)
const NorthIcon = '/assets/North.svg';
const SouthIcon = '/assets/South.svg';
const EastIcon = '/assets/East.svg';
const WestIcon = '/assets/West.svg';
const KigaliIcon = '/assets/Kigali.svg';
const WasacLogo = '/assets/WASAC 1.png';
const SuccessImage = '/assets/Success.png';
import { getUserDetails } from '@/services/api';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const [name, setName] = useState('WASAC Admin');
  const [email, setEmail] = useState('admin@wasac.rw');
  const [phone, setPhone] = useState('+250 788 123 456');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Profile avatar local preview
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const navigate = useNavigate();


  // User profile fetched from backend
const [user, setUser] = useState<null | {
  name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
}>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
  
useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getUserDetails();
        if (mounted) setUser(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';


  // Notification settings`
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [leakageAlerts, setLeakageAlerts] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [realTimeAlerts, setRealTimeAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [monthlyReports, setMonthlyReports] = useState(true);
  
  // System settings
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Africa/Kigali');
  const [dataRetention, setDataRetention] = useState('365');
  const [autoBackup, setAutoBackup] = useState(true);
  const [dataCompression, setDataCompression] = useState(false);

  // History tab state
  const [historyTab, setHistoryTab] = useState<'leakage' | 'readings' | 'control'>('leakage');
  const [selectedProvince, setSelectedProvince] = useState('north');
  const [dateRange, setDateRange] = useState('yesterday');

  // Mock data for provinces and districts (from Figma)
  const provinceData = {
    north: {
      name: 'North',
      icon: NorthIcon,
      color: 'bg-yellow-50',
      textColor: '#FFD600',
      districts: [
        { id: 1, name: 'Musanze', status: 'underflow', value: 24 },
        { id: 2, name: 'Gakenke', status: 'normal', value: 24 },
        { id: 3, name: 'Rulindo', status: 'overflow', value: 24 },
        { id: 4, name: 'Burera', status: 'underflow', value: 24 },
        { id: 5, name: 'Gicumbi', status: 'normal', value: 24 },
      ],
    },
    south: {
      name: 'South',
      icon: SouthIcon,
      color: 'bg-blue-50',
      textColor: '#338CF5',
      districts: [
        { id: 1, name: 'Huye', status: 'underflow', value: 24 },
        { id: 2, name: 'Nyanza', status: 'normal', value: 24 },
        { id: 3, name: 'Gisagara', status: 'overflow', value: 24 },
        { id: 4, name: 'Nyaruguru', status: 'normal', value: 24 },
        { id: 5, name: 'Kamonyi', status: 'underflow', value: 24 },
        { id: 6, name: 'Ruhango', status: 'normal', value: 24 },
        { id: 7, name: 'Muhanga', status: 'overflow', value: 24 },
        { id: 8, name: 'Nyamagabe', status: 'normal', value: 24 },
      ],
    },
    east: {
      name: 'East',
      icon: EastIcon,
      color: 'bg-orange-50',
      textColor: '#F59E0B',
      districts: [
        { id: 1, name: 'Bugesera', status: 'underflow', value: 24 },
        { id: 2, name: 'Nyagatare', status: 'normal', value: 24 },
        { id: 3, name: 'Gatsibo', status: 'overflow', value: 24 },
        { id: 4, name: 'Kayonza', status: 'normal', value: 24 },
        { id: 5, name: 'Kirehe', status: 'underflow', value: 24 },
        { id: 6, name: 'Ngoma', status: 'normal', value: 24 },
        { id: 7, name: 'Rwamagana', status: 'overflow', value: 24 },
      ],
    },
    west: {
      name: 'West',
      icon: WestIcon,
      color: 'bg-green-50',
      textColor: '#22C55E',
      districts: [
        { id: 1, name: 'Nyabihu', status: 'underflow', value: 24 },
        { id: 2, name: 'Karongi', status: 'normal', value: 24 },
        { id: 3, name: 'Ngororero', status: 'overflow', value: 24 },
        { id: 4, name: 'Nyamasheke', status: 'normal', value: 24 },
        { id: 5, name: 'Rubavu', status: 'underflow', value: 24 },
        { id: 6, name: 'Rusizi', status: 'normal', value: 24 },
        { id: 7, name: 'Rutsiro', status: 'overflow', value: 24 },
      ],
    },
    kigali: {
      name: 'Kigali',
      icon: KigaliIcon,
      color: 'bg-purple-50',
      textColor: '#8B5CF6',
      districts: [
        { id: 1, name: 'Gasabo', status: 'underflow', value: 24 },
        { id: 2, name: 'Nyarugenge', status: 'normal', value: 24 },
        { id: 3, name: 'Kicukiro', status: 'overflow', value: 24 },
      ],
    },
  };

  const dateRanges = [
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'past-week', label: 'Past week' },
    { value: 'past-month', label: 'Past Month' },
  ];

  // Mock control logs (will be wired to backend later)
  type ControlRow = { id: number; dateLabel: string; time: string; location: string; command: 'ON' | 'OFF'; situation: 'normal' | 'leakage' };
  const baseControlRows: ControlRow[] = [
    { id: 1, dateLabel: 'Today', time: '09:00 AM', location: 'Burera', command: 'ON', situation: 'normal' },
    { id: 2, dateLabel: 'Yesterday', time: '12:00 AM', location: 'Gicumbi', command: 'OFF', situation: 'leakage' },
    { id: 3, dateLabel: 'Today', time: '11:00 AM', location: 'Musanze', command: 'ON', situation: 'normal' },
    { id: 4, dateLabel: 'Today', time: '02:00 PM', location: 'Rulindo', command: 'ON', situation: 'leakage' },
    { id: 5, dateLabel: 'Today', time: '04:00 PM', location: 'Gakenke', command: 'OFF', situation: 'normal' },
    { id: 6, dateLabel: 'Today', time: '06:00 PM', location: 'Burera', command: 'OFF', situation: 'leakage' },
    { id: 7, dateLabel: 'Today', time: '08:00 PM', location: 'Gicumbi', command: 'OFF', situation: 'normal' },
    { id: 8, dateLabel: 'Yesterday', time: '09:00 AM', location: 'Musanze', command: 'ON', situation: 'leakage' },
    { id: 9, dateLabel: '06/04/2025', time: '12:00 AM', location: 'Rulindo', command: 'ON', situation: 'leakage' },
    { id: 10, dateLabel: '05/04/2025', time: '10:00 PM', location: 'Gakenke', command: 'OFF', situation: 'leakage' },
    { id: 11, dateLabel: '04/04/2025', time: '09:00 AM', location: 'Gicumbi', command: 'ON', situation: 'leakage' },
  ];

  const getControlRows = (provinceKey: string, range: string): ControlRow[] => {
    // For now we reuse the same rows; in real integration this will filter by province and range
    return baseControlRows.map(r => ({ ...r }));
  };

  // State for control detail modal/page
  const [showControlDetail, setShowControlDetail] = useState<null | ControlRow>(null);

  // CSV export for Control report
  const downloadControlCSV = () => {
    const rows = getControlRows(selectedProvince, dateRange);
    const header = 'No,Date,Time,Location,Command,Situation\n';
    const body = rows
      .map((r, idx) => [idx + 1, r.dateLabel, r.time, r.location, r.command, r.situation].join(','))
      .join('\n');
    const csv = header + body;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `control_report_${selectedProvince}_${dateRange}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to build section headers for the Readings view based on selected range.
  // We keep this client-side for now (awaiting backend integration) to match the model screens.
  const getReadingSections = (range: string): string[] => {
    switch (range) {
      case 'yesterday':
        return ['00:00 AM', '01:00 AM'];
      case 'past-week':
        // Sample last-week day headers in the model style
        return ['MON-24/03/2025 TO SUN-30/03/2025', 'MON-31/03/2025 TO SUN-06/04/2025'];
      case 'past-month':
        // Month headers in the model style
        return ['JAN 2025', 'FEB 2025'];
      default:
        return ['00:00 AM'];
    }
  };

  // --- PDF HEADER/FOOTER REFINEMENT FOR ALL REPORTS ---
  // Helper for faint color (opacity ~10%)
  const faintBlue = 'rgba(99, 172, 255, 0.1)'; // for control/readings
  const mainBlue = '#338CF5';
  const mainBlueText = [51, 140, 245] as const;


  const readingsContainerRef = useRef<HTMLDivElement | null>(null);
  const handleDownloadReadingsPDF = async (): Promise<void> => {
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf') as unknown as Promise<{ jsPDF: any }>,
      ]);
      const target = readingsContainerRef.current;
      if (!target) return;
      const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const generatedAt = new Date();
      const reportId = `READ-${generatedAt.getFullYear()}${String(generatedAt.getMonth()+1).padStart(2,'0')}${String(generatedAt.getDate()).padStart(2,'0')}-${String(generatedAt.getHours()).padStart(2,'0')}${String(generatedAt.getMinutes()).padStart(2,'0')}${String(generatedAt.getSeconds()).padStart(2,'0')}`;
      const provinceName = provinceData[selectedProvince].name;
      // Faint header background
      pdf.setFillColor(51,140,245, 0.10); // very faint blue
      pdf.rect(5, 5, pageWidth - 10, 30, 'F');
      // Subtle line below header
      pdf.setDrawColor(200);
      pdf.setLineWidth(0.3);
      pdf.line(5, 35, pageWidth - 5, 35);
      // Logo
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = WasacLogo as unknown as string;
        await new Promise(resolve => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
        });
        try {
          pdf.addImage(logoImg, 'PNG', 10, 10, 12, 12);
        } catch {}
      } catch {}
      // Header text (smaller, modern, blue)
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...mainBlueText);
      pdf.text('WATER READINGS REPORT', 25, 16);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...mainBlueText);
      pdf.text('WASAC', 25, 22);
      // Metadata (smaller, blue)
      pdf.setFontSize(7);
      pdf.setTextColor(...mainBlueText);
      pdf.text(`Province: ${provinceName}`, 10, 30);
      pdf.text(`ID: ${reportId}`, 60, 30);
      pdf.text(`Date: ${generatedAt.toLocaleDateString()}`, 110, 30);
      pdf.text(`Range: ${dateRanges.find(r => r.value === dateRange)?.label ?? dateRange}`, 150, 30);
      // Content
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const headerHeight = 38;
      const footerHeight = 18;
      const availableHeight = pageHeight - headerHeight - footerHeight;
      let pageNumber = 1;
      let totalPages = Math.ceil(imgHeight / availableHeight);
      let position = 0;
      while (position < imgHeight) {
        if (pageNumber > 1) {
          pdf.addPage();
          pdf.setFillColor(51,140,245, 0.10);
          pdf.rect(5, 5, pageWidth - 10, 12, 'F');
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...mainBlueText);
          pdf.text(`Readings Report - ${provinceName} (Continued)`, 10, 13);
          pdf.setDrawColor(200);
          pdf.setLineWidth(0.3);
          pdf.line(5, 17, pageWidth - 5, 17);
        }
        const yPos = pageNumber === 1 ? headerHeight : 20;
        pdf.addImage(imgData, 'PNG', 10, yPos - position, imgWidth, imgHeight);
        // Faint footer background
        pdf.setFillColor(51,140,245, 0.10);
        pdf.rect(5, pageHeight - footerHeight, pageWidth - 10, footerHeight - 2, 'F');
        // Subtle line above footer
        pdf.setDrawColor(200);
        pdf.setLineWidth(0.3);
        pdf.line(5, pageHeight - footerHeight, pageWidth - 5, pageHeight - footerHeight);
        // Footer text (smaller, blue)
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...mainBlueText);
        pdf.text('WASAC | KG 7 Ave, Kigali, Rwanda | +250 788 300 000 | info@wasac.rw', 10, pageHeight - 8);
        pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 35, pageHeight - 8);
        pdf.text(`Generated: ${generatedAt.toLocaleString()}`, 10, pageHeight - 3);
        position += availableHeight;
        pageNumber++;
      }
      const filename = `WASAC_Readings_Report_${provinceName}_${dateRange}_${generatedAt.toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('PDF export failed', error);
    }
  };

  // --- LEAKAGE PDF ---
  const leakageContainerRef = useRef<HTMLDivElement | null>(null);
  const handleDownloadLeakagePDF = async (): Promise<void> => {
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf') as unknown as Promise<{ jsPDF: any }>,
      ]);
      const target = leakageContainerRef.current;
      if (!target) return;
      const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const generatedAt = new Date();
      const reportId = `LEAK-${generatedAt.getFullYear()}${String(generatedAt.getMonth()+1).padStart(2,'0')}${String(generatedAt.getDate()).padStart(2,'0')}-${String(generatedAt.getHours()).padStart(2,'0')}${String(generatedAt.getMinutes()).padStart(2,'0')}${String(generatedAt.getSeconds()).padStart(2,'0')}`;
      const provinceName = provinceData[selectedProvince].name;
      // Faint header background
      pdf.setFillColor(51,140,245, 0.10); // use blue for all
      pdf.rect(5, 5, pageWidth - 10, 30, 'F');
      pdf.setDrawColor(200);
      pdf.setLineWidth(0.3);
      pdf.line(5, 35, pageWidth - 5, 35);
      // Logo
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = WasacLogo as unknown as string;
        await new Promise(resolve => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
        });
        try {
          pdf.addImage(logoImg, 'PNG', 10, 10, 12, 12);
        } catch {}
      } catch {}
      // Header text (smaller, modern, blue)
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...mainBlueText);
      pdf.text('WATER LEAKAGE REPORT', 25, 16);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...mainBlueText);
      pdf.text('WASAC', 25, 22);
      // Metadata (smaller, blue)
      pdf.setFontSize(7);
      pdf.setTextColor(...mainBlueText);
      pdf.text(`Province: ${provinceName}`, 10, 30);
      pdf.text(`ID: ${reportId}`, 60, 30);
      pdf.text(`Date: ${generatedAt.toLocaleDateString()}`, 110, 30);
      pdf.text(`Range: ${dateRanges.find(r => r.value === dateRange)?.label ?? dateRange}`, 150, 30);
      // Content
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const headerHeight = 38;
      const footerHeight = 18;
      const availableHeight = pageHeight - headerHeight - footerHeight;
      let pageNumber = 1;
      let totalPages = Math.ceil(imgHeight / availableHeight);
      let position = 0;
      while (position < imgHeight) {
        if (pageNumber > 1) {
          pdf.addPage();
          pdf.setFillColor(51,140,245, 0.10);
          pdf.rect(5, 5, pageWidth - 10, 12, 'F');
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...mainBlueText);
          pdf.text(`Leakage Report - ${provinceName} (Continued)`, 10, 13);
          pdf.setDrawColor(200);
          pdf.setLineWidth(0.3);
          pdf.line(5, 17, pageWidth - 5, 17);
        }
        const yPos = pageNumber === 1 ? headerHeight : 20;
        pdf.addImage(imgData, 'PNG', 10, yPos - position, imgWidth, imgHeight);
        pdf.setFillColor(51,140,245, 0.10);
        pdf.rect(5, pageHeight - footerHeight, pageWidth - 10, footerHeight - 2, 'F');
        pdf.setDrawColor(200);
        pdf.setLineWidth(0.3);
        pdf.line(5, pageHeight - footerHeight, pageWidth - 5, pageHeight - footerHeight);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...mainBlueText);
        pdf.text('WASAC | Emergency: +250 788 300 001 | emergency@wasac.rw', 10, pageHeight - 8);
        pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 35, pageHeight - 8);
        pdf.text(`Generated: ${generatedAt.toLocaleString()}`, 10, pageHeight - 3);
        position += availableHeight;
        pageNumber++;
      }
      const filename = `WASAC_Leakage_Report_${provinceName}_${dateRange}_${generatedAt.toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Leakage PDF export failed', error);
    }
  };

  // --- CONTROL PDF ---
  const controlContainerRef = useRef<HTMLDivElement | null>(null);
  const controlDetailRef = useRef<HTMLDivElement | null>(null);
  const handleDownloadControlPDF = async (): Promise<void> => {
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf') as unknown as Promise<{ jsPDF: any }>,
      ]);
      const target = controlContainerRef.current;
      if (!target) return;
      // Use html2canvas to capture the actual HTML as rendered (pixel-perfect)
      const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const generatedAt = new Date();
      const reportId = `CTRL-${generatedAt.getFullYear()}${String(generatedAt.getMonth()+1).padStart(2,'0')}${String(generatedAt.getDate()).padStart(2,'0')}-${String(generatedAt.getHours()).padStart(2,'0')}${String(generatedAt.getMinutes()).padStart(2,'0')}${String(generatedAt.getSeconds()).padStart(2,'0')}`;
      const provinceName = provinceData[selectedProvince].name;
      pdf.setFillColor(51,140,245, 0.10); // very faint blue
      pdf.rect(5, 5, pageWidth - 10, 30, 'F');
      pdf.setDrawColor(200);
      pdf.setLineWidth(0.3);
      pdf.line(5, 35, pageWidth - 5, 35);
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = WasacLogo as unknown as string;
        await new Promise(resolve => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
        });
        try {
          pdf.addImage(logoImg, 'PNG', 10, 10, 12, 12);
        } catch {}
      } catch {}
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...mainBlueText);
      pdf.text('WATER CONTROL REPORT', 25, 16);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...mainBlueText);
      pdf.text('WASAC', 25, 22);
      pdf.setFontSize(7);
      pdf.setTextColor(...mainBlueText);
      pdf.text(`Province: ${provinceName}`, 10, 30);
      pdf.text(`ID: ${reportId}`, 60, 30);
      pdf.text(`Date: ${generatedAt.toLocaleDateString()}`, 110, 30);
      pdf.text(`Range: ${dateRanges.find(r => r.value === dateRange)?.label ?? dateRange}`, 150, 30);
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const headerHeight = 38;
      const footerHeight = 18;
      const availableHeight = pageHeight - headerHeight - footerHeight;
      let pageNumber = 1;
      let totalPages = Math.ceil(imgHeight / availableHeight);
      let position = 0;
      while (position < imgHeight) {
        if (pageNumber > 1) {
          pdf.addPage();
          pdf.setFillColor(51,140,245, 0.10);
          pdf.rect(5, 5, pageWidth - 10, 12, 'F');
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...mainBlueText);
          pdf.text(`Control Report - ${provinceName} (Continued)`, 10, 13);
          pdf.setDrawColor(200);
          pdf.setLineWidth(0.3);
          pdf.line(5, 17, pageWidth - 5, 17);
        }
        const yPos = pageNumber === 1 ? headerHeight : 20;
        pdf.addImage(imgData, 'PNG', 10, yPos - position, imgWidth, imgHeight);
        pdf.setFillColor(51,140,245, 0.10);
        pdf.rect(5, pageHeight - footerHeight, pageWidth - 10, footerHeight - 2, 'F');
        pdf.setDrawColor(200);
        pdf.setLineWidth(0.3);
        pdf.line(5, pageHeight - footerHeight, pageWidth - 5, pageHeight - footerHeight);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...mainBlueText);
        pdf.text('WASAC | Control Center: +250 788 300 002 | operations@wasac.rw', 10, pageHeight - 8);
        pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 35, pageHeight - 8);
        pdf.text(`Generated: ${generatedAt.toLocaleString()}`, 10, pageHeight - 3);
        position += availableHeight;
        pageNumber++;
      }
      const filename = `WASAC_Control_Report_${provinceName}_${dateRange}_${generatedAt.toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
    } catch (e) {
      console.error('Control PDF export failed', e);
    }
  };

  // Control detail PDF (for a single district view)
  const handleDownloadControlDetailPDF = async (): Promise<void> => {
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf') as unknown as Promise<{ jsPDF: any }>,
      ]);
      const target = controlDetailRef.current;
      if (!target) return;
      const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const generatedAt = new Date();
      const provinceName = provinceData[selectedProvince].name;

      // Minimal header in faint blue
      pdf.setFillColor(51, 140, 245, 0.10);
      pdf.rect(5, 5, pageWidth - 10, 20, 'F');
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = WasacLogo as unknown as string;
        await new Promise(resolve => { logoImg.onload = resolve; logoImg.onerror = resolve; });
        try { pdf.addImage(logoImg, 'PNG', 10, 8, 10, 10); } catch {}
      } catch {}
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...mainBlueText);
      pdf.text(`Control Report Detail - ${provinceName}`, 25, 13);
      pdf.setDrawColor(200);
      pdf.line(5, 25, pageWidth - 5, 25);

      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const yStart = 30;
      if (yStart + imgHeight > pageHeight - 15) {
        const scale = (pageHeight - yStart - 15) / imgHeight;
        pdf.addImage(imgData, 'PNG', 10, yStart, imgWidth * scale, imgHeight * scale);
      } else {
        pdf.addImage(imgData, 'PNG', 10, yStart, imgWidth, imgHeight);
      }

      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...mainBlueText);
      pdf.text(`Generated: ${generatedAt.toLocaleString()}`, 10, pageHeight - 8);
      pdf.text('WASAC | Control Center: +250 788 300 002 | operations@wasac.rw', 10, pageHeight - 3);

      pdf.save(`WASAC_Control_Detail_${provinceName}_${generatedAt.toISOString().slice(0,10)}.pdf`);
    } catch (e) {
      console.error('Control detail PDF export failed', e);
    }
  };

  const { theme, toggleTheme, setTheme } = useTheme();
  const { toast } = useToast();

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Profile updated',
      description: 'Your profile information has been updated successfully.',
    });
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both password fields match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'Password updated',
      description: 'Your password has been updated successfully.',
    });
    
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleNotificationSave = () => {
    toast({
      title: 'Notification settings saved',
      description: 'Your notification preferences have been updated.',
    });
  };

  const handleSystemSave = () => {
    toast({
      title: 'System settings saved',
      description: 'Your system preferences have been updated.',
    });
  };

  const handleDataExport = () => {
    toast({
      title: 'Export started',
      description: 'Your data export will be ready for download shortly.',
    });
  };

  const handleDataImport = () => {
    toast({
      title: 'Import started',
      description: 'Your data is being imported. This may take a few minutes.',
    });
  };

  // 1. Add mock leakage data
  const leakageHistory = [
    {
      id: 1,
      date: '2025-03-06',
      day: 'TUE',
      time: '12:00 AM',
      waterLoss: 20,
      location: 'Kigali, Kicukiro, Kamashahi',
      severity: 'High',
      action: 'Yes',
      status: 'Investigating',
      resolved: {
        date: '2025-04-06',
        plumber: 'Nshimiyumukiza Aimable',
        note: 'There was a massive leakage that damage the pipe in a great amount, but it has been fixed and water is flowing again',
        success: true,
      },
    },
    {
      id: 2,
      date: '2025-03-14',
      day: 'FRI',
      time: '12:00 AM',
      waterLoss: 15,
      location: 'Kigali, Gasabo, Remera',
      severity: 'Medium',
      action: 'Yes',
      status: 'Resolved',
      resolved: {
        date: '2025-04-15',
        plumber: 'Uwimana Jean',
        note: 'Leakage fixed, water flow normal.',
        success: true,
      },
    },
  ];

  // 2. Add CSV download function for leakage
  function downloadLeakageCSV() {
    const header = 'Location,Date,Time,Severity,Status,Water Loss (cm³),Action\n';
    const rows = leakageHistory.map(l => `${l.location},${l.date},${l.time},${l.severity},${l.status},${l.waterLoss},${l.action}`).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leakage_report.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 3. In the History TabsContent, render Leakage section if historyTab === 'leakage'
  // 4. Set default tab to 'leakage' when opening History
  // (No replacement needed, just ensure historyTab is initialized to 'leakage')

  return (
    <MainLayout title="Settings">
      <div className="w-full min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-32">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7 bg-white dark:bg-gray-800">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>

              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                System
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Data
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>View your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                {loading ? (
                                <div className="text-sm text-gray-500">Loading...</div>
                              ) : error ? (
                                <div className="text-sm text-red-600">{error}</div>
                              ) : (
                                <>
                    <div className="flex items-center gap-6 mb-6">
                                    <div className="w-24 h-24 bg-blue-500 rounded-full overflow-hidden flex items-center justify-center">
                                      {user?.profile_image ? (
                                        <img
                                          src={user.profile_image}
                                          alt={user.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-white text-2xl font-bold">{initial}</span>
                                      )}
                      </div>
                      <div>
                                      <div className="text-xl font-semibold">{user?.name}</div>
                                      <div className="text-sm text-gray-600">{user?.email}</div>
                      </div>
                    </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                      <div className="text-xs text-gray-500">Full Name</div>
                                      <div className="text-sm font-medium">{user?.name}</div>
                      </div>
                                    <div>
                                      <div className="text-xs text-gray-500">Email</div>
                                      <div className="text-sm font-medium">{user?.email}</div>
                      </div>
                                    <div>
                                      <div className="text-xs text-gray-500">Phone</div>
                                      <div className="text-sm font-medium">{user?.phone || '—'}</div>
                    </div>

                      </div>
                      
                                  <div className="mt-6 flex justify-end">
                                    <Button onClick={() => navigate('/profile')}>View your Profile</Button>
                      </div>
                                </>
                              )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Configure how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Delivery Methods</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Email Notifications</Label>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">SMS Notifications</Label>
                          <p className="text-sm text-gray-500">Receive critical alerts via SMS</p>
                        </div>
                        <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Push Notifications</Label>
                          <p className="text-sm text-gray-500">Browser push notifications</p>
                        </div>
                        <Switch checked={realTimeAlerts} onCheckedChange={setRealTimeAlerts} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Alert Types</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Leakage Alerts</Label>
                          <p className="text-sm text-gray-500">Get notified about water leakage detection</p>
                        </div>
                        <Switch checked={leakageAlerts} onCheckedChange={setLeakageAlerts} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">System Updates</Label>
                          <p className="text-sm text-gray-500">Notifications about system updates and maintenance</p>
                        </div>
                        <Switch checked={systemUpdates} onCheckedChange={setSystemUpdates} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Maintenance Alerts</Label>
                          <p className="text-sm text-gray-500">Scheduled maintenance notifications</p>
                        </div>
                        <Switch checked={maintenanceAlerts} onCheckedChange={setMaintenanceAlerts} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Weekly Reports</Label>
                          <p className="text-sm text-gray-500">Weekly system performance reports</p>
                        </div>
                        <Switch checked={weeklyReports} onCheckedChange={setWeeklyReports} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Monthly Reports</Label>
                          <p className="text-sm text-gray-500">Monthly analytics and insights</p>
                        </div>
                        <Switch checked={monthlyReports} onCheckedChange={setMonthlyReports} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleNotificationSave} className="bg-blue-500 hover:bg-blue-600 gap-2">
                      <Save className="w-4 h-4" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Password & Security
                  </CardTitle>
                  <CardDescription>Update your password and security settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordUpdate} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input 
                          id="current-password" 
                          type={showPassword ? "text" : "password"}
                          value={currentPassword} 
                          onChange={(e) => setCurrentPassword(e.target.value)} 
                          placeholder="Enter current password" 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input 
                          id="new-password" 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          placeholder="Enter new password" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input 
                          id="confirm-password" 
                          type="password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          placeholder="Confirm new password" 
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Password Requirements</h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                        <li>• At least 8 characters long</li>
                        <li>• Include uppercase and lowercase letters</li>
                        <li>• Include at least one number</li>
                        <li>• Include at least one special character</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                          <Label className="text-base">Enable 2FA</Label>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <Button variant="outline">Setup 2FA</Button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" className="bg-blue-500 hover:bg-blue-600 gap-2">
                        <Save className="w-4 h-4" />
                        Update Password
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Appearance & Theme
                  </CardTitle>
                  <CardDescription>Customize the look and feel of your application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Theme</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                          theme === 'light' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400' 
                            : 'border-border hover:border-muted-foreground'
                        }`}
                        onClick={() => setTheme('light')}
                      >
                        <div className="bg-white dark:bg-card rounded border shadow-sm p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="space-y-1">
                            <div className="h-2 bg-gray-200 dark:bg-muted rounded w-3/4"></div>
                            <div className="h-2 bg-gray-200 dark:bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-foreground" />
                          <span className="font-medium text-foreground">Light</span>
                        </div>
                      </div>

                      <div 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                          theme === 'dark' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400' 
                            : 'border-border hover:border-muted-foreground'
                        }`}
                        onClick={() => setTheme('dark')}
                      >
                        <div className="bg-gray-800 dark:bg-card rounded border shadow-sm p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="space-y-1">
                            <div className="h-2 bg-gray-600 dark:bg-muted rounded w-3/4"></div>
                            <div className="h-2 bg-gray-600 dark:bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4 text-foreground" />
                          <span className="font-medium text-foreground">Dark</span>
                        </div>
                      </div>

                      <div className="border-2 border-border rounded-lg p-4 cursor-pointer opacity-50 hover:opacity-75 transition-opacity">
                        <div className="bg-gradient-to-br from-white to-gray-100 dark:from-card dark:to-muted rounded border shadow-sm p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="space-y-1">
                            <div className="h-2 bg-gray-300 dark:bg-muted rounded w-3/4"></div>
                            <div className="h-2 bg-gray-300 dark:bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-muted-foreground">Auto</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Display Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base text-foreground">Compact Mode</Label>
                          <p className="text-sm text-muted-foreground">Reduce spacing and padding for more content</p>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base text-foreground">High Contrast</Label>
                          <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                        </div>
                        <Switch />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-foreground">Font Size</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                      <Save className="w-4 h-4" />
                      Save Appearance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Settings */}
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    System Preferences
                  </CardTitle>
                  <CardDescription>Configure system-wide settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="rw">Kinyarwanda</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="sw">Swahili</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Kigali">Africa/Kigali (CAT)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                          <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Data Retention (days)</Label>
                      <Select value={dataRetention} onValueChange={setDataRetention}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="365">1 year</SelectItem>
                          <SelectItem value="1095">3 years</SelectItem>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Date Format</Label>
                      <Select defaultValue="dd/mm/yyyy">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Automation</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Auto Backup</Label>
                          <p className="text-sm text-gray-500">Automatically backup data daily</p>
                        </div>
                        <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Data Compression</Label>
                          <p className="text-sm text-gray-500">Compress stored data to save space</p>
                        </div>
                        <Switch checked={dataCompression} onCheckedChange={setDataCompression} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSystemSave} className="bg-blue-500 hover:bg-blue-600 gap-2">
                      <Save className="w-4 h-4" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Management */}
            <TabsContent value="data" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Export Data
                    </CardTitle>
                    <CardDescription>Download your data for backup or analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Export Format</Label>
                      <Select defaultValue="csv">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="xlsx">Excel</SelectItem>
                          <SelectItem value="pdf">PDF Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Date Range</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">Last 7 days</SelectItem>
                          <SelectItem value="30d">Last 30 days</SelectItem>
                          <SelectItem value="90d">Last 90 days</SelectItem>
                          <SelectItem value="1y">Last year</SelectItem>
                          <SelectItem value="all">All data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button onClick={handleDataExport} className="w-full bg-blue-500 hover:bg-blue-600 gap-2">
                      <Download className="w-4 h-4" />
                      Export Data
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Import Data
                    </CardTitle>
                    <CardDescription>Import data from external sources</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>File Format</Label>
                      <Select defaultValue="csv">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="xlsx">Excel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Drop files here or click to browse</p>
                      <input type="file" className="hidden" />
                    </div>
                    
                    <Button onClick={handleDataImport} className="w-full bg-green-500 hover:bg-green-600 gap-2">
                      <Upload className="w-4 h-4" />
                      Import Data
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Trash2 className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>Irreversible actions for your account and data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Reset All Settings</h4>
                      <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                        This will reset all your settings to default values. Your data will remain intact.
                      </p>
                      <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                        Reset Settings
                      </Button>
                    </div>

                    <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Delete All Data</h4>
                      <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                        This will permanently delete all water monitoring data. This action cannot be undone.
                      </p>
                      <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                        Delete All Data
                      </Button>
                    </div>
                    
                    <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Delete Account</h4>
                      <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    History
                  </CardTitle>
                  <CardDescription>View historical readings, leakage, and control data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-6">
                    {/* Top Tabs for Leakage, Readings, Control */}
                    <div className="flex justify-center mb-4">
                      <div className="bg-gray-100 rounded-full flex p-1">
                        <button onClick={() => setHistoryTab('leakage')} className={`px-6 py-2 rounded-full text-sm font-medium transition ${historyTab === 'leakage' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}>Leakage</button>
                        <button onClick={() => setHistoryTab('readings')} className={`px-6 py-2 rounded-full text-sm font-medium transition ${historyTab === 'readings' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}>Readings</button>
                        <button onClick={() => setHistoryTab('control')} className={`px-6 py-2 rounded-full text-sm font-medium transition ${historyTab === 'control' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}>Control</button>
                      </div>
                    </div>
                    {/* Province Selector and Date Range Dropdown (optional for leakage) */}
                    {historyTab === 'leakage' && (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <img src={provinceData[selectedProvince].icon} alt={provinceData[selectedProvince].name} className="w-8 h-8" />
                          <span className="font-bold text-lg" style={{ color: '#FFD600' }}>{provinceData[selectedProvince].name}</span>
                          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                            <SelectTrigger className="w-32 ml-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="north">North</SelectItem>
                              <SelectItem value="south">South</SelectItem>
                              <SelectItem value="east">East</SelectItem>
                              <SelectItem value="west">West</SelectItem>
                              <SelectItem value="kigali">Kigali</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {dateRanges.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Leakage Report Card */}
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-semibold text-lg">Leakage Report</span>
                          <div className="flex gap-2">
                            <Button className="bg-blue-500 hover:bg-blue-600 text-white flex gap-2" onClick={handleDownloadLeakagePDF}><Download className="w-4 h-4" />PDF</Button>
                            <Button className="bg-gray-200 hover:bg-gray-300 text-gray-800 flex gap-2" onClick={downloadLeakageCSV}><Download className="w-4 h-4" />CSV</Button>
                          </div>
                        </div>
                        {leakageHistory.map((l, idx) => (
                          <div key={l.id} ref={idx === 0 ? leakageContainerRef : undefined} className="w-full max-w-5xl mx-auto mb-10">
                            {/* Digital date header */}
                            <div className="flex justify-center mb-2">
                              <span className="font-major-mono-display text-2xl tracking-widest text-black">{l.day}-{l.date.split('-').reverse().join('/')}</span>
                            </div>
                            <div className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row gap-6 items-stretch">
                              {/* Left: Leakage Detection */}
                              <div className="flex-1 min-w-[260px] flex flex-col justify-between">
                                <div>
                                  <div className="font-semibold text-lg mb-2">Leakage Detection</div>
                                  <div className="mb-2">
                                    <div className="text-gray-700 text-sm">{l.date.split('-').reverse().join('/')}<span className="ml-2">{l.time}</span></div>
                                  </div>
                                  <div className="flex items-end mb-2">
                                    <span className="text-3xl font-bold text-black">{l.waterLoss}</span>
                                    <span className="ml-1 text-base font-medium text-gray-700">cm³</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mb-2">water lost</div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-gray-700 text-sm">{l.location}</span>
                                  </div>
                                  <div className="flex flex-col gap-1 mb-2">
                                    <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Severity:</span> <span className="text-red-600 font-bold">{l.severity}</span></div>
                                    <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Action:</span> <span className="text-gray-700 font-bold">{l.action}</span></div>
                                    <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Status:</span> <span className="text-blue-600 font-bold">{l.status}</span></div>
                                  </div>
                                </div>
                                {/* Radio buttons */}
                                <div className="flex items-center gap-6 mt-4">
                                  <label className="flex items-center gap-1 text-sm font-medium">
                                    <input type="radio" checked={l.status === 'Resolved'} readOnly className="accent-blue-600" /> Resolved
                                  </label>
                                  <label className="flex items-center gap-1 text-sm font-medium">
                                    <input type="radio" checked={l.status === 'Investigating'} readOnly className="accent-blue-600" /> Investigating
                                  </label>
                                </div>
                              </div>
                              {/* Right: Resolved leakage card */}
                              <div className="flex-1 min-w-[260px] bg-[#338CF5] rounded-xl p-6 pb-14 text-white relative flex flex-col gap-3 justify-between max-w-md mx-auto" style={{minHeight: 240}}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-base">Resolved leakage</span>
                                  <button className="text-white/80 hover:text-white text-xs underline">Edit</button>
                                </div>
                                <div className="flex flex-row gap-8 mb-4">
                                  <div>
                                    <div className="text-xs text-white font-semibold">Date</div>
                                    <div className="text-base text-white/80">{l.resolved.date.split('-').reverse().join('/')}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-white font-semibold">Plumber</div>
                                    <div className="text-base text-white/80">{l.resolved.plumber}</div>
                                  </div>
                                </div>
                                <div className="mb-6">
                                  <div className="text-xs text-white font-semibold mb-1">Resolved note</div>
                                  <div className="text-sm leading-snug text-white/80">{l.resolved.note}</div>
                                </div>
                                {l.resolved.success && (
                                  <div className="absolute bottom-3 right-4 flex items-center gap-2 opacity-25 select-none pointer-events-none">
                                    <img src={SuccessImage} alt="Success" className="h-8 w-auto" />
                                    <span className="text-white text-4xl font-extrabold tracking-wide">Success</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {/* Readings Report Card */}
                    {historyTab === 'readings' && (
                      <>
                        {/* Province selector outside the report card, like in the model screenshots */}
                        <div className="flex items-center gap-2 mb-3">
                          <img src={provinceData[selectedProvince].icon} alt={provinceData[selectedProvince].name} className="w-8 h-8" />
                          <span className="font-bold text-lg" style={{ color: provinceData[selectedProvince].textColor }}>{provinceData[selectedProvince].name}</span>
                          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                            <SelectTrigger className="w-32 ml-2 h-9 rounded-md border-gray-300 text-sm font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="north">North</SelectItem>
                              <SelectItem value="south">South</SelectItem>
                              <SelectItem value="east">East</SelectItem>
                              <SelectItem value="west">West</SelectItem>
                              <SelectItem value="kigali">Kigali</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div ref={readingsContainerRef} className="bg-white rounded-xl shadow p-6 w-full max-w-6xl mx-auto">
                        {/* Header Row: time range on the left, centered title, download button on right */}
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          {/* Time range top-left styled as in models */}
                          <div className="mr-auto flex items-center gap-2">
                            <Select value={dateRange} onValueChange={setDateRange}>
                              <SelectTrigger className="w-40 h-8 rounded-md border-gray-300 text-sm font-semibold">
                                <SelectValue placeholder="Range" />
                              </SelectTrigger>
                              <SelectContent>
                                {dateRanges.map(r => (
                                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1 flex justify-center">
                            <span className="font-semibold text-lg">Readings Report</span>
                          </div>
                          <div className="ml-auto flex items-center gap-3">
                            <Button onClick={() => handleDownloadReadingsPDF()} className="bg-blue-500 hover:bg-blue-600 text-white flex gap-2"><Download className="w-4 h-4" />Download</Button>
                          </div>
                        </div>

                        {/* (Province badge row is rendered above the card) */}

                        {/* Sections driven by range (time/day/month) */}
                        {getReadingSections(dateRange).map((headerKey, idx) => (
                          <div key={`${dateRange}-${idx}`} className={idx > 0 ? 'mt-8' : ''}>
                            <div className="flex justify-center mb-6">
                              <span className="font-major-mono-display text-2xl tracking-widest text-black">{headerKey}</span>
                            </div>
                            <div className={`grid ${provinceData[selectedProvince].districts.length <= 3 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'} gap-y-8 gap-x-12 justify-items-center`}>
                              {provinceData[selectedProvince].districts.map(d => (
                                <div key={`${headerKey}-${d.id}`} className={`${provinceData[selectedProvince].color} rounded-xl p-4 flex flex-col items-start shadow-md min-w-[180px]`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="w-7 h-7 rounded-full bg-yellow-400 text-white flex items-center justify-center font-bold">{d.id}</span>
                                    <span className="font-semibold text-lg">{d.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-500/70 inline-block"></span>
                                    <span className="text-[13px] font-medium text-gray-700">Waterflow</span>
                                    <span className="text-[13px] font-semibold tracking-tight ml-2 font-major-mono-display text-gray-900/90">{d.value} cm³/h</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[11px] text-gray-500">Status</span>
                                    {d.status === 'normal' && (
                                      <span className="ml-2 px-2 py-0.5 text-[11px] bg-green-100 text-green-700 rounded-full font-semibold">normal</span>
                                    )}
                                    {d.status === 'underflow' && (
                                      <span className="ml-2 px-2 py-0.5 text-[11px] bg-yellow-200 text-yellow-800 rounded-full font-semibold">underflow</span>
                                    )}
                                    {d.status === 'overflow' && (
                                      <span className="ml-2 px-2 py-0.5 text-[11px] bg-red-100 text-red-700 rounded-full font-semibold">overflow</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      </>
                    )}
                    {/* Control Section - Control Report */}
                    {historyTab === 'control' && (
                      <div className="bg-white rounded-xl shadow p-6 w-full max-w-6xl mx-auto">
                        {/* Province header and range */}
                        <div className="flex items-center gap-2 mb-4">
                          <img src={provinceData[selectedProvince].icon} alt={provinceData[selectedProvince].name} className="w-8 h-8" />
                          <span className="font-bold text-lg" style={{ color: provinceData[selectedProvince].textColor }}>{provinceData[selectedProvince].name}</span>
                          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                            <SelectTrigger className="w-32 ml-2 h-9 rounded-md border-gray-300 text-sm font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="north">North</SelectItem>
                              <SelectItem value="south">South</SelectItem>
                              <SelectItem value="east">East</SelectItem>
                              <SelectItem value="west">West</SelectItem>
                              <SelectItem value="kigali">Kigali</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="ml-auto">
                            <Select value={dateRange} onValueChange={setDateRange}>
                              <SelectTrigger className="w-40 h-8 rounded-md border-gray-300 text-sm font-semibold">
                                <SelectValue placeholder="Range" />
                              </SelectTrigger>
                              <SelectContent>
                                {dateRanges.map(r => (
                                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Title + Download */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold text-lg">Control Report</span>
                          <div className="flex gap-2">
                            <Button onClick={handleDownloadControlPDF} className="bg-blue-500 hover:bg-blue-600 text-white flex gap-2"><Download className="w-4 h-4" />PDF</Button>
                            <Button onClick={downloadControlCSV} className="bg-gray-200 hover:bg-gray-300 text-gray-800 flex gap-2"><Download className="w-4 h-4" />CSV</Button>
                          </div>
                        </div>

                        {/* Table */}
                        <div ref={controlContainerRef} className="overflow-x-auto">
                          <table className="w-full text-sm table-fixed">
                            <colgroup>
                              <col style={{ width: '6%' }} />
                              <col style={{ width: '22%' }} />
                              <col style={{ width: '32%' }} />
                              <col style={{ width: '18%' }} />
                              <col style={{ width: '14%' }} />
                              <col style={{ width: '8%' }} />
                            </colgroup>
                            <thead>
                              <tr className="text-left text-gray-500 border-b">
                                <th className="py-3 px-4 w-12">№</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Location</th>
                                <th className="py-3 px-4">Commands</th>
                                <th className="py-3 px-4">Situation</th>
                                <th className="py-3 px-4 text-right"> </th>
                              </tr>
                            </thead>
                            <tbody>
                              {getControlRows(selectedProvince, dateRange).map((row, idx) => (
                                <tr key={row.id} className="border-b last:border-0">
                                  <td className="py-3 px-4 text-gray-700">{idx + 1}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col leading-tight whitespace-nowrap">
                                      <span className="font-semibold text-gray-800">{row.dateLabel}</span>
                                      <span className="text-[10px] text-gray-400">{row.time}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2 text-gray-800 whitespace-nowrap">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                      {row.location}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    {row.command === 'ON' ? (
                                      <span className="text-green-600 font-semibold">ON</span>
                                    ) : (
                                      <span className="text-blue-600 font-semibold">OFF</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {row.situation === 'normal' ? (
                                      <span className="text-xs font-semibold" style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 9999, backgroundColor: '#D1FAE5', color: '#047857' }}>normal</span>
                                    ) : (
                                      <span className="text-xs font-semibold" style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 9999, backgroundColor: '#DBEAFE', color: '#2563EB' }}>leakage</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button onClick={() => setShowControlDetail(row)} className="text-blue-600 hover:underline text-xs font-medium whitespace-nowrap">view more</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Control Detail Modal/Overlay */}
                        {showControlDetail && (
                          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 relative" ref={controlDetailRef}>
                              <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-800" onClick={() => setShowControlDetail(null)}>✕</button>
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Control Report • {showControlDetail.location}</h3>
                                <div className="flex gap-2">
                                  <Button onClick={handleDownloadControlDetailPDF} className="bg-blue-500 hover:bg-blue-600 text-white flex gap-2"><Download className="w-4 h-4" />PDF</Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500">Province</div>
                                  <div className="text-sm font-medium text-gray-800">{provinceData[selectedProvince].name}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500">Date</div>
                                  <div className="text-sm font-medium text-gray-800">{showControlDetail.dateLabel} • {showControlDetail.time}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500">Command</div>
                                  <div className="text-sm font-semibold {showControlDetail.command === 'ON' ? 'text-green-600' : 'text-blue-600'}">{showControlDetail.command}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500">Situation</div>
                                  <div className="text-sm">
                                    {showControlDetail.situation === 'normal' ? (
                                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">normal</span>
                                    ) : (
                                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">leakage</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="border rounded-lg p-4">
                                <div className="text-sm text-gray-700">Detailed control actions, operator notes, device IDs and timestamps can be displayed here. This section mirrors the design style of the website for full fidelity.</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
