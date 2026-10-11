import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Heart, Users, Flag, UserCheck, ShieldAlert, 
  HelpCircle, Calendar, FileText, Image, MessageSquare, CreditCard, 
  Receipt as ReceiptIcon, BarChart3, Bell, Folder, ShieldCheck, 
  History, Settings as SettingsIcon, LogOut, Search, Filter, Download,
  Check, X, Eye, ShieldAlert as WarningIcon, UserMinus, Plus, Edit, Trash2,
  UploadCloud, FolderOpen, ExternalLink, Copy, Maximize2, FileImage, CheckCircle2,
  Cake, Sparkles, AlertTriangle, RotateCcw, Send, MessageCircle, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { 
  getDonations, getDonors, getCampaigns, getVolunteers, 
  getBeneficiaries, getContactMessages, getAuditLogs, getNotifications, 
  getSettings, getUsers, updateCampaign, updateVolunteerStatus, 
  updateBeneficiaryStatus, resolveContactMessage, createCampaign, deleteCampaign,
  createSubAdmin, updateSubAdmin, deleteSubAdmin, toggleAdminStatus, updateSettings, markNotificationsRead,
  getGalleryItems, createGalleryItem, deleteGalleryItem, sanitizeDriveFolderId,
  getCelebrationBookings, updateCelebrationBooking, deleteCelebrationBooking,
  getDynamicPackages, saveDynamicPackage, deleteDynamicPackage,
  getDynamicAddons, saveDynamicAddon, deleteDynamicAddon,
  getEvents, createEvent, updateEvent, deleteEvent,
  getNews, createNews, updateNews, deleteNews,
  Donation, Donor, Campaign, Volunteer, Beneficiary, ContactMessage, 
  AuditLog, SystemNotification, Settings, User as UserType, GalleryItem,
  CelebrationBooking, DynamicPackage, DynamicAddon, Event, NewsArticle
} from '../db';
import { ReceiptPDF } from '../components/ReceiptPDF';

interface CRMPortalProps {
  onLogout: () => void;
}

type TabType = 
  | 'Dashboard' | 'Donations' | 'Celebrations' | 'Donors' | 'Campaigns' | 'Volunteers' 
  | 'Beneficiaries' | 'Assistance' | 'Events' | 'News' | 'Gallery' | 'Packages'
  | 'Messages' | 'Payments' | 'Receipts' | 'Notifications' 
  | 'Admins' | 'Audit Logs' | 'Settings';

export const CRMPortal: React.FC<CRMPortalProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('Dashboard');
  const [adminUser, setAdminUser] = useState<any>(null);

  // Database Data States
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [adminList, setAdminList] = useState<UserType[]>([]);

  // Search & Filter States
  const [globalSearch, setGlobalSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Yesterday' | 'This Week' | 'This Month'>('All');
  const [amountFilter, setAmountFilter] = useState<'All' | '0-1000' | '1000-5000' | '5000-10000' | '10000+'>('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [segmentFilter, setSegmentFilter] = useState('All');

  // Detail Modal view States
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [selectedCase, setSelectedCase] = useState<Beneficiary | null>(null);
  const [selectedVol, setSelectedVol] = useState<Volunteer | null>(null);
  const [selectedReceiptDon, setSelectedReceiptDon] = useState<Donation | null>(null);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);

  // Events & News CRUD States
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventTime, setNewEventTime] = useState('9:00 AM – 2:00 PM');
  const [newEventLocation, setNewEventLocation] = useState('Chennai');
  const [newEventVolReq, setNewEventVolReq] = useState(15);
  const [newEventCover, setNewEventCover] = useState('https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=400');

  const [showAddNews, setShowAddNews] = useState(false);
  const [newNewsTitle, setNewNewsTitle] = useState('');
  const [newNewsDesc, setNewNewsDesc] = useState('');
  const [newNewsCategory, setNewNewsCategory] = useState<'Education Support' | 'Healthcare Support' | 'Women Empowerment' | 'General' | 'Community Welfare' | 'Elder Care'>('Education Support');
  const [newNewsDate, setNewNewsDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNewsAuthor, setNewNewsAuthor] = useState('Trust Secretariat');
  const [newNewsImage, setNewNewsImage] = useState('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400');

  // Campaign CRUD Modal States
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampDesc, setNewCampDesc] = useState('');
  const [newCampTarget, setNewCampTarget] = useState(500000);
  const [newCampLocation, setNewCampLocation] = useState('Chennai');
  const [newCampBeneficiary, setNewCampBeneficiary] = useState('');
  const [newCampStartDate, setNewCampStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCampEndDate, setNewCampEndDate] = useState(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [newCampCover, setNewCampCover] = useState('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600');

  const [editCampTitle, setEditCampTitle] = useState('');
  const [editCampDesc, setEditCampDesc] = useState('');
  const [editCampTarget, setEditCampTarget] = useState(500000);
  const [editCampLocation, setEditCampLocation] = useState('');
  const [editCampBeneficiary, setEditCampBeneficiary] = useState('');
  const [editCampStartDate, setEditCampStartDate] = useState('');
  const [editCampEndDate, setEditCampEndDate] = useState('');
  const [editCampCover, setEditCampCover] = useState('');
  const [editCampStatus, setEditCampStatus] = useState<'active' | 'completed' | 'paused' | 'draft'>('active');

  // Public Inquiries Modal State
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Sub-Admin CRUD Modal States
  const [selectedAdmin, setSelectedAdmin] = useState<UserType | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<UserType | null>(null);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPerms, setNewAdminPerms] = useState<string[]>(['donations', 'donors']);

  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminPhone, setEditAdminPhone] = useState('');
  const [editAdminRole, setEditAdminRole] = useState<'sub_admin' | 'super_admin'>('sub_admin');
  const [editAdminPerms, setEditAdminPerms] = useState<string[]>([]);
  const [editAdminStatus, setEditAdminStatus] = useState<'active' | 'suspended'>('active');

  // Media Gallery & Google Drive States
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<Array<{
    id: string;
    file: File;
    previewUrl: string;
    title: string;
    category: string;
    size: number;
  }>>([]);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCurrentFile, setUploadCurrentFile] = useState('');
  const [showDriveConfigModal, setShowDriveConfigModal] = useState(false);
  const [showDriveHelpModal, setShowDriveHelpModal] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState('1mANBFXk-moSZ8ll9elajfF9eOmkDTDnX');
  const [driveFolderName, setDriveFolderName] = useState('Deivakaram_Public_Media_Vault');
  const [driveWebhookUrl, setDriveWebhookUrl] = useState(
    'https://script.google.com/macros/s/AKfycbwojrkpTkatYsEWI9Augz_uuCQ2_zWduUypBwljMlzO_2ShlW0XMgv8htEkB1GjPKit/exec'
  );
  const [selectedGalleryMedia, setSelectedGalleryMedia] = useState<GalleryItem | null>(null);
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState('All');
  const [gallerySearch, setGallerySearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Celebration Bookings & Packages States
  const [celebrationBookings, setCelebrationBookings] = useState<CelebrationBooking[]>([]);
  const [selectedCelebration, setSelectedCelebration] = useState<CelebrationBooking | null>(null);
  const [viewingBannerImage, setViewingBannerImage] = useState<string | null>(null);
  const [celebrationStatusFilter, setCelebrationStatusFilter] = useState<string>('All');
  const [celebrationOccasionFilter, setCelebrationOccasionFilter] = useState<string>('All');
  const [celebrationSearch, setCelebrationSearch] = useState('');

  // Packages & Addons Management States
  const [dynamicPackagesList, setDynamicPackagesList] = useState<DynamicPackage[]>([]);
  const [dynamicAddonsList, setDynamicAddonsList] = useState<DynamicAddon[]>([]);
  const [editingPackage, setEditingPackage] = useState<DynamicPackage | null>(null);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState<DynamicAddon | null>(null);
  const [showAddAddonModal, setShowAddAddonModal] = useState(false);

  // Form states for Packages
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgBasePrice, setPkgBasePrice] = useState(3000);
  const [pkgMinMeals, setPkgMinMeals] = useState(25);
  const [pkgInclusionsText, setPkgInclusionsText] = useState('Special Meals for 25 Elders\nCustomized Name Banner\nCelebration Video & Photos');
  const [pkgIsPopular, setPkgIsPopular] = useState(false);
  const [pkgIsActive, setPkgIsActive] = useState(true);

  // Form states for Addons
  const [addonName, setAddonName] = useState('');
  const [addonPrice, setAddonPrice] = useState(500);
  const [addonUnit, setAddonUnit] = useState('per pack');
  const [addonDesc, setAddonDesc] = useState('');
  const [addonIsActive, setAddonIsActive] = useState(true);

  useEffect(() => {
    // Check permission role
    const active = localStorage.getItem('deivakaram_active_user');
    if (active) {
      setAdminUser(JSON.parse(active));
    }
    reloadData();
  }, [activeTab]);

  const reloadData = () => {
    getDonations().then(setDonations);
    getDonors().then(setDonors);
    getCampaigns().then(setCampaigns);
    getVolunteers().then(setVolunteers);
    getBeneficiaries().then(setBeneficiaries);
    getContactMessages().then(setMessages);
    getAuditLogs().then(setLogs);
    getNotifications().then(setNotifications);
    getGalleryItems().then(setGalleryItems);
    getCelebrationBookings().then(setCelebrationBookings);
    getDynamicPackages().then(setDynamicPackagesList);
    getDynamicAddons().then(setDynamicAddonsList);
    getEvents().then(setEvents);
    getNews().then(setNews);
    getSettings().then(st => {
      setSettings(st);
      if (st) {
        if (st.googleDriveFolderId) setDriveFolderId(sanitizeDriveFolderId(st.googleDriveFolderId));
        if (st.googleDriveWebhookUrl) {
          setDriveWebhookUrl(st.googleDriveWebhookUrl);
        } else {
          setDriveWebhookUrl('https://script.google.com/macros/s/AKfycbwojrkpTkatYsEWI9Augz_uuCQ2_zWduUypBwljMlzO_2ShlW0XMgv8htEkB1GjPKit/exec');
        }
      }
    });
    getUsers().then(users => setAdminList(users.filter(u => u.role !== 'donor')));
  };

  // Check Sub Admin Permissions
  const hasPermission = (permission: string) => {
    if (!adminUser) return false;
    if (adminUser.role === 'super_admin') return true;
    
    // Check dynamic permissions loaded from Supabase admin_users table
    if (Array.isArray(adminUser.permissions) && adminUser.permissions.length > 0) {
      return adminUser.permissions.includes(permission);
    }
    
    // Ramanathan & Meera permissions matching SEED
    const perms: Record<string, string[]> = {
      'usr-2': ['donations', 'donors', 'volunteers', 'events'],
      'usr-3': ['beneficiaries', 'reports', 'content']
    };
    const userPerms = perms[adminUser.id] || [];
    return userPerms.includes(permission);
  };

  // ----------------------------------------------------
  // GLOBAL SEARCH ROUTER
  // ----------------------------------------------------
  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch) return;
    
    const searchVal = globalSearch.trim().toUpperCase();

    // 1. Search donation
    const foundDon = donations.find(d => d.donation_id.toUpperCase() === searchVal || d.transaction_id.toUpperCase() === searchVal);
    if (foundDon) {
      setSelectedReceiptDon(foundDon);
      setGlobalSearch('');
      return;
    }

    // 2. Search Case
    const foundCase = beneficiaries.find(b => b.case_id.toUpperCase() === searchVal);
    if (foundCase) {
      setSelectedCase(foundCase);
      setGlobalSearch('');
      return;
    }

    // 3. Search Volunteer
    const foundVol = volunteers.find(v => v.volunteer_id.toUpperCase() === searchVal);
    if (foundVol) {
      setSelectedVol(foundVol);
      setGlobalSearch('');
      return;
    }

    // 4. Search Donor Profile
    const foundDonor = donors.find(d => d.name.toUpperCase().includes(searchVal));
    if (foundDonor) {
      setSelectedDonor(foundDonor);
      setGlobalSearch('');
      return;
    }

    alert('No matching records found for that reference key.');
  };

  // ----------------------------------------------------
  // FILTER UTILITIES
  // ----------------------------------------------------
  const filterByDate = (itemDate: string) => {
    if (dateFilter === 'All') return true;
    const date = new Date(itemDate);
    const today = new Date();
    
    if (dateFilter === 'Today') {
      return date.toDateString() === today.toDateString();
    }
    if (dateFilter === 'Yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      return date.toDateString() === yesterday.toDateString();
    }
    if (dateFilter === 'This Week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      return date >= oneWeekAgo;
    }
    if (dateFilter === 'This Month') {
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }
    return true;
  };

  const filterByAmount = (amt: number) => {
    if (amountFilter === 'All') return true;
    if (amountFilter === '0-1000') return amt >= 0 && amt <= 1000;
    if (amountFilter === '1000-5000') return amt > 1000 && amt <= 5000;
    if (amountFilter === '5000-10000') return amt > 5000 && amt <= 10000;
    if (amountFilter === '10000+') return amt > 10000;
    return true;
  };

  // ----------------------------------------------------
  // EXPORT SIMULATION
  // ----------------------------------------------------
  const triggerExport = (moduleName: string, data: any[]) => {
    if (!hasPermission('reports')) {
      alert('Access Denied: Sub-admins do not have export reports authorization.');
      return;
    }
    
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(v => typeof v === 'object' ? JSON.stringify(v) : `"${v}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DVK_${moduleName}_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----------------------------------------------------
  // STATE MUTATORS
  // ----------------------------------------------------
  const handleCaseStatusChange = async (id: string, status: Beneficiary['status']) => {
    await updateBeneficiaryStatus(id, status);
    // Log audit action
    const item = beneficiaries.find(b => b.id === id);
    if (item) {
      reloadData();
      setSelectedCase(null);
      alert(`Case ${item.case_id} status updated to ${status}.`);
    }
  };

  const handleVolunteerStatusChange = async (id: string, status: Volunteer['status']) => {
    await updateVolunteerStatus(id, status);
    const item = volunteers.find(v => v.id === id);
    if (item) {
      reloadData();
      setSelectedVol(null);
      alert(`Volunteer ${item.volunteer_id} status updated to ${status}.`);
    }
  };

  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampTitle || !newCampDesc) return;

    await createCampaign({
      title: newCampTitle,
      description: newCampDesc,
      cover_image: newCampCover || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600',
      target_amount: newCampTarget,
      start_date: newCampStartDate,
      end_date: newCampEndDate,
      beneficiary_info: newCampBeneficiary,
      location: newCampLocation,
      status: 'active',
      gallery: [],
      updates: []
    });

    setNewCampTitle('');
    setNewCampDesc('');
    setNewCampBeneficiary('');
    setShowAddCampaign(false);
    reloadData();
    alert('New Campaign created successfully.');
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;
    try {
      await createEvent({
        title: newEventTitle,
        description: newEventDesc,
        location: newEventLocation,
        event_date: newEventDate,
        time_str: newEventTime,
        cover_image: newEventCover,
        volunteer_required: newEventVolReq,
        status: 'upcoming',
        registrations: []
      });
      setShowAddEvent(false);
      setNewEventTitle('');
      setNewEventDesc('');
      reloadData();
      alert('Event scheduled successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to schedule event.');
    }
  };

  const handleUpdateEventStatus = async (id: string, status: Event['status']) => {
    try {
      await updateEvent(id, { status });
      reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id);
      reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNewsTitle) return;
    try {
      await createNews({
        title: newNewsTitle,
        description: newNewsDesc,
        category: newNewsCategory,
        date: newNewsDate,
        author: newNewsAuthor,
        image: newNewsImage,
        status: 'published'
      });
      setShowAddNews(false);
      setNewNewsTitle('');
      setNewNewsDesc('');
      reloadData();
      alert('News bulletin published successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to publish news.');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news bulletin?')) return;
    try {
      await deleteNews(id);
      reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditCampaign = (camp: Campaign) => {
    setEditingCampaign(camp);
    setEditCampTitle(camp.title);
    setEditCampDesc(camp.description);
    setEditCampTarget(camp.target_amount);
    setEditCampLocation(camp.location || '');
    setEditCampBeneficiary(camp.beneficiary_info || '');
    setEditCampStartDate(camp.start_date || '');
    setEditCampEndDate(camp.end_date || '');
    setEditCampCover(camp.cover_image || '');
    setEditCampStatus(camp.status);
  };

  const handleUpdateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    await updateCampaign(editingCampaign.id, {
      title: editCampTitle,
      description: editCampDesc,
      target_amount: editCampTarget,
      location: editCampLocation,
      beneficiary_info: editCampBeneficiary,
      start_date: editCampStartDate,
      end_date: editCampEndDate,
      cover_image: editCampCover,
      status: editCampStatus
    });

    setEditingCampaign(null);
    reloadData();
    alert('Campaign updated successfully.');
  };

  const handleDeleteCampaign = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete campaign: "${title}"? This action cannot be undone.`)) {
      await deleteCampaign(id);
      reloadData();
      alert(`Campaign "${title}" deleted.`);
    }
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail) return;

    await createSubAdmin(newAdminName, newAdminEmail, newAdminPhone, newAdminPerms);
    setNewAdminName('');
    setNewAdminEmail('');
    setNewAdminPhone('');
    setShowAddAdmin(false);
    reloadData();
    alert(`Sub-admin account created for ${newAdminEmail}.`);
  };

  const handleOpenEditAdmin = (adm: UserType) => {
    setEditingAdmin(adm);
    setEditAdminName(adm.name);
    setEditAdminEmail(adm.email);
    setEditAdminPhone(adm.phone || '');
    setEditAdminRole(adm.role as any);
    setEditAdminStatus(adm.status);

    const adminUsers = (window as any).__adminUsers || {};
    // Load existing permissions
    getSettings();
    const storedPerms = (adminUser && adminUser.id === adm.id) ? adminUser.permissions : ['donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns'];
    setEditAdminPerms(storedPerms);
  };

  const handleUpdateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    await updateSubAdmin(editingAdmin.id, {
      name: editAdminName,
      email: editAdminEmail,
      phone: editAdminPhone,
      role: editAdminRole,
      permissions: editAdminPerms,
      status: editAdminStatus
    });

    setEditingAdmin(null);
    reloadData();
    alert('Sub-admin updated successfully.');
  };

  const handleDeleteAdmin = async (uId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete sub-admin account "${name}"?`)) {
      await deleteSubAdmin(uId);
      reloadData();
      alert(`Sub-admin "${name}" deleted.`);
    }
  };

  // ----------------------------------------------------
  // MEDIA GALLERY & GOOGLE DRIVE HANDLERS
  // ----------------------------------------------------
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      stageIncomingFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      stageIncomingFiles(Array.from(e.target.files));
    }
  };

  const stageIncomingFiles = (files: File[]) => {
    const validFiles = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (validFiles.length === 0) {
      alert('Please upload image (JPG, PNG, WebP, GIF) or video files.');
      return;
    }

    const newStaged = validFiles.map(file => {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const title = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      return {
        id: `staged-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        title,
        category: 'General',
        size: file.size
      };
    });

    setStagedFiles(prev => [...prev, ...newStaged]);
  };

  const handleRemoveStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpdateStagedFile = (id: string, field: 'title' | 'category', value: string) => {
    setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const compressImageForUpload = (file: File, maxWidth = 1280, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      // If it's a video, read directly
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressed = canvas.toDataURL(outputMime, outputMime === 'image/jpeg' ? quality : undefined);
        resolve(compressed);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      };

      img.src = objectUrl;
    });
  };

  const handleUploadStagedFiles = async () => {
    if (stagedFiles.length === 0) return;

    setIsUploadingToDrive(true);
    setUploadProgress(5);

    const total = stagedFiles.length;
    let completed = 0;
    const errors: string[] = [];
    const cleanFolderId = sanitizeDriveFolderId(driveFolderId);

    for (let i = 0; i < stagedFiles.length; i++) {
      const staged = stagedFiles[i];
      setUploadCurrentFile(staged.file.name);
      try {
        // High-efficiency in-browser compression (converts multi-MB photos to ~80KB web-ready images)
        const dataUrl = await compressImageForUpload(staged.file, 1280, 0.82);
        if (!dataUrl) {
          throw new Error('Could not process media file data');
        }

        const driveFileId = `1${Math.random().toString(36).substr(2, 9)}${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
        
        // If Google Apps Script Webhook is configured, dispatch payload directly to Google Drive folder
        if (driveWebhookUrl && driveWebhookUrl.startsWith('http')) {
          try {
            const base64Content = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            await fetch(driveWebhookUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                fileName: staged.file.name,
                mimeType: staged.file.type || 'image/jpeg',
                base64Data: base64Content,
                folderId: cleanFolderId
              })
            });
          } catch (err) {
            console.warn('Google Drive Webhook push notification notice:', err);
          }
        }

        await createGalleryItem({
          title: staged.title || staged.file.name,
          category: (staged.category as any) || 'General',
          media_type: staged.file.type.startsWith('video/') ? 'video' : 'image',
          url: dataUrl,
          thumbnail_url: dataUrl,
          google_drive_file_id: driveFileId,
          google_drive_folder_id: cleanFolderId,
          file_name: staged.file.name,
          file_size: staged.size
        });

        completed++;
        setUploadProgress(Math.round(((i + 1) / total) * 100));
      } catch (err: any) {
        console.error('Failed to process file:', staged.file.name, err);
        errors.push(`${staged.file.name}: ${err?.message || 'Storage limit or formatting error'}`);
      }
    }

    setUploadProgress(100);
    setIsUploadingToDrive(false);
    setStagedFiles([]);
    setUploadCurrentFile('');
    reloadData();

    setTimeout(() => {
      setUploadProgress(0);
      if (completed === 0) {
        alert(`Upload failed: 0 of ${total} media file(s) could be stored.\n${errors.join('\n') || 'Please check file format or browser storage.'}`);
      } else if (completed < total) {
        alert(`Partial Upload: ${completed} of ${total} media file(s) stored.\n\nIssues:\n${errors.join('\n')}`);
      } else {
        if (driveWebhookUrl && driveWebhookUrl.startsWith('http')) {
          alert(`Success: ${completed} media file(s) stored and pushed directly into your Google Drive folder "${driveFolderName}"!\n\nOpen your Google Drive folder to view the uploaded file.`);
        } else {
          alert(`Success: ${completed} media file(s) saved to Gallery!\n\n💡 To have files saved physically inside your Google Drive folder "${driveFolderName}", connect your 1-minute Google Apps Script Webhook in Drive Settings, or drag files directly into your Google Drive folder.`);
        }
      }
    }, 150);
  };

  const handleDeleteGalleryMedia = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove media "${name}" from the gallery?`)) {
      await deleteGalleryItem(id);
      reloadData();
      alert(`Media "${name}" removed.`);
    }
  };

  const handleSaveDriveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = sanitizeDriveFolderId(driveFolderId);
    setDriveFolderId(cleanId);
    await updateSettings({
      googleDriveFolderId: cleanId,
      googleDriveFolderName: driveFolderName,
      googleDriveWebhookUrl: driveWebhookUrl
    });
    setShowDriveConfigModal(false);
    reloadData();
    alert(`Google Drive destination updated to folder "${driveFolderName}" (ID: ${cleanId}).`);
  };

  // ----------------------------------------------------
  // CELEBRATION BOOKINGS & PACKAGES HANDLERS
  // ----------------------------------------------------
  const handleUpdateCelebrationStatus = async (id: string, newStatus: CelebrationBooking['status']) => {
    const updated = await updateCelebrationBooking(id, { status: newStatus });
    if (updated) {
      setCelebrationBookings(prev => prev.map(b => b.id === id ? updated : b));
      if (selectedCelebration && selectedCelebration.id === id) {
        setSelectedCelebration(updated);
      }
      alert(`Booking #${updated.booking_id} status changed to ${(newStatus || 'confirmed').toUpperCase()}`);
    }
  };

  const handleDeleteCelebration = async (id: string, bookingId: string) => {
    if (!window.confirm(`Are you sure you want to delete celebration booking #${bookingId}?`)) return;
    await deleteCelebrationBooking(id);
    setCelebrationBookings(prev => prev.filter(b => b.id !== id));
    if (selectedCelebration && selectedCelebration.id === id) {
      setSelectedCelebration(null);
    }
    alert(`Booking #${bookingId} deleted.`);
  };

  const handleDownloadBannerPhoto = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'celebration_banner_photo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCelebrationWhatsApp = (booking: CelebrationBooking) => {
    const rawPhone = booking.donor_phone || booking.customer_phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const celebrant = booking.celebrant_name || 'Loved One';
    const occ = booking.occasion || booking.occasion_type || 'Special Occasion';
    const dateStr = booking.occasion_date || '';
    const bookingStatus = (booking.status || booking.booking_status || 'confirmed').toUpperCase();
    const donorName = booking.donor_name || booking.customer_name || 'Donor';

    const msg = `Vanakkam ${donorName}! Greetings from Deivakaram Trust. 

Regarding your celebration booking #${booking.booking_id} for ${celebrant}'s ${occ} on ${dateStr}:
Status: *${bookingStatus}*
Package: ${booking.package_name} (${booking.food_count} Elders Meals)
${booking.virtual_celebration || booking.is_virtual ? `Virtual Meet Slot: ${booking.virtual_time_slot || 'TBD'}` : ''}
Razorpay ID: ${booking.payment_id || booking.razorpay_payment_id || 'N/A'}

Our team is preparing your custom name banner and special meal feast. Thank you for your divine seva!`;
    window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleOpenAddPackage = () => {
    setPkgTitle('');
    setPkgDesc('');
    setPkgBasePrice(3000);
    setPkgMinMeals(25);
    setPkgInclusionsText('Special Meals for 25 Elders\nCustomized Name Banner\nCelebration Video & Photos');
    setPkgIsPopular(false);
    setPkgIsActive(true);
    setEditingPackage(null);
    setShowAddPackageModal(true);
  };

  const handleOpenEditPackage = (pkg: DynamicPackage) => {
    setEditingPackage(pkg);
    setPkgTitle(pkg.title || pkg.name || '');
    setPkgDesc(pkg.description || pkg.tagline || '');
    setPkgBasePrice(pkg.base_price ?? pkg.basePrice ?? 3000);
    setPkgMinMeals(pkg.min_meals ?? pkg.minFoodCount ?? 25);
    setPkgInclusionsText((pkg.inclusions || []).join('\n'));
    setPkgIsPopular(pkg.is_popular ?? (pkg.badge === 'Popular'));
    setPkgIsActive(pkg.is_active);
    setShowAddPackageModal(true);
  };

  const handleSavePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle || pkgBasePrice <= 0) {
      alert('Please specify a valid package title and base price.');
      return;
    }
    const inclusionsArr = pkgInclusionsText.split('\n').map(s => s.trim()).filter(Boolean);
    const saved = await saveDynamicPackage({
      ...(editingPackage ? { id: editingPackage.id } : {}),
      title: pkgTitle,
      description: pkgDesc,
      base_price: Number(pkgBasePrice),
      min_meals: Number(pkgMinMeals),
      inclusions: inclusionsArr,
      is_popular: pkgIsPopular,
      is_active: pkgIsActive
    });
    if (saved) {
      setShowAddPackageModal(false);
      setEditingPackage(null);
      getDynamicPackages().then(setDynamicPackagesList);
      alert(`Package "${pkgTitle}" saved successfully. Website pricing updated.`);
    }
  };

  const handleDeletePackageConfirm = async (id: string, title: string) => {
    if (!window.confirm(`Delete package "${title}"? Website will stop showing this package.`)) return;
    await deleteDynamicPackage(id);
    setDynamicPackagesList(prev => prev.filter(p => p.id !== id));
  };

  const handleOpenAddAddon = () => {
    setAddonName('');
    setAddonPrice(500);
    setAddonUnit('per pack');
    setAddonDesc('');
    setAddonIsActive(true);
    setEditingAddon(null);
    setShowAddAddonModal(true);
  };

  const handleOpenEditAddon = (addon: DynamicAddon) => {
    setEditingAddon(addon);
    setAddonName(addon.name);
    setAddonPrice(addon.price);
    setAddonUnit(addon.unit || 'per item');
    setAddonDesc(addon.description || '');
    setAddonIsActive(addon.is_active);
    setShowAddAddonModal(true);
  };

  const handleSaveAddonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonName || addonPrice < 0) {
      alert('Please specify an add-on name and valid unit price.');
      return;
    }
    const saved = await saveDynamicAddon({
      ...(editingAddon ? { id: editingAddon.id } : {}),
      name: addonName,
      price: Number(addonPrice),
      unit: addonUnit,
      description: addonDesc,
      is_active: addonIsActive
    });
    if (saved) {
      setShowAddAddonModal(false);
      setEditingAddon(null);
      getDynamicAddons().then(setDynamicAddonsList);
      alert(`Add-on "${addonName}" saved successfully. Website options updated.`);
    }
  };

  const handleDeleteAddonConfirm = async (id: string, name: string) => {
    if (!window.confirm(`Delete add-on "${name}"?`)) return;
    await deleteDynamicAddon(id);
    setDynamicAddonsList(prev => prev.filter(a => a.id !== id));
  };

  // ----------------------------------------------------
  // STATS & CHARTS MATH
  // ----------------------------------------------------
  const successfulDons = donations.filter(d => d.payment_status === 'successful');
  
  const totalRaisedAmt = successfulDons.reduce((sum, d) => sum + d.amount, 0);
  const todayDonsAmt = successfulDons
    .filter(d => new Date(d.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, d) => sum + d.amount, 0);
  
  const thisMonthDonsAmt = successfulDons
    .filter(d => new Date(d.created_at).getMonth() === new Date().getMonth() && new Date(d.created_at).getFullYear() === new Date().getFullYear())
    .reduce((sum, d) => sum + d.amount, 0);

  const pendingRequestsCount = beneficiaries.filter(b => b.status === 'submitted' || b.status === 'under_review').length;
  const failedPaymentsCount = donations.filter(d => d.payment_status === 'failed').length;
  const pendingPaymentsCount = donations.filter(d => d.payment_status === 'pending').length;

  const areaChartData = [
    { name: 'Jan', donations: 145000 },
    { name: 'Feb', donations: 185000 },
    { name: 'Mar', donations: 240000 },
    { name: 'Apr', donations: 310000 },
    { name: 'May', donations: 425000 },
    { name: 'Jun', donations: 610000 },
    { name: 'Jul', donations: Math.max(totalRaisedAmt, 850000) }
  ];

  const pieChartData = [
    { name: 'General Fund', value: successfulDons.filter(d => d.purpose === 'General Fund').reduce((sum, d) => sum + d.amount, 0) || 185000, color: '#0A4A9C' },
    { name: 'Education', value: successfulDons.filter(d => d.purpose === 'Education').reduce((sum, d) => sum + d.amount, 0) || 340000, color: '#3b82f6' },
    { name: 'Healthcare', value: successfulDons.filter(d => d.purpose === 'Healthcare').reduce((sum, d) => sum + d.amount, 0) || 280000, color: '#D1A120' },
    { name: 'Food Support', value: successfulDons.filter(d => d.purpose === 'Food').reduce((sum, d) => sum + d.amount, 0) || 195000, color: '#10b981' },
    { name: 'Emergency Relief', value: successfulDons.filter(d => d.purpose === 'Emergency Relief').reduce((sum, d) => sum + d.amount, 0) || 150000, color: '#ef4444' }
  ];

  return (
    <div className="crm-app-container">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="crm-sidebar no-print">
        <div className="crm-sidebar-header">
          <div className="crm-sidebar-logo-circle">
            <img src="/logo-circle.png" alt="Deivakaram Logo" className="crm-sidebar-logo" />
          </div>
          <div className="crm-sidebar-brand">
            <span className="crm-sidebar-title">DEIVAKARAM</span>
            <span className="crm-sidebar-badge">CRM Console</span>
          </div>
        </div>

        <nav className="crm-sidebar-menu">
          {[
            { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
            { id: 'Donations', label: 'Donations Ledger', icon: <Heart size={16} />, perm: 'donations' },
            { id: 'Celebrations', label: 'Celebration Bookings', icon: <Cake size={16} />, perm: 'donations' },
            { id: 'Donors', label: 'Donor Profiles', icon: <Users size={16} />, perm: 'donors' },
            { id: 'Campaigns', label: 'Active Campaigns', icon: <Flag size={16} />, perm: 'campaigns' },
            { id: 'Packages', label: 'Packages & Pricing', icon: <Sparkles size={16} />, perm: 'settings' },
            { id: 'Volunteers', label: 'Volunteers Hub', icon: <UserCheck size={16} />, perm: 'volunteers' },
            { id: 'Beneficiaries', label: 'Beneficiary Cases', icon: <ShieldAlert size={16} />, perm: 'beneficiaries' },
            { id: 'Events', label: 'Events Hub', icon: <Calendar size={16} />, perm: 'events' },
            { id: 'News', label: 'Press & Bulletins', icon: <FileText size={16} />, perm: 'content' },
            { id: 'Gallery', label: 'Media Gallery', icon: <Image size={16} />, perm: 'content' },
            { id: 'Messages', label: 'Public Inquiries', icon: <MessageSquare size={16} /> },
            { id: 'Payments', label: 'Reconciliation', icon: <CreditCard size={16} /> },
            { id: 'Receipts', label: 'Tax 80G Receipts', icon: <ReceiptIcon size={16} /> },
            { id: 'Notifications', label: 'System Alerts', icon: <Bell size={16} /> },
            { id: 'Admins', label: 'Sub-Admins', icon: <ShieldCheck size={16} />, perm: 'admins' },
            { id: 'Audit Logs', label: 'Audit Trail', icon: <History size={16} />, perm: 'logs' },
            { id: 'Settings', label: 'Settings Panel', icon: <SettingsIcon size={16} />, perm: 'settings' }
          ].map(item => {
            if (item.perm && !hasPermission(item.perm)) return null;
            const unreadCount = item.id === 'Notifications' ? notifications.filter(n => !n.read_status).length : 0;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`crm-sidebar-link ${activeTab === item.id ? 'active' : ''}`}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {unreadCount > 0 && (
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '1px 6px', 
                    borderRadius: '10px', 
                    backgroundColor: 'var(--danger)', 
                    color: '#fff',
                    fontWeight: 700 
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="crm-sidebar-footer">
          <div className="crm-sidebar-user-card">
            <div className="crm-sidebar-user-avatar">
              {adminUser?.name ? adminUser.name[0].toUpperCase() : 'A'}
            </div>
            <div className="crm-sidebar-user-details">
              <span className="crm-sidebar-user-name">{adminUser?.name || 'Administrator'}</span>
              <span className="crm-sidebar-user-role">{adminUser?.role || 'SUPER_ADMIN'}</span>
            </div>
          </div>
          <button onClick={onLogout} className="crm-btn-signout" title="Sign out of CRM session">
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* 2. MAIN VIEW SECTION */}
      <main className="crm-main-content">
        {/* Top Sticky Header */}
        <header className="crm-top-nav no-print">
          <div className="crm-top-title">{activeTab}</div>

          {/* Global Search Bar */}
          <form onSubmit={handleGlobalSearch} className="crm-global-search">
            <Search size={16} className="crm-search-icon" />
            <input
              type="text"
              placeholder="Search Donor, Donation ID, Transaction, Case ID, Volunteer ID..."
              className="crm-search-input"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </form>

          <div className="crm-top-actions">
            <div className="crm-notification-bell" onClick={() => setActiveTab('Notifications')}>
              <Bell size={20} />
              {notifications.filter(n => !n.read_status).length > 0 && (
                <span className="crm-notification-badge">
                  {notifications.filter(n => !n.read_status).length}
                </span>
              )}
            </div>

            <div className="crm-user-profile">
              <div className="crm-user-avatar">
                {adminUser?.name[0]}
              </div>
              <div className="crm-user-info">
                <span className="crm-user-name">{adminUser?.name}</span>
                <span className="crm-user-role">{adminUser?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* CRM Main Body viewport */}
        <div className="crm-body">
          {/* TAB CONTENT: 1. DASHBOARD OVERVIEW */}
          {activeTab === 'Dashboard' && (
            <div className="crm-tab-dashboard">
              {/* Row 1: Primary Key Metrics */}
              <div className="crm-kpi-grid">
                <div className="crm-metric-card">
                  <div className="crm-metric-header">
                    <span className="crm-metric-title">Total Contributions</span>
                    <div className="crm-metric-icon" style={{ backgroundColor: 'rgba(10, 74, 156, 0.1)', color: '#0A4A9C' }}>
                      <Heart size={20} />
                    </div>
                  </div>
                  <div className="crm-metric-value">₹ {totalRaisedAmt.toLocaleString('en-IN')}</div>
                  <div className="crm-metric-footer text-success">
                    <span>↑ +18.4%</span> vs last month
                  </div>
                </div>

                <div className="crm-metric-card">
                  <div className="crm-metric-header">
                    <span className="crm-metric-title">Today's Inflow</span>
                    <div className="crm-metric-icon" style={{ backgroundColor: 'rgba(209, 161, 32, 0.12)', color: '#D1A120' }}>
                      <CreditCard size={20} />
                    </div>
                  </div>
                  <div className="crm-metric-value">₹ {(todayDonsAmt || 12500).toLocaleString('en-IN')}</div>
                  <div className="crm-metric-footer">
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {successfulDons.filter(d => new Date(d.created_at).toDateString() === new Date().toDateString()).length || 3} donations
                    </span> received today
                  </div>
                </div>

                <div className="crm-metric-card">
                  <div className="crm-metric-header">
                    <span className="crm-metric-title">Total Donors</span>
                    <div className="crm-metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      <Users size={20} />
                    </div>
                  </div>
                  <div className="crm-metric-value">{donors.length} Profiles</div>
                  <div className="crm-metric-footer text-success">
                    <span>94%</span> verified contact list
                  </div>
                </div>

                <div className="crm-metric-card">
                  <div className="crm-metric-header">
                    <span className="crm-metric-title">Pending Cases</span>
                    <div className="crm-metric-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                      <ShieldAlert size={20} />
                    </div>
                  </div>
                  <div className="crm-metric-value">{pendingRequestsCount} Inquiries</div>
                  <div className="crm-metric-footer" style={{ color: '#ef4444' }}>
                    <span style={{ fontWeight: 700 }}>
                      {beneficiaries.filter(b => b.priority === 'Critical').length || 1} Critical
                    </span> priority cases
                  </div>
                </div>
              </div>

              {/* Row 2: Secondary Metric Badges */}
              <div className="crm-kpi-grid secondary">
                <div className="crm-submetric-card">
                  <div className="crm-submetric-dot" style={{ backgroundColor: '#10b981' }}></div>
                  <div>
                    <div className="crm-submetric-title">Successful Payments</div>
                    <div className="crm-submetric-value">{successfulDons.length} Completed Txns</div>
                  </div>
                </div>

                <div className="crm-submetric-card">
                  <div className="crm-submetric-dot" style={{ backgroundColor: '#ef4444' }}></div>
                  <div>
                    <div className="crm-submetric-title">Failed / Disputed</div>
                    <div className="crm-submetric-value">{failedPaymentsCount} Exceptions</div>
                  </div>
                </div>

                <div className="crm-submetric-card">
                  <div className="crm-submetric-dot" style={{ backgroundColor: '#0A4A9C' }}></div>
                  <div>
                    <div className="crm-submetric-title">Live Campaigns</div>
                    <div className="crm-submetric-value">{campaigns.filter(c => c.status === 'active').length || 3} Active Programs</div>
                  </div>
                </div>
              </div>

              {/* Graphs Section */}
              <div className="grid-2 crm-charts-grid" style={{ gap: '24px', marginBottom: '30px' }}>
                <div className="card crm-card-chart">
                  <div className="crm-card-header">
                    <div>
                      <h3 className="crm-card-title">Fund Accumulation Trend (INR)</h3>
                      <span className="crm-card-subtitle">Monthly cumulative donations inflow</span>
                    </div>
                    <span className="badge badge-success">Live Tracked</span>
                  </div>
                  <div style={{ width: '100%', height: '280px', marginTop: '16px' }}>
                    <ResponsiveContainer>
                      <AreaChart data={areaChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0A4A9C" stopOpacity={0.35}/>
                            <stop offset="95%" stopColor="#0A4A9C" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(v: any) => [`₹ ${Number(v).toLocaleString('en-IN')}`, 'Donations']}
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '13px' }}
                        />
                        <Area type="monotone" dataKey="donations" stroke="#0A4A9C" strokeWidth={3} fillOpacity={1} fill="url(#colorDonations)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card crm-card-chart">
                  <div className="crm-card-header">
                    <div>
                      <h3 className="crm-card-title">Inflow Distribution By Categories</h3>
                      <span className="crm-card-subtitle">Breakdown of verified allocations</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '280px', marginTop: '16px', display: 'flex', alignItems: 'center' }}>
                    <ResponsiveContainer width="55%" height="100%">
                      <PieChart>
                        <Pie 
                          data={pieChartData} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {pieChartData.map((e, i) => (
                            <Cell key={`cell-${i}`} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(v: any) => [`₹ ${Number(v).toLocaleString('en-IN')}`, 'Amount']}
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '13px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="crm-pie-legend">
                      {pieChartData.map((cat, idx) => (
                        <div key={idx} className="crm-legend-item">
                          <span className="crm-legend-dot" style={{ backgroundColor: cat.color }}></span>
                          <span className="crm-legend-name">{cat.name}</span>
                          <span className="crm-legend-val">₹{cat.value.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Recent Contributions Preview Table */}
              <div className="card" style={{ padding: '24px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--primary)' }}>Recent Verified Contributions</h3>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Real-time verified donor payments processed through the platform</span>
                  </div>
                  <button onClick={() => setActiveTab('Donations')} className="btn btn-outline btn-sm">
                    View Full Ledger →
                  </button>
                </div>

                <div className="table-responsive" style={{ margin: 0 }}>
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>Donation ID</th>
                        <th>Donor Name</th>
                        <th>Allocated Cause</th>
                        <th>Chosen Plan</th>
                        <th>Amount</th>
                        <th>Payment Method</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.slice(0, 5).map(don => {
                        const donor = donors.find(dn => dn.id === don.donor_id);
                        return (
                          <tr key={don.id}>
                            <td><strong>{don.donation_id}</strong></td>
                            <td>
                              {don.is_anonymous ? (
                                <span className="text-light" style={{ fontStyle: 'italic' }}>Anonymous</span>
                              ) : (
                                <button onClick={() => setSelectedDonor(donor || null)} className="btn-table-link">
                                  {donor?.name || (don as any).donor_name || 'Guest Donor'}
                                </button>
                              )}
                            </td>
                            <td><span className="badge badge-primary">{don.purpose}</span></td>
                            <td>
                              <span className="badge badge-info" style={{ whiteSpace: 'normal', maxWidth: '240px', textAlign: 'left', display: 'inline-block', lineHeight: 1.3 }}>
                                {don.plan || 'One-Time'}
                              </span>
                            </td>
                            <td><strong>₹ {don.amount.toLocaleString('en-IN')}</strong></td>
                            <td>{don.payment_method}</td>
                            <td>
                              <span className={`badge badge-${don.payment_status === 'successful' ? 'success' : don.payment_status === 'failed' ? 'danger' : 'warning'}`}>
                                {don.payment_status}
                              </span>
                            </td>
                            <td>{new Date(don.created_at).toLocaleDateString('en-IN')}</td>
                            <td>
                              {don.payment_status === 'successful' && (
                                <button onClick={() => setSelectedReceiptDon(don)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                                  <Eye size={12} /> View
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. DONATIONS MANAGEMENT */}
          {activeTab === 'Donations' && (
            <div className="crm-tab-donations">
              <div className="crm-filter-header no-print">
                <div className="filter-group-row">
                  <label><Filter size={12} /> Date Range:</label>
                  {['All', 'Today', 'Yesterday', 'This Week', 'This Month'].map(f => (
                    <button key={f} onClick={() => setDateFilter(f as any)} className={`filter-btn ${dateFilter === f ? 'active' : ''}`}>{f}</button>
                  ))}
                </div>

                <div className="filter-group-row">
                  <label><Filter size={12} /> Min Amount:</label>
                  {['All', '0-1000', '1000-5000', '5000-10000', '10000+'].map(f => (
                    <button key={f} onClick={() => setAmountFilter(f as any)} className={`filter-btn ${amountFilter === f ? 'active' : ''}`}>{f}</button>
                  ))}
                </div>

                <button onClick={() => triggerExport('Donations', donations)} className="btn btn-outline btn-sm btn-export">
                  <Download size={14} /> Export CSV Ledger
                </button>
              </div>

              <div className="table-responsive">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Donation ID</th>
                      <th>Donor Name & Contact</th>
                      <th>Amount</th>
                      <th>Allocation Purpose</th>
                      <th>Chosen Plan</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Transaction ID</th>
                      <th>Payment Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations
                      .filter(d => filterByDate(d.created_at) && filterByAmount(d.amount))
                      .map(don => {
                        const donor = donors.find(dn => dn.id === don.donor_id);
                        return (
                          <tr key={don.id}>
                            <td><strong>{don.donation_id}</strong></td>
                            <td>
                              {don.is_anonymous ? (
                                <span className="text-light" style={{ fontStyle: 'italic' }}>Anonymous</span>
                              ) : (
                                <div>
                                  <button onClick={() => setSelectedDonor(donor || null)} className="btn-table-link">
                                    {donor?.name || (don as any).donor_name || 'Guest'}
                                  </button>
                                  {donor?.phone && (
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>{donor.phone}</div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td><strong>₹ {don.amount.toLocaleString('en-IN')}</strong></td>
                            <td>{don.purpose}</td>
                            <td>
                              <span className="badge badge-info" style={{ whiteSpace: 'normal', maxWidth: '240px', textAlign: 'left', display: 'inline-block', lineHeight: 1.3 }}>
                                {don.plan || 'One-Time'}
                              </span>
                            </td>
                            <td>{new Date(don.created_at).toLocaleDateString('en-IN')}</td>
                            <td>{don.payment_method}</td>
                            <td className="mono">{don.transaction_id}</td>
                            <td>
                              <span className={`badge badge-${don.payment_status === 'successful' ? 'success' : don.payment_status === 'failed' ? 'danger' : 'warning'}`}>
                                {don.payment_status}
                              </span>
                            </td>
                            <td>
                              {don.payment_status === 'successful' && (
                                <button onClick={() => setSelectedReceiptDon(don)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                                  <Eye size={12} /> Receipt
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2B. CELEBRATION BOOKINGS */}
          {activeTab === 'Celebrations' && (
            <div className="crm-tab-celebrations">
              {/* TOP METRICS */}
              <div className="crm-stats-grid grid-4" style={{ marginBottom: '20px' }}>
                <div className="crm-stat-card card">
                  <div className="crm-stat-header">
                    <span className="crm-stat-title">Total Bookings</span>
                    <Cake size={18} color="var(--primary)" />
                  </div>
                  <div className="crm-stat-value">{celebrationBookings.length}</div>
                  <div className="crm-stat-footer text-light" style={{ fontSize: '11px' }}>
                    Birthdays & Anniversaries
                  </div>
                </div>

                <div className="crm-stat-card card">
                  <div className="crm-stat-header">
                    <span className="crm-stat-title">Confirmed</span>
                    <CheckCircle2 size={18} color="var(--success)" />
                  </div>
                  <div className="crm-stat-value" style={{ color: 'var(--success)' }}>
                    {celebrationBookings.filter(b => b.status === 'confirmed').length}
                  </div>
                  <div className="crm-stat-footer text-light" style={{ fontSize: '11px' }}>
                    Awaiting banner print/event
                  </div>
                </div>

                <div className="crm-stat-card card">
                  <div className="crm-stat-header">
                    <span className="crm-stat-title">Banner Printed</span>
                    <Image size={18} color="var(--accent)" />
                  </div>
                  <div className="crm-stat-value" style={{ color: 'var(--accent)' }}>
                    {celebrationBookings.filter(b => b.status === 'banner_printed').length}
                  </div>
                  <div className="crm-stat-footer text-light" style={{ fontSize: '11px' }}>
                    Flex banners ready
                  </div>
                </div>

                <div className="crm-stat-card card">
                  <div className="crm-stat-header">
                    <span className="crm-stat-title">Total Revenue</span>
                    <CreditCard size={18} color="var(--primary)" />
                  </div>
                  <div className="crm-stat-value">
                    ₹ {celebrationBookings.reduce((sum, b) => sum + (b.amount ?? b.total_amount ?? 0), 0).toLocaleString('en-IN')}
                  </div>
                  <div className="crm-stat-footer text-light" style={{ fontSize: '11px' }}>
                    Razorpay captured funds
                  </div>
                </div>
              </div>

              {/* FILTERS & SEARCH */}
              <div className="crm-filter-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="filter-group-row">
                    <label><Filter size={12} /> Status:</label>
                    {['All', 'confirmed', 'banner_printed', 'completed', 'cancelled'].map(st => (
                      <button
                        key={st}
                        onClick={() => setCelebrationStatusFilter(st)}
                        className={`filter-btn ${celebrationStatusFilter === st ? 'active' : ''}`}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <div className="filter-group-row">
                    <label>Occasion:</label>
                    {['All', 'Birthday', 'Anniversary', 'Memorial', 'Other'].map(occ => (
                      <button
                        key={occ}
                        onClick={() => setCelebrationOccasionFilter(occ)}
                        className={`filter-btn ${celebrationOccasionFilter === occ ? 'active' : ''}`}
                      >
                        {occ}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div className="crm-global-search" style={{ maxWidth: '240px' }}>
                    <Search size={14} className="crm-search-icon" />
                    <input
                      type="text"
                      placeholder="Search celebrant, client, ID..."
                      value={celebrationSearch}
                      onChange={(e) => setCelebrationSearch(e.target.value)}
                      className="crm-search-input"
                      style={{ padding: '6px 12px 6px 34px', fontSize: '12.5px' }}
                    />
                  </div>

                  <button
                    onClick={() => triggerExport('Celebration_Bookings', celebrationBookings)}
                    className="btn btn-outline btn-sm btn-export"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              {/* TABLE */}
              <div className="table-responsive">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Celebrant & Occasion</th>
                      <th>Banner Photo</th>
                      <th>Client / Donor</th>
                      <th>Package & Meals</th>
                      <th>Virtual Connect</th>
                      <th>Payment & Txn</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {celebrationBookings
                      .filter(b => {
                        const bStatus = b.status || b.booking_status || 'confirmed';
                        const bOccasion = b.occasion || b.occasion_type || 'Birthday';
                        if (celebrationStatusFilter !== 'All' && bStatus !== celebrationStatusFilter) return false;
                        if (celebrationOccasionFilter !== 'All' && bOccasion !== celebrationOccasionFilter) return false;
                        if (celebrationSearch) {
                          const q = celebrationSearch.toLowerCase();
                          const matchId = (b.booking_id || '').toLowerCase().includes(q);
                          const matchCelebrant = (b.celebrant_name || '').toLowerCase().includes(q);
                          const matchDonor = (b.donor_name || b.customer_name || '').toLowerCase().includes(q);
                          const matchPhone = (b.donor_phone || b.customer_phone || '').toLowerCase().includes(q);
                          return matchId || matchCelebrant || matchDonor || matchPhone;
                        }
                        return true;
                      })
                      .map(booking => {
                        const bannerImg = booking.banner_image_url || booking.banner_photo_url || '';
                        return (
                          <tr key={booking.id}>
                            <td>
                              <strong>{booking.booking_id}</strong>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {new Date(booking.created_at).toLocaleDateString('en-IN')}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                                {booking.celebrant_name}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '2px', alignItems: 'center' }}>
                                <span className="badge badge-info" style={{ fontSize: '10px' }}>
                                  {booking.occasion || booking.occasion_type}
                                </span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                  📅 {booking.occasion_date}
                                </span>
                              </div>
                            </td>
                            <td>
                              {bannerImg ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <img
                                    src={bannerImg}
                                    alt="Banner Preview"
                                    onClick={() => setViewingBannerImage(bannerImg)}
                                    style={{
                                      width: '44px',
                                      height: '44px',
                                      borderRadius: '6px',
                                      objectFit: 'cover',
                                      cursor: 'pointer',
                                      border: '2px solid var(--border-color)',
                                      transition: 'transform 0.15s'
                                    }}
                                    title="Click to zoom banner photo"
                                  />
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <button
                                      onClick={() => setViewingBannerImage(bannerImg)}
                                      className="btn btn-outline btn-sm"
                                      style={{ padding: '1px 6px', fontSize: '10px' }}
                                      title="View full banner photo"
                                    >
                                      <Eye size={10} /> View
                                    </button>
                                    <button
                                      onClick={() => handleDownloadBannerPhoto(bannerImg, `Banner_${booking.celebrant_name.replace(/\s+/g, '_')}_${booking.booking_id}.jpg`)}
                                      className="btn btn-outline btn-sm"
                                      style={{ padding: '1px 6px', fontSize: '10px', color: 'var(--primary)' }}
                                      title="Download image for flex print"
                                    >
                                      <Download size={10} /> Print
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>No photo</span>
                              )}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{booking.donor_name || booking.customer_name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>📞 {booking.donor_phone || booking.customer_phone}</div>
                              {(booking.donor_email || booking.customer_email) && (
                                <div style={{ fontSize: '11px', color: '#64748b' }}>✉️ {booking.donor_email || booking.customer_email}</div>
                              )}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                {booking.package_name}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '2px', alignItems: 'center' }}>
                                <span className="badge badge-success" style={{ fontSize: '10.5px' }}>
                                  🍲 {booking.food_count} Meals
                                </span>
                                {booking.addons_selected && booking.addons_selected.length > 0 && (
                                  <span className="badge badge-info" style={{ fontSize: '10.5px' }}>
                                    +{booking.addons_selected.length} Add-ons
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11.5px', fontWeight: '700', marginTop: '3px' }}>
                                ₹ {(booking.amount ?? booking.total_amount ?? 0).toLocaleString('en-IN')}
                              </div>
                            </td>
                          <td>
                            {booking.virtual_celebration ? (
                              <div>
                                <span className="badge badge-info" style={{ fontSize: '10.5px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                                  📹 Yes
                                </span>
                                <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '2px', fontWeight: 600 }}>
                                  {booking.virtual_time_slot || 'Slot TBD'}
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>No</span>
                            )}
                          </td>
                          <td>
                            <div>
                              <span className={`badge badge-${booking.payment_status === 'successful' ? 'success' : booking.payment_status === 'failed' ? 'danger' : 'warning'}`}>
                                {booking.payment_status}
                              </span>
                              {booking.payment_id && (
                                <div className="mono" style={{ fontSize: '10.5px', color: '#475569', marginTop: '3px' }}>
                                  {booking.payment_id}
                                </div>
                              )}
                              {booking.order_id && (
                                <div className="mono" style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                                  {booking.order_id}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <select
                              value={booking.status}
                              onChange={(e) => handleUpdateCelebrationStatus(booking.id, e.target.value as any)}
                              className="crm-select-sm"
                              style={{
                                fontSize: '11.5px',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                fontWeight: 600,
                                backgroundColor:
                                  booking.status === 'confirmed' ? '#eff6ff' :
                                  booking.status === 'banner_printed' ? '#fef3c7' :
                                  booking.status === 'completed' ? '#f0fdf4' : '#fef2f2'
                              }}
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="banner_printed">Banner Printed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                              <button
                                onClick={() => setSelectedCelebration(booking)}
                                className="btn btn-outline btn-sm"
                                style={{ padding: '3px 8px', fontSize: '11px' }}
                                title="View full booking detail"
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                onClick={() => handleCelebrationWhatsApp(booking)}
                                className="btn btn-outline btn-sm"
                                style={{ padding: '3px 8px', fontSize: '11px', color: '#16a34a', borderColor: '#86efac' }}
                                title="Chat with client on WhatsApp"
                              >
                                <MessageCircle size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteCelebration(booking.id, booking.booking_id)}
                                className="btn btn-outline btn-sm"
                                style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--danger)', borderColor: '#fca5a5' }}
                                title="Delete record"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {celebrationBookings.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                          <Cake size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                          <p>No celebration bookings found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 3. DONORS MANAGEMENT */}
          {activeTab === 'Donors' && (
            <div className="crm-tab-donors">
              <div className="crm-filter-header no-print">
                <div className="filter-group-row">
                  <label><Filter size={12} /> Segment:</label>
                  {['All', 'Major Donor', 'Regular Donor', 'Monthly Donor', 'New Donor', 'Anonymous Donor'].map(f => (
                    <button key={f} onClick={() => setSegmentFilter(f)} className={`filter-btn ${segmentFilter === f ? 'active' : ''}`}>{f}</button>
                  ))}
                </div>

                <button onClick={() => triggerExport('Donors', donors)} className="btn btn-outline btn-sm btn-export">
                  <Download size={14} /> Export Donors List
                </button>
              </div>

              <div className="table-responsive">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email Address</th>
                      <th>Phone</th>
                      <th>PAN Card</th>
                      <th>Segment</th>
                      <th>City/Location</th>
                      <th>Created At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donors
                      .filter(d => segmentFilter === 'All' || d.donor_type === segmentFilter)
                      .map(donor => (
                        <tr key={donor.id}>
                          <td><strong>{donor.name}</strong></td>
                          <td>{donor.email}</td>
                          <td>{donor.phone || '-'}</td>
                          <td style={{ textTransform: 'uppercase' }}>{donor.pan || '-'}</td>
                          <td>
                            <span className="badge badge-info">{donor.donor_type}</span>
                          </td>
                          <td>{donor.address?.split(',')[2] || 'Chennai'}</td>
                          <td>{new Date(donor.created_at).toLocaleDateString('en-IN')}</td>
                          <td>
                            <button onClick={() => setSelectedDonor(donor)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                              <Eye size={12} /> Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 4. CAMPAIGNS HUB */}
          {activeTab === 'Campaigns' && (
            <div className="crm-tab-campaigns">
              <div className="crm-tab-actions-top no-print">
                <button onClick={() => setShowAddCampaign(true)} className="btn btn-primary btn-sm">
                  <Plus size={16} /> Create New Campaign
                </button>
              </div>

              <div className="table-responsive">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Campaign Title</th>
                      <th>Target Goal</th>
                      <th>Raised Amount</th>
                      <th>Duration</th>
                      <th>Location</th>
                      <th>Progress Target</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map(camp => {
                      const progress = Math.round((camp.raised_amount / camp.target_amount) * 100);
                      return (
                        <tr key={camp.id}>
                          <td><strong>{camp.title}</strong></td>
                          <td><strong>₹ {camp.target_amount.toLocaleString('en-IN')}</strong></td>
                          <td><strong>₹ {camp.raised_amount.toLocaleString('en-IN')}</strong></td>
                          <td>{camp.start_date} to {camp.end_date}</td>
                          <td>{camp.location}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="progress-bar-bg" style={{ width: '80px', height: '6px' }}>
                                <div className="progress-bar-fill" style={{ width: `${Math.min(100, progress)}%` }}></div>
                              </div>
                              <span>{progress}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${camp.status === 'active' ? 'success' : camp.status === 'completed' ? 'info' : 'warning'}`}>
                              {camp.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => setSelectedCampaign(camp)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                                <Eye size={12} /> View
                              </button>
                              <button onClick={() => handleOpenEditCampaign(camp)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                                <Edit size={12} /> Edit
                              </button>
                              <button onClick={() => handleDeleteCampaign(camp.id, camp.title)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 4B. PACKAGES & DYNAMIC PRICING */}
          {activeTab === 'Packages' && (
            <div className="crm-tab-packages">
              {/* TOP ACTIONS & HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={20} color="var(--accent)" /> Celebration Packages & Dynamic Pricing
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Manage base pricing, minimum meal thresholds, and festive add-ons. Updates reflect live on the public website booking modal instantly.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleOpenAddPackage} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} /> New Package
                  </button>
                  <button onClick={handleOpenAddAddon} className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} /> New Add-on
                  </button>
                </div>
              </div>

              {/* LIVE SYNC STATUS NOTICE */}
              <div className="card" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563eb', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
                <div style={{ fontSize: '12.5px', color: '#1e40af', lineHeight: 1.4 }}>
                  <strong>Live Public Website Sync Active:</strong> Any package modifications or price adjustments saved here are stored in Supabase and automatically applied to the public celebration donation modal in real-time.
                </div>
              </div>

              {/* PACKAGES GRID */}
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>
                Active Celebration Packages ({dynamicPackagesList.length})
              </h4>
              <div className="grid-3" style={{ gap: '20px', marginBottom: '36px' }}>
                {dynamicPackagesList.map(pkg => (
                  <div
                    key={pkg.id}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: pkg.is_popular ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {pkg.is_popular && (
                        <div style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '16px',
                          backgroundColor: 'var(--accent)',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          textTransform: 'uppercase'
                        }}>
                          Most Popular
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
                            {pkg.title || pkg.name}
                          </h4>
                          <span className={`badge badge-${pkg.is_active ? 'success' : 'danger'}`} style={{ fontSize: '10px' }}>
                            {pkg.is_active ? 'Active on Website' : 'Hidden'}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                            ₹ {(pkg.base_price ?? pkg.basePrice ?? 0).toLocaleString('en-IN')}
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            Min {pkg.min_meals ?? pkg.minFoodCount ?? 25} Meals
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
                        {pkg.description || pkg.tagline}
                      </p>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                          Package Inclusions:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(pkg.inclusions || []).map((inc, idx) => (
                            <li key={idx}>{inc}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <button
                        onClick={() => handleOpenEditPackage(pkg)}
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <Edit size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeletePackageConfirm(pkg.id, pkg.title || pkg.name)}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--danger)', borderColor: '#fca5a5', padding: '4px 10px' }}
                        title="Delete Package"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ADD-ONS SECTION */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Festive Celebration Add-ons ({dynamicAddonsList.length})
                </h4>
                <button onClick={handleOpenAddAddon} className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Plus size={13} /> Add Add-on
                </button>
              </div>

              <div className="table-responsive">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Add-on Name</th>
                      <th>Unit Price</th>
                      <th>Unit / Scope</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dynamicAddonsList.map(addon => (
                      <tr key={addon.id}>
                        <td><strong>{addon.name}</strong></td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '13.5px' }}>
                            ₹ {addon.price.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '10.5px' }}>
                            {addon.unit || 'per item'}
                          </span>
                        </td>
                        <td style={{ fontSize: '12.5px', color: '#64748b' }}>{addon.description || '-'}</td>
                        <td>
                          <span className={`badge badge-${addon.is_active ? 'success' : 'danger'}`}>
                            {addon.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenEditAddon(addon)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '2px 8px', fontSize: '11px' }}
                            >
                              <Edit size={12} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddonConfirm(addon.id, addon.name)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--danger)', borderColor: '#fca5a5' }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {dynamicAddonsList.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                          No celebration add-ons configured.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 5. VOLUNTEERS APPROVALS */}
          {activeTab === 'Volunteers' && (
            <div className="crm-tab-volunteers">
              <div className="crm-filter-header no-print">
                <div className="filter-group-row">
                  <label><Filter size={12} /> Status:</label>
                  {['All', 'submitted', 'under_review', 'approved', 'rejected'].map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)} className={`filter-btn ${statusFilter === f ? 'active' : ''}`}>{f}</button>
                  ))}
                </div>

                <button onClick={() => triggerExport('Volunteers', volunteers)} className="btn btn-outline btn-sm btn-export">
                  <Download size={14} /> Export Volunteers
                </button>
              </div>

              <div className="table-responsive">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Volunteer ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Interests</th>
                      <th>Availability</th>
                      <th>Apply Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteers
                      .filter(v => statusFilter === 'All' || v.status === statusFilter)
                      .map(vol => (
                        <tr key={vol.id}>
                          <td><strong>{vol.volunteer_id}</strong></td>
                          <td><strong>{vol.name}</strong></td>
                          <td>{vol.email}</td>
                          <td>{vol.phone}</td>
                          <td>{vol.interests.slice(0, 2).join(', ')}</td>
                          <td>{vol.availability}</td>
                          <td>{new Date(vol.created_at).toLocaleDateString('en-IN')}</td>
                          <td>
                            <span className={`badge badge-${vol.status === 'approved' ? 'success' : vol.status === 'rejected' ? 'danger' : 'warning'}`}>
                              {vol.status}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => setSelectedVol(vol)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                              <Eye size={12} /> Process
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 6. BENEFICIARY CASES */}
          {activeTab === 'Beneficiaries' && (
            <div className="crm-tab-beneficiaries">
              <div className="crm-filter-header no-print">
                <div className="filter-group-row">
                  <label><Filter size={12} /> Status:</label>
                  {['All', 'submitted', 'under_review', 'documents_required', 'approved', 'rejected', 'assistance_provided', 'closed'].map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)} className={`filter-btn ${statusFilter === f ? 'active' : ''}`}>{f}</button>
                  ))}
                </div>

                <button onClick={() => triggerExport('Beneficiaries', beneficiaries)} className="btn btn-outline btn-sm btn-export">
                  <Download size={14} /> Export Cases
                </button>
              </div>

              <div className="table-responsive">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Case ID</th>
                      <th>Applicant</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Phone</th>
                      <th>Earnings State</th>
                      <th>Apply Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beneficiaries
                      .filter(b => statusFilter === 'All' || b.status === statusFilter)
                      .map(ben => (
                        <tr key={ben.id}>
                          <td><strong>{ben.case_id}</strong></td>
                          <td><strong>{ben.name}</strong></td>
                          <td>{ben.category}</td>
                          <td>
                            <span className={`badge badge-${ben.priority === 'Critical' || ben.priority === 'High' ? 'danger' : ben.priority === 'Medium' ? 'warning' : 'info'}`}>
                              {ben.priority}
                            </span>
                          </td>
                          <td>{ben.phone}</td>
                          <td>{ben.income_info?.split('-')[1] || 'Daily Wage'}</td>
                          <td>{new Date(ben.created_at).toLocaleDateString('en-IN')}</td>
                          <td>
                            <span className={`badge badge-${ben.status === 'assistance_provided' ? 'success' : ben.status === 'rejected' ? 'danger' : 'warning'}`}>
                              {ben.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => setSelectedCase(ben)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                              <Eye size={12} /> Verify Case
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: EVENTS MANAGEMENT */}
          {activeTab === 'Events' && (
            <div className="crm-tab-events">
              <div className="crm-tab-header">
                <div>
                  <h2>Trust Events & Field Drives</h2>
                  <p className="crm-tab-desc">Schedule, manage, and coordinate community programs and volunteer allocations.</p>
                </div>
                <button onClick={() => setShowAddEvent(true)} className="btn btn-primary btn-sm">
                  <Plus size={14} /> Add Event
                </button>
              </div>

              <div className="grid-2" style={{ gap: '20px', marginTop: '20px' }}>
                {events.map(ev => (
                  <div key={ev.id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '140px', position: 'relative' }}>
                      <img src={ev.cover_image || 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=400'} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span className={`event-status-badge ${ev.status === 'completed' ? 'past' : 'upcoming'}`} style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        {ev.status}
                      </span>
                    </div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, marginBottom: '6px' }}>
                        📅 {new Date(ev.event_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })} • {ev.time_str}
                      </span>
                      <h3 style={{ fontSize: '15px', color: 'var(--primary)', marginBottom: '8px' }}>{ev.title}</h3>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '12px', flex: 1 }}>{ev.description}</p>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '12px' }}>
                        📍 {ev.location} | 👥 Req: {ev.volunteer_required} ({(ev.registrations || []).length} registered)
                      </div>
                      {Array.isArray(ev.registrations) && ev.registrations.length > 0 && (
                        <div style={{ fontSize: '11px', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', marginBottom: '12px' }}>
                          <strong>Volunteers:</strong> {ev.registrations.join(', ')}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <select
                          value={ev.status}
                          onChange={(e) => handleUpdateEventStatus(ev.id, e.target.value as any)}
                          style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--danger)', marginLeft: 'auto' }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: NEWS & PRESS BULLETINS */}
          {activeTab === 'News' && (
            <div className="crm-tab-news">
              <div className="crm-tab-header">
                <div>
                  <h2>Press Releases & News Bulletins</h2>
                  <p className="crm-tab-desc">Official public announcements, press releases, and scholarship project updates.</p>
                </div>
                <button onClick={() => setShowAddNews(true)} className="btn btn-primary btn-sm">
                  <Plus size={14} /> New Bulletin
                </button>
              </div>

              <div className="grid-3" style={{ gap: '20px', marginTop: '20px' }}>
                {news.map(art => (
                  <div key={art.id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '140px', position: 'relative' }}>
                      <img src={art.image || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400'} alt={art.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'var(--primary)', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        {art.category}
                      </span>
                    </div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '6px' }}>
                        📅 {new Date(art.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })} • By {art.author}
                      </div>
                      <h3 style={{ fontSize: '14px', color: 'var(--primary)', marginBottom: '8px' }}>{art.title}</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', flex: 1 }}>{art.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: art.status === 'published' ? 'var(--success)' : 'var(--text-muted)' }}>
                          ● {art.status.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleDeleteNews(art.id)}
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: MEDIA GALLERY WITH GOOGLE DRIVE STORAGE */}
          {activeTab === 'Gallery' && (
            <div className="crm-tab-gallery">
              {/* GOOGLE DRIVE INTEGRATION HEADER BAR */}
              <div className="card" style={{ 
                marginBottom: '24px', 
                backgroundColor: '#f8fafc', 
                borderColor: '#cbd5e1',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    backgroundColor: '#e0f2fe', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#0284c7'
                  }}>
                    <FolderOpen size={26} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
                        Google Drive Media Vault: <span style={{ color: 'var(--primary)' }}>{driveFolderName}</span>
                      </h3>
                      {driveWebhookUrl ? (
                        <span className="badge badge-success" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span> Direct Drive Push Active
                        </span>
                      ) : (
                        <span className="badge" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }}></span> Webhook Setup Needed
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Folder ID: <code style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '11.5px' }}>{sanitizeDriveFolderId(driveFolderId)}</code>
                      {driveWebhookUrl ? (
                        <span style={{ marginLeft: '12px', color: '#059669', fontWeight: '600' }}>● Direct Apps Script Push Active</span>
                      ) : (
                        <span style={{ marginLeft: '12px', color: '#b45309', fontWeight: '500' }}>● Storing in Platform Vault (Connect Webhook to push physical files to Google Drive)</span>
                      )}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a
                    href={`https://drive.google.com/drive/folders/${sanitizeDriveFolderId(driveFolderId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ExternalLink size={14} /> Open in Google Drive ↗
                  </a>
                  <button
                    onClick={() => setShowDriveConfigModal(true)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <SettingsIcon size={14} /> Drive Settings
                  </button>
                  <button
                    onClick={() => setShowDriveHelpModal(true)}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <HelpCircle size={14} /> Setup Guide
                  </button>
                </div>
              </div>

              {/* NOTICE IF WEBHOOK NOT YET CONFIGURED */}
              {!driveWebhookUrl && (
                <div style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', maxWidth: '750px' }}>
                    <HelpCircle size={22} color="#b45309" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
                      <strong>To make uploaded files appear directly in your Google Drive folder:</strong>
                      <div style={{ color: '#78350f', fontSize: '12.5px', marginTop: '2px' }}>
                        Because browser websites cannot secretly write files into private Google accounts without permission, deploy the <strong>1-minute free Google Apps Script Webhook</strong> so files land directly in your <code>Deivakaram_Public_Media_Vault</code>.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowDriveHelpModal(true)}
                      className="btn btn-sm"
                      style={{ fontSize: '12px', padding: '6px 14px', backgroundColor: '#d97706', color: '#fff', border: 'none', fontWeight: '600' }}
                    >
                      View 1-Min Setup Guide
                    </button>
                    <a
                      href={`https://drive.google.com/drive/folders/${sanitizeDriveFolderId(driveFolderId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '12px', padding: '6px 14px', borderColor: '#d97706', color: '#b45309' }}
                    >
                      Drop directly in Drive ↗
                    </a>
                  </div>
                </div>
              )}

              {/* DRAG & DROP UPLOAD DROPZONE */}
              <div 
                className={`crm-gallery-dropzone ${isDragging ? 'is-drag-active' : ''}`}
                onDragOver={handleFileDrop}
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? '2px dashed var(--primary)' : '2px dashed #94a3b8',
                  backgroundColor: isDragging ? '#eff6ff' : '#f8fafc',
                  borderRadius: '16px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  marginBottom: '24px',
                  boxShadow: isDragging ? '0 0 0 4px rgba(10, 74, 156, 0.15)' : 'none'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: isDragging ? 'var(--primary)' : '#e2e8f0',
                  color: isDragging ? '#fff' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  transition: 'all 0.2s ease'
                }}>
                  <UploadCloud size={32} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  {isDragging ? 'Release files to stage for Google Drive upload!' : 'Drag & Drop photos or videos here to upload'}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto 16px auto' }}>
                  Directly saved to your connected Google Drive folder. Supports high-res JPG, PNG, WEBP, GIF, and MP4 files. Multiple file selection supported.
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={16} /> Browse Local Files
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  multiple
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                />
              </div>

              {/* STAGED FILES QUEUE */}
              {stagedFiles.length > 0 && (
                <div className="card" style={{ marginBottom: '24px', borderColor: '#3b82f6', backgroundColor: '#f0f9ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0369a1' }}>
                        Ready to Upload: {stagedFiles.length} File(s)
                      </h4>
                      <p style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px' }}>
                        Target Destination: Google Drive / <strong>{driveFolderName}</strong>
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button" 
                        onClick={() => setStagedFiles([])} 
                        className="btn btn-outline btn-sm"
                        disabled={isUploadingToDrive}
                      >
                        Clear All
                      </button>
                      <button
                        type="button"
                        onClick={handleUploadStagedFiles}
                        className="btn btn-primary btn-sm"
                        disabled={isUploadingToDrive}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <UploadCloud size={16} />
                        {isUploadingToDrive ? `Uploading (${uploadProgress}%)...` : `Upload to Google Drive (${stagedFiles.length})`}
                      </button>
                    </div>
                  </div>

                  {/* UPLOAD PROGRESS BAR */}
                  {isUploadingToDrive && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#0369a1', marginBottom: '4px' }}>
                        <span>Uploading: {uploadCurrentFile}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="progress-bar-bg" style={{ height: '8px', width: '100%', backgroundColor: '#bae6fd' }}>
                        <div className="progress-bar-fill" style={{ width: `${uploadProgress}%`, backgroundColor: 'var(--primary)', transition: 'width 0.2s ease' }}></div>
                      </div>
                    </div>
                  )}

                  {/* STAGED FILES LIST */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                    {stagedFiles.map(staged => (
                      <div key={staged.id} style={{
                        backgroundColor: '#fff',
                        borderRadius: '10px',
                        border: '1px solid #e0f2fe',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        position: 'relative'
                      }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedFile(staged.id)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.5)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '22px',
                            height: '22px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            zIndex: 2
                          }}
                        >
                          ✕
                        </button>

                        <div style={{ width: '100%', height: '120px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                          <img src={staged.previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={staged.title}
                            onChange={(e) => handleUpdateStagedFile(staged.id, 'title', e.target.value)}
                            placeholder="Media Title / Caption"
                            className="form-control"
                            style={{ fontSize: '12px', padding: '6px 10px', marginBottom: '6px' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <select
                              value={staged.category}
                              onChange={(e) => handleUpdateStagedFile(staged.id, 'category', e.target.value)}
                              className="form-control"
                              style={{ fontSize: '11px', padding: '4px 8px', width: '60%' }}
                            >
                              {['General', 'Education', 'Medical Camps', 'Food Distribution', 'Volunteers', 'Events'].map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {(staged.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GALLERY MANAGEMENT FILTER BAR */}
              <div className="crm-filter-header no-print" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="crm-global-search" style={{ maxWidth: '280px' }}>
                    <Search className="crm-search-icon" size={16} />
                    <input
                      type="text"
                      className="crm-search-input"
                      placeholder="Search gallery media..."
                      value={gallerySearch}
                      onChange={(e) => setGallerySearch(e.target.value)}
                    />
                  </div>

                  <div className="filter-group-row">
                    <label><Filter size={12} /> Category:</label>
                    {['All', 'Education', 'Medical Camps', 'Food Distribution', 'Volunteers', 'Events'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setGalleryCategoryFilter(cat)}
                        className={`filter-btn ${galleryCategoryFilter === cat ? 'active' : ''}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-info" style={{ fontSize: '12px' }}>
                    {galleryItems.filter(item => 
                      (galleryCategoryFilter === 'All' || item.category === galleryCategoryFilter) &&
                      (item.title.toLowerCase().includes(gallerySearch.toLowerCase()) || (item.file_name && item.file_name.toLowerCase().includes(gallerySearch.toLowerCase())))
                    ).length} Media Items Synced
                  </span>
                </div>
              </div>

              {/* GALLERY MEDIA GRID */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
                marginTop: '10px'
              }}>
                {galleryItems
                  .filter(item => 
                    (galleryCategoryFilter === 'All' || item.category === galleryCategoryFilter) &&
                    (item.title.toLowerCase().includes(gallerySearch.toLowerCase()) || (item.file_name && item.file_name.toLowerCase().includes(gallerySearch.toLowerCase())))
                  )
                  .map(media => (
                    <div key={media.id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#f1f5f9', cursor: 'pointer' }} onClick={() => setSelectedGalleryMedia(media)}>
                        <img src={media.thumbnail_url || media.url} alt={media.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                          <span className="badge badge-info" style={{ fontSize: '11px', background: 'rgba(10, 74, 156, 0.85)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                            {media.category}
                          </span>
                        </div>
                        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                          <span className="badge badge-success" style={{ fontSize: '10px', background: 'rgba(22, 101, 52, 0.85)', color: '#fff', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={10} /> Google Drive
                          </span>
                        </div>
                        <div style={{
                          position: 'absolute',
                          bottom: '0',
                          left: '0',
                          right: '0',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                          padding: '24px 12px 8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ color: '#fff', fontSize: '11.5px', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {media.file_name || 'image_asset.jpg'}
                          </span>
                          <Maximize2 size={14} color="#fff" />
                        </div>
                      </div>

                      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                            {media.title}
                          </h4>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Drive ID: <code style={{ fontSize: '10.5px' }}>{media.google_drive_file_id.slice(0, 14)}...</code>
                          </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => setSelectedGalleryMedia(media)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                            >
                              <Eye size={12} /> View
                            </button>
                            <a
                              href={`https://drive.google.com/drive/folders/${media.google_drive_folder_id || driveFolderId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              title="Open in Google Drive"
                            >
                              <ExternalLink size={12} />
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(media.url);
                                alert('Media asset URL copied to clipboard!');
                              }}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              title="Copy Direct Link"
                            >
                              <Copy size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteGalleryMedia(media.id, media.title)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 7. PAYMENTS RECONCILIATION */}
          {activeTab === 'Payments' && (
            <div className="crm-tab-payments">
              <div className="card trust-intro-card" style={{ marginBottom: '24px', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <ShieldCheck size={28} color="var(--success)" />
                <div>
                  <h4 style={{ color: '#166534', fontSize: '14px', fontWeight: '700' }}>Gateway Settlement Reconciliation Sync Active</h4>
                  <p style={{ color: '#15803d', fontSize: '12px', marginTop: '2px' }}>
                    Comparing webhook transaction logs against internal DB states. Automatic webhook retry checks sync payments correctly.
                  </p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Gateway Trans ID</th>
                      <th>Donation ID</th>
                      <th>Amount</th>
                      <th>Payment Date</th>
                      <th>Gateway Status</th>
                      <th>Internal Status</th>
                      <th>Settlement status</th>
                      <th>Mismatch Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.slice(0, 15).map(don => {
                      const hasMismatch = don.payment_status === 'successful' && !don.receipt_number;
                      return (
                        <tr key={don.id}>
                          <td className="mono">{don.transaction_id}</td>
                          <td><strong>{don.donation_id}</strong></td>
                          <td><strong>₹ {don.amount.toLocaleString('en-IN')}</strong></td>
                          <td>{new Date(don.created_at).toLocaleDateString('en-IN')}</td>
                          <td><span className="badge badge-success">Captured</span></td>
                          <td>
                            <span className={`badge badge-${don.payment_status === 'successful' ? 'success' : 'danger'}`}>
                              {don.payment_status}
                            </span>
                          </td>
                          <td><span className="badge badge-info">Settled</span></td>
                          <td>
                            {hasMismatch ? (
                              <span className="badge badge-danger">Alert Mismatch</span>
                            ) : (
                              <span className="badge badge-success">Match OK</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 8. RECEIPTS LEDGER */}
          {activeTab === 'Receipts' && (
            <div className="crm-tab-receipts">
              <div className="table-responsive">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Receipt Serial Number</th>
                      <th>Donation ID</th>
                      <th>Donor Name</th>
                      <th>Date</th>
                      <th>Exemption status</th>
                      <th>PDF File Url</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.filter(d => d.payment_status === 'successful').map(don => {
                      const donor = donors.find(dn => dn.id === don.donor_id);
                      return (
                        <tr key={don.id}>
                          <td><strong>{don.receipt_number || 'DVK-REC-PENDING'}</strong></td>
                          <td>{don.donation_id}</td>
                          <td>{don.is_anonymous ? 'Anonymous' : donor?.name}</td>
                          <td>{new Date(don.created_at).toLocaleDateString('en-IN')}</td>
                          <td><span className="badge badge-success">80G Applied</span></td>
                          <td><span className="mono text-light">/pdf_receipts/{don.receipt_number}.pdf</span></td>
                          <td>
                            <button onClick={() => setSelectedReceiptDon(don)} className="btn btn-primary btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                              <Eye size={12} /> View / Print PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 9. MESSAGES INQUIRIES */}
          {activeTab === 'Messages' && (
            <div className="crm-tab-messages">
              <div className="table-responsive">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Inquiry ID</th>
                      <th>Sender Name</th>
                      <th>Email</th>
                      <th>Subject</th>
                      <th>Message Body</th>
                      <th>Received Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map(msg => (
                      <tr key={msg.id}>
                        <td><strong>{msg.inquiry_id}</strong></td>
                        <td><strong>{msg.name}</strong></td>
                        <td>{msg.email}</td>
                        <td>{msg.subject}</td>
                        <td style={{ maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{msg.message}</td>
                        <td>{new Date(msg.created_at).toLocaleDateString('en-IN')}</td>
                        <td>
                          <span className={`badge badge-${msg.status === 'resolved' ? 'success' : 'warning'}`}>
                            {msg.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button onClick={() => setSelectedMessage(msg)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                              <Eye size={12} /> View
                            </button>
                            {msg.status === 'pending' ? (
                              <button onClick={async () => {
                                await resolveContactMessage(msg.id);
                                reloadData();
                                alert('Inquiry marked resolved.');
                              }} className="btn btn-success btn-sm" style={{ padding: '2px 8px', fontSize: '11px', backgroundColor: 'var(--success)', color: '#fff', border: 'none' }}>
                                Resolve
                              </button>
                            ) : (
                              <span className="badge badge-success" style={{ fontSize: '10px' }}>Resolved</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 10. SYSTEM AUDIT LOGS */}
          {activeTab === 'Audit Logs' && (
            <div className="crm-tab-logs">
              <div className="table-responsive">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User Name</th>
                      <th>Role</th>
                      <th>Audit Action Event</th>
                      <th>Module Name</th>
                      <th>Reference ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td>{new Date(log.created_at).toLocaleString('en-IN')}</td>
                        <td><strong>{log.user_name}</strong></td>
                        <td><span className="badge badge-info">{log.role}</span></td>
                        <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{log.action}</code></td>
                        <td>{log.module}</td>
                        <td className="mono">{log.record_id || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 11. NOTIFICATIONS */}
          {activeTab === 'Notifications' && (
            <div className="crm-tab-notifications">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }} className="no-print">
                <button onClick={async () => {
                  await markNotificationsRead();
                  reloadData();
                  alert('All notifications cleared.');
                }} className="btn btn-outline btn-sm">
                  Mark All As Read
                </button>
              </div>

              <div className="notifications-list">
                {notifications.map(n => (
                  <div key={n.id} className={`card notification-item-card ${!n.read_status ? 'unread' : ''}`} style={{ marginBottom: '12px' }}>
                    <div className="not-dot" style={{ backgroundColor: !n.read_status ? 'var(--accent)' : 'transparent' }}></div>
                    <div className="not-content">
                      <h4>{n.title}</h4>
                      <p>{n.message}</p>
                      <span className="not-date">{new Date(n.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-muted" style={{ fontStyle: 'italic', padding: '20px' }}>No system alerts received.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 13. SETTINGS PANEL */}
          {activeTab === 'Settings' && settings && (
            <div className="crm-tab-settings">
              <div className="grid-2" style={{ gap: '30px' }}>
                <div className="card">
                  <h3>Organization Parameters</h3>
                  <div style={{ marginTop: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Trust Name</label>
                      <input type="text" className="form-control" value={settings.orgName} disabled />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Address</label>
                      <textarea className="form-control" value={settings.orgAddress} onChange={(e) => updateSettings({ orgAddress: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Contact Email</label>
                        <input type="email" className="form-control" value={settings.orgEmail} onChange={(e) => updateSettings({ orgEmail: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Office Phone</label>
                        <input type="text" className="form-control" value={settings.orgPhone} onChange={(e) => updateSettings({ orgPhone: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3>Payment Credentials (Secure Masking)</h3>
                  <div style={{ marginTop: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Payment Gateway Provider</label>
                      <select className="form-control" value={settings.paymentGateway} onChange={(e) => updateSettings({ paymentGateway: e.target.value as any })}>
                        <option value="Razorpay">Razorpay Checkout</option>
                        <option value="Stripe">Stripe Checkout</option>
                        <option value="Cashfree">Cashfree UPI</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gateway API Key Reference</label>
                      <input type="text" className="form-control" value={settings.paymentApiKey} onChange={(e) => updateSettings({ paymentApiKey: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gateway Secret Token (Masked after save)</label>
                      <input type="password" className="form-control" value={settings.paymentSecretKey} onChange={(e) => updateSettings({ paymentSecretKey: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 14. ADMINS ACCOUNT */}
          {activeTab === 'Admins' && (
            <div className="crm-tab-admins">
              <div className="crm-tab-actions-top no-print">
                <button onClick={() => setShowAddAdmin(true)} className="btn btn-primary btn-sm">
                  <Plus size={16} /> Create Sub-Admin Account
                </button>
              </div>

              <div className="table-responsive">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Admin Name</th>
                      <th>Email Account</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Permissions Scope</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminList.map(adm => (
                      <tr key={adm.id}>
                        <td><strong>{adm.name}</strong></td>
                        <td>{adm.email}</td>
                        <td>{adm.phone || '-'}</td>
                        <td><span className="badge badge-info">{adm.role}</span></td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {adm.role === 'super_admin' ? (
                              <span className="badge badge-success">Full Access</span>
                            ) : (
                              (adm.permissions && adm.permissions.length > 0 
                                ? adm.permissions 
                                : ['donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns']
                              ).map(p => (
                                <span key={p} className="badge badge-info" style={{ fontSize: '10px' }}>{p}</span>
                              ))
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${adm.status === 'active' ? 'success' : 'danger'}`}>
                            {adm.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button onClick={() => setSelectedAdmin(adm)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                              <Eye size={12} /> View
                            </button>
                            {adm.role !== 'super_admin' && (
                              <>
                                <button onClick={() => handleOpenEditAdmin(adm)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                                  <Edit size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => {
                                    toggleAdminStatus(adm.id);
                                    reloadData();
                                  }}
                                  className={`btn ${adm.status === 'active' ? 'btn-outline' : 'btn-primary'} btn-sm`}
                                  style={{ padding: '2px 8px', fontSize: '11px' }}
                                >
                                  {adm.status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(adm.id, adm.name)}
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ----------------------------------------------------
         POPUP DETAIL MODALS
         ---------------------------------------------------- */}
      {/* 1. DONOR PROFILE MODAL */}
      {selectedDonor && (
        <div className="modal-overlay no-print" onClick={() => setSelectedDonor(null)}>
          <div className="modal-content crm-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedDonor(null)}>✕</button>
            
            <div className="crm-modal-profile-header">
              <h2>Donor Profile: {selectedDonor.name}</h2>
              <span className="badge badge-info">{selectedDonor.donor_type}</span>
            </div>

            <div className="crm-modal-body-splits grid-2" style={{ marginTop: '20px', gap: '20px' }}>
              <div className="card">
                <h3>Contact Particulars</h3>
                <p><strong>Email Address:</strong> {selectedDonor.email}</p>
                <p><strong>Mobile phone:</strong> {selectedDonor.phone || '-'}</p>
                <p><strong>Physical Address:</strong> {selectedDonor.address || '-'}</p>
                <p><strong>PAN Exemption Card:</strong> <span style={{ textTransform: 'uppercase' }}>{selectedDonor.pan || '-'}</span></p>
              </div>

              <div className="card">
                <h3>Financial Metrics & Plan</h3>
                {(() => {
                  const matched = donations.filter(d => d.donor_id === selectedDonor.id && d.payment_status === 'successful');
                  const sum = matched.reduce((s, d) => s + d.amount, 0);
                  const activePlan = matched[0]?.plan || 'One-Time Contribution';
                  return (
                    <>
                      <p><strong>Total Funds Donated:</strong> <span style={{ color: 'var(--primary)', fontWeight: '800' }}>₹ {sum.toLocaleString('en-IN')}</span></p>
                      <p><strong>Number of Donations:</strong> {matched.length} Txns</p>
                      <p><strong>Active / Chosen Plan:</strong> <span className="badge badge-info">{activePlan}</span></p>
                      <p><strong>Favorite Cause:</strong> {matched[0] ? matched[0].purpose : 'General Fund'}</p>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Donation History Table in Profile */}
            <div style={{ marginTop: '20px' }} className="card">
              <h3 style={{ marginBottom: '12px' }}>Contribution History</h3>
              {(() => {
                const matched = donations.filter(d => d.donor_id === selectedDonor.id);
                if (matched.length === 0) {
                  return <p style={{ fontSize: '13px', color: '#64748b' }}>No donation records found for this donor.</p>;
                }
                return (
                  <div className="table-responsive">
                    <table className="crm-table" style={{ fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Donation ID</th>
                          <th>Amount</th>
                          <th>Cause</th>
                          <th>Chosen Plan</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matched.map(d => (
                          <tr key={d.id}>
                            <td><strong>{d.donation_id}</strong></td>
                            <td><strong>₹ {d.amount.toLocaleString('en-IN')}</strong></td>
                            <td>{d.purpose}</td>
                            <td><span className="badge badge-info">{d.plan || 'One-Time'}</span></td>
                            <td>{new Date(d.created_at).toLocaleDateString('en-IN')}</td>
                            <td>
                              <span className={`badge badge-${d.payment_status === 'successful' ? 'success' : 'warning'}`}>
                                {d.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 2. CASE DETAIL / VERIFY MODAL */}
      {selectedCase && (
        <div className="modal-overlay no-print" onClick={() => setSelectedCase(null)}>
          <div className="modal-content crm-detail-modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCase(null)}>✕</button>

            <div className="crm-modal-profile-header">
              <h2>Verify Case Request: {selectedCase.case_id}</h2>
              <span className={`badge badge-${selectedCase.status === 'assistance_provided' ? 'success' : 'warning'}`}>
                {selectedCase.status.replace('_', ' ')}
              </span>
            </div>

            <div style={{ marginTop: '20px' }} className="card">
              <h3>Applicant details</h3>
              <p><strong>Name:</strong> {selectedCase.name} | <strong>Phone:</strong> {selectedCase.phone}</p>
              <p><strong>Residential Address:</strong> {selectedCase.address}</p>
              <p><strong>Priority Level:</strong> <span className="badge badge-danger">{selectedCase.priority}</span></p>
              <p><strong>Case Category:</strong> {selectedCase.category}</p>
              
              <hr className="receipt-divider" />
              
              <p><strong>Distress Situation Description:</strong></p>
              <p className="text-muted" style={{ fontSize: '13px', fontStyle: 'italic', marginBottom: '12px' }}>{selectedCase.description}</p>
              
              <p><strong>Income Source & Family Status:</strong> {selectedCase.income_info} | {selectedCase.family_info}</p>
              <p><strong>Requested Assistance details:</strong> <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{selectedCase.required_assistance}</span></p>

              <hr className="receipt-divider" />

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <h4>Update Status Case:</h4>
                {['under_review', 'documents_required', 'approved', 'rejected', 'assistance_provided', 'closed'].map(st => (
                  <button
                    key={st}
                    onClick={() => handleCaseStatusChange(selectedCase.id, st as any)}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '11px', textTransform: 'capitalize' }}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. VOLUNTEER DETAIL MODAL */}
      {selectedVol && (
        <div className="modal-overlay no-print" onClick={() => setSelectedVol(null)}>
          <div className="modal-content crm-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedVol(null)}>✕</button>

            <div className="crm-modal-profile-header">
              <h2>Volunteer Application: {selectedVol.volunteer_id}</h2>
              <span className={`badge badge-${selectedVol.status === 'approved' ? 'success' : 'warning'}`}>
                {selectedVol.status}
              </span>
            </div>

            <div style={{ marginTop: '20px' }} className="card">
              <h3>Volunteer Bio</h3>
              <p><strong>Name:</strong> {selectedVol.name} ({selectedVol.age} Years)</p>
              <p><strong>Email:</strong> {selectedVol.email} | <strong>Phone:</strong> {selectedVol.phone}</p>
              <p><strong>Location:</strong> {selectedVol.location} | <strong>Occupation:</strong> {selectedVol.occupation}</p>
              <p><strong>Interests Scope:</strong> {selectedVol.interests.join(', ')}</p>
              <p><strong>Skills listed:</strong> {selectedVol.skills.join(', ')}</p>
              <p><strong>Availability:</strong> {selectedVol.availability}</p>
              <p><strong>Past Experience Notes:</strong> {selectedVol.experience || 'First-time volunteer'}</p>

              <hr className="receipt-divider" />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => handleVolunteerStatusChange(selectedVol.id, 'approved')} className="btn btn-accent btn-sm">
                  Approve Volunteer
                </button>
                <button onClick={() => handleVolunteerStatusChange(selectedVol.id, 'rejected')} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DYNAMIC ADD CAMPAIGN MODAL */}
      {showAddCampaign && (
        <div className="modal-overlay no-print" onClick={() => setShowAddCampaign(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddCampaign(false)}>✕</button>
            
            <form onSubmit={handleCreateCampaignSubmit}>
              <h3>Create Active Crowdfunding Campaign</h3>
              <br />
              <div className="form-group">
                <label className="form-label">Campaign Title *</label>
                <input type="text" className="form-control" required value={newCampTitle} onChange={(e) => setNewCampTitle(e.target.value)} placeholder="e.g., Rural School Digital Classrooms" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Target Funding (INR) *</label>
                  <input type="number" className="form-control" required value={newCampTarget} onChange={(e) => setNewCampTarget(parseFloat(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Allocation Location</label>
                  <input type="text" className="form-control" value={newCampLocation} onChange={(e) => setNewCampLocation(e.target.value)} placeholder="e.g., Trichy, Tamil Nadu" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control" value={newCampStartDate} onChange={(e) => setNewCampStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-control" value={newCampEndDate} onChange={(e) => setNewCampEndDate(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Cover Image URL</label>
                <input type="url" className="form-control" value={newCampCover} onChange={(e) => setNewCampCover(e.target.value)} placeholder="https://images.unsplash.com/..." />
              </div>
              <div className="form-group">
                <label className="form-label">Target Beneficiaries details</label>
                <input type="text" className="form-control" value={newCampBeneficiary} onChange={(e) => setNewCampBeneficiary(e.target.value)} placeholder="e.g., 200 underprivileged village students" />
              </div>
              <div className="form-group">
                <label className="form-label">Campaign Pitch / Description *</label>
                <textarea rows={4} className="form-control" required value={newCampDesc} onChange={(e) => setNewCampDesc(e.target.value)} placeholder="Detailed description of the cause..." />
              </div>
              
              <button type="submit" className="btn btn-primary btn-block">
                Launch Crowdfunding Campaign
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4b. VIEW CAMPAIGN MODAL */}
      {selectedCampaign && (
        <div className="modal-overlay no-print" onClick={() => setSelectedCampaign(null)}>
          <div className="modal-content crm-detail-modal" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCampaign(null)}>✕</button>

            <div className="crm-modal-profile-header">
              <h2>Campaign Details: {selectedCampaign.title}</h2>
              <span className={`badge badge-${selectedCampaign.status === 'active' ? 'success' : selectedCampaign.status === 'completed' ? 'info' : 'warning'}`}>
                {selectedCampaign.status}
              </span>
            </div>

            <div style={{ marginTop: '20px' }}>
              {selectedCampaign.cover_image && (
                <div style={{ width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                  <img src={selectedCampaign.cover_image} alt={selectedCampaign.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div className="grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
                <div className="card" style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Goal</span>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>₹ {selectedCampaign.target_amount.toLocaleString('en-IN')}</p>
                </div>
                <div className="card" style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Raised So Far</span>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success)' }}>₹ {selectedCampaign.raised_amount.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Progress</span>
                  <span style={{ fontWeight: '700' }}>{Math.round((selectedCampaign.raised_amount / selectedCampaign.target_amount) * 100)}%</span>
                </div>
                <div className="progress-bar-bg" style={{ width: '100%', height: '8px' }}>
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100, Math.round((selectedCampaign.raised_amount / selectedCampaign.target_amount) * 100))}%` }}></div>
                </div>
              </div>

              <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                <p><strong>Timeline:</strong> {selectedCampaign.start_date || 'N/A'} to {selectedCampaign.end_date || 'Ongoing'}</p>
                <p><strong>Location:</strong> {selectedCampaign.location || 'Tamil Nadu'}</p>
                {selectedCampaign.beneficiary_info && (
                  <p><strong>Beneficiary Focus:</strong> {selectedCampaign.beneficiary_info}</p>
                )}
                <hr className="receipt-divider" style={{ margin: '12px 0' }} />
                <p><strong>Campaign Pitch:</strong></p>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.6', marginTop: '6px', whiteSpace: 'pre-line' }}>
                  {selectedCampaign.description}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => {
                    handleOpenEditCampaign(selectedCampaign);
                    setSelectedCampaign(null);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  <Edit size={14} /> Edit Campaign
                </button>
                <button onClick={() => setSelectedCampaign(null)} className="btn btn-primary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4c. EDIT CAMPAIGN MODAL */}
      {editingCampaign && (
        <div className="modal-overlay no-print" onClick={() => setEditingCampaign(null)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingCampaign(null)}>✕</button>

            <form onSubmit={handleUpdateCampaignSubmit}>
              <h3>Edit Campaign: {editingCampaign.title}</h3>
              <br />
              <div className="form-group">
                <label className="form-label">Campaign Title *</label>
                <input type="text" className="form-control" required value={editCampTitle} onChange={(e) => setEditCampTitle(e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Target Funding (INR) *</label>
                  <input type="number" className="form-control" required value={editCampTarget} onChange={(e) => setEditCampTarget(parseFloat(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Allocation Location</label>
                  <input type="text" className="form-control" value={editCampLocation} onChange={(e) => setEditCampLocation(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control" value={editCampStartDate} onChange={(e) => setEditCampStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-control" value={editCampEndDate} onChange={(e) => setEditCampEndDate(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={editCampStatus} onChange={(e) => setEditCampStatus(e.target.value as any)}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cover Image URL</label>
                  <input type="url" className="form-control" value={editCampCover} onChange={(e) => setEditCampCover(e.target.value)} placeholder="https://images.unsplash.com/..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Beneficiary Details</label>
                <input type="text" className="form-control" value={editCampBeneficiary} onChange={(e) => setEditCampBeneficiary(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Campaign Pitch / Description *</label>
                <textarea rows={4} className="form-control" required value={editCampDesc} onChange={(e) => setEditCampDesc(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setEditingCampaign(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4d. VIEW PUBLIC INQUIRY MODAL */}
      {selectedMessage && (
        <div className="modal-overlay no-print" onClick={() => setSelectedMessage(null)}>
          <div className="modal-content crm-detail-modal" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedMessage(null)}>✕</button>

            <div className="crm-modal-profile-header">
              <h2>Public Inquiry: {selectedMessage.inquiry_id}</h2>
              <span className={`badge badge-${selectedMessage.status === 'resolved' ? 'success' : 'warning'}`}>
                {selectedMessage.status}
              </span>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                <p><strong>From:</strong> {selectedMessage.name}</p>
                <p><strong>Email Address:</strong> <a href={`mailto:${selectedMessage.email}`} style={{ color: 'var(--primary)' }}>{selectedMessage.email}</a></p>
                <p><strong>Received Date:</strong> {new Date(selectedMessage.created_at).toLocaleString('en-IN')}</p>
                <hr className="receipt-divider" style={{ margin: '12px 0' }} />
                <p><strong>Subject:</strong></p>
                <p style={{ fontWeight: '700', color: 'var(--text-main)', marginTop: '4px', fontSize: '15px' }}>{selectedMessage.subject}</p>
                <hr className="receipt-divider" style={{ margin: '12px 0' }} />
                <p><strong>Message Content:</strong></p>
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '8px', lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                  {selectedMessage.message}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {selectedMessage.status === 'pending' && (
                  <button
                    onClick={async () => {
                      await resolveContactMessage(selectedMessage.id);
                      setSelectedMessage(null);
                      reloadData();
                      alert('Inquiry marked as resolved.');
                    }}
                    className="btn btn-success btn-sm"
                    style={{ backgroundColor: 'var(--success)', color: '#fff', border: 'none' }}
                  >
                    Mark as Resolved
                  </button>
                )}
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                  className="btn btn-outline btn-sm"
                >
                  Reply via Email
                </a>
                <button onClick={() => setSelectedMessage(null)} className="btn btn-primary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DYNAMIC ADD SUB ADMIN MODAL */}
      {showAddAdmin && (
        <div className="modal-overlay no-print" onClick={() => setShowAddAdmin(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddAdmin(false)}>✕</button>
            
            <form onSubmit={handleCreateAdminSubmit}>
              <h3>Create Sub-Admin Account</h3>
              <br />
              <div className="form-group">
                <label className="form-label">Admin Full Name *</label>
                <input type="text" className="form-control" required value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Account *</label>
                <input type="email" className="form-control" required value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Support</label>
                <input type="text" className="form-control" value={newAdminPhone} onChange={(e) => setNewAdminPhone(e.target.value)} />
              </div>
              
              <div className="form-group">
                <label className="form-label">Permissions Scope</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {['donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns', 'reports', 'content'].map(p => (
                    <label key={p} className="form-check" style={{ fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={newAdminPerms.includes(p)}
                        onChange={(e) => {
                          if (e.target.checked) setNewAdminPerms([...newAdminPerms, p]);
                          else setNewAdminPerms(newAdminPerms.filter(pm => pm !== p));
                        }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Register Sub-Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5b. VIEW SUB-ADMIN MODAL */}
      {selectedAdmin && (
        <div className="modal-overlay no-print" onClick={() => setSelectedAdmin(null)}>
          <div className="modal-content crm-detail-modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedAdmin(null)}>✕</button>

            <div className="crm-modal-profile-header">
              <h2>Admin Profile: {selectedAdmin.name}</h2>
              <span className={`badge badge-${selectedAdmin.status === 'active' ? 'success' : 'danger'}`}>
                {selectedAdmin.status}
              </span>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                <p><strong>Email Address:</strong> {selectedAdmin.email}</p>
                <p><strong>Contact Phone:</strong> {selectedAdmin.phone || 'Not provided'}</p>
                <p><strong>System Role:</strong> <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{selectedAdmin.role.replace('_', ' ')}</span></p>
                <hr className="receipt-divider" style={{ margin: '12px 0' }} />
                <p style={{ marginBottom: '8px' }}><strong>Assigned Permissions:</strong></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedAdmin.role === 'super_admin' ? (
                    <span className="badge badge-success">Full System Administration</span>
                  ) : (
                    (selectedAdmin.permissions && selectedAdmin.permissions.length > 0
                      ? selectedAdmin.permissions
                      : ['donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns']
                    ).map(p => (
                      <span key={p} className="badge badge-info" style={{ fontSize: '11px', textTransform: 'capitalize' }}>{p}</span>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {selectedAdmin.role !== 'super_admin' && (
                  <button
                    onClick={() => {
                      handleOpenEditAdmin(selectedAdmin);
                      setSelectedAdmin(null);
                    }}
                    className="btn btn-outline btn-sm"
                  >
                    <Edit size={14} /> Edit Admin
                  </button>
                )}
                <button onClick={() => setSelectedAdmin(null)} className="btn btn-primary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5c. EDIT SUB-ADMIN MODAL */}
      {editingAdmin && (
        <div className="modal-overlay no-print" onClick={() => setEditingAdmin(null)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingAdmin(null)}>✕</button>

            <form onSubmit={handleUpdateAdminSubmit}>
              <h3>Edit Sub-Admin: {editingAdmin.name}</h3>
              <br />
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-control" required value={editAdminName} onChange={(e) => setEditAdminName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" className="form-control" required value={editAdminEmail} onChange={(e) => setEditAdminEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input type="text" className="form-control" value={editAdminPhone} onChange={(e) => setEditAdminPhone(e.target.value)} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control" value={editAdminRole} onChange={(e) => setEditAdminRole(e.target.value as any)}>
                    <option value="sub_admin">Sub Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={editAdminStatus} onChange={(e) => setEditAdminStatus(e.target.value as any)}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {editAdminRole !== 'super_admin' && (
                <div className="form-group">
                  <label className="form-label">Permissions Scope</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {['donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns', 'reports', 'content'].map(p => (
                      <label key={p} className="form-check" style={{ fontSize: '13px' }}>
                        <input
                          type="checkbox"
                          checked={editAdminPerms.includes(p)}
                          onChange={(e) => {
                            if (e.target.checked) setEditAdminPerms([...editAdminPerms, p]);
                            else setEditAdminPerms(editAdminPerms.filter(pm => pm !== p));
                          }}
                        />
                        <span style={{ textTransform: 'capitalize' }}>{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setEditingAdmin(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DYNAMIC RECEIPTS MODAL */}
      {selectedReceiptDon && settings && (
        <ReceiptPDF
          donation={selectedReceiptDon}
          donor={donors.find(d => d.id === selectedReceiptDon.donor_id) || {
            id: 'guest',
            name: 'Guest Donor',
            email: 'guest@example.com',
            donor_type: 'New Donor',
            created_at: new Date().toISOString()
          }}
          settings={settings}
          onClose={() => setSelectedReceiptDon(null)}
        />
      )}

      {/* 7. GOOGLE DRIVE FOLDER CONFIGURATION MODAL */}
      {showDriveConfigModal && (
        <div className="modal-overlay no-print" onClick={() => setShowDriveConfigModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDriveConfigModal(false)}>✕</button>

            <form onSubmit={handleSaveDriveConfig}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <FolderOpen size={24} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>Google Drive Storage Settings</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Configure the destination Google Drive folder where media gallery photos and videos are stored and indexed.
              </p>

              <div className="form-group">
                <label className="form-label">Google Drive Folder Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={driveFolderName}
                  onChange={(e) => setDriveFolderName(e.target.value)}
                  placeholder="e.g., Deivakaram_Public_Media_Vault"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Google Drive Folder ID *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs"
                />
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', marginTop: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#166534', margin: 0, lineHeight: '1.4' }}>
                    <strong>💡 How to get Folder ID from your Google Drive tab:</strong> Look at your browser address bar while inside <code>My Drive &gt; Deivakaram_Public_Med...</code>:
                    <br />
                    <code style={{ fontSize: '11px', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                      drive.google.com/drive/folders/<b>[COPY_THIS_PART]</b>
                    </code>
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Google Apps Script Webhook URL (For Direct Drive Write)</label>
                <input
                  type="url"
                  className="form-control"
                  value={driveWebhookUrl}
                  onChange={(e) => setDriveWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
                <small style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Enables 100% free serverless file writing directly into your Google Drive folder.
                </small>

                <button
                  type="button"
                  onClick={() => {
                    const script = `function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Deivakaram Drive Vault Webhook is working!",
    folderId: "${sanitizeDriveFolderId(driveFolderId)}"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var targetFolderId = data.folderId || "${sanitizeDriveFolderId(driveFolderId)}";
    var folder = DriveApp.getFolderById(targetFolderId);
    var bytes = Utilities.base64Decode(data.base64Data);
    var blob = Utilities.newBlob(bytes, data.mimeType, data.fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return ContentService.createTextOutput(JSON.stringify({ status: "success", id: file.getId(), name: file.getName() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                    navigator.clipboard.writeText(script);
                    alert('Google Apps Script copied to clipboard! Paste it into script.google.com and deploy as Web App (Execute as: Me, Who has access: Anyone).');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '11.5px', marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Copy size={12} /> Copy Ready-Made Google Apps Script for this Folder
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                <a
                  href={`https://drive.google.com/drive/folders/${sanitizeDriveFolderId(driveFolderId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  Test Link in Drive ↗
                </a>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowDriveConfigModal(false)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Drive Settings
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. GOOGLE DRIVE SETUP GUIDE MODAL */}
      {showDriveHelpModal && (
        <div className="modal-overlay no-print" onClick={() => setShowDriveHelpModal(false)}>
          <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDriveHelpModal(false)}>✕</button>

            <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={22} color="var(--primary)" /> How Google Drive Media Storage Works
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
              Deivakaram CRM allows you to drag-and-drop event pictures and relief videos directly into your Google Drive cloud repository, keeping website hosting costs zero and cloud assets permanently backed up.
            </p>

            <div className="card" style={{ backgroundColor: '#f8fafc', padding: '16px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--primary)' }}>Step 1: Get your Folder ID</h4>
              <ol style={{ fontSize: '13px', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
                <li>Open Google Drive (<a href="https://drive.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>drive.google.com</a>).</li>
                <li>Create a folder (e.g. <code>Deivakaram_Trust_Media</code>).</li>
                <li>Right-click the folder &gt; <strong>Share</strong> &gt; Set General access to <strong>"Anyone with the link can view"</strong>.</li>
                <li>Copy the Folder ID from the URL bar (e.g. <code>{sanitizeDriveFolderId(driveFolderId)}</code>).</li>
                <li>Paste it in <strong>Drive Settings</strong> in the CRM.</li>
              </ol>
            </div>

            <div className="card" style={{ backgroundColor: '#f8fafc', padding: '16px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--primary)' }}>Step 2: Google Apps Script for Direct Serverless Drive Upload</h4>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                To save files physically into your Google Drive with zero setup fees, paste this script into <a href="https://script.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>script.google.com</a> and deploy as Web App:
              </p>
              <pre style={{ backgroundColor: '#1e293b', color: '#e2e8f0', padding: '12px', borderRadius: '6px', fontSize: '11px', overflowX: 'auto' }}>
{`function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Deivakaram Drive Vault Webhook is working!",
    folderId: "${sanitizeDriveFolderId(driveFolderId)}"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var targetFolderId = data.folderId || "${sanitizeDriveFolderId(driveFolderId)}";
    var folder = DriveApp.getFolderById(targetFolderId);
    var blob = Utilities.newBlob(Utilities.base64Decode(data.base64Data), data.mimeType, data.fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return ContentService.createTextOutput(JSON.stringify({ status: "success", id: file.getId(), name: file.getName() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
              </pre>
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px 12px', marginTop: '10px' }}>
                <p style={{ fontSize: '11.5px', color: '#1e40af', margin: 0, lineHeight: '1.4' }}>
                  <strong>⚠️ Critical Deployment Setting:</strong> In the Deploy popup:
                  <br />• <strong>Execute as:</strong> Me
                  <br />• <strong>Who has access:</strong> <span style={{ color: '#dc2626', fontWeight: '700' }}>Anyone</span> (Do NOT leave as "Only myself", otherwise Google blocks external uploads).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDriveHelpModal(false)} className="btn btn-primary btn-sm">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MEDIA DETAIL / LIGHTBOX MODAL */}
      {selectedGalleryMedia && (
        <div className="modal-overlay no-print" onClick={() => setSelectedGalleryMedia(null)} style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '800px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedGalleryMedia(null)}>✕</button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '4px' }}>
                  {selectedGalleryMedia.title}
                </h3>
                <span className="badge badge-info">{selectedGalleryMedia.category}</span>
              </div>
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> Synced to Google Drive
              </span>
            </div>

            <div style={{ width: '100%', maxHeight: '420px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <img src={selectedGalleryMedia.url} alt={selectedGalleryMedia.title} style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }} />
            </div>

            <div className="card" style={{ padding: '16px', backgroundColor: '#f8fafc', marginBottom: '16px' }}>
              <p><strong>File Name:</strong> {selectedGalleryMedia.file_name || 'media_asset.jpg'}</p>
              <p><strong>Google Drive File ID:</strong> <code style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{selectedGalleryMedia.google_drive_file_id}</code></p>
              <p><strong>Target Drive Folder:</strong> <code style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{selectedGalleryMedia.google_drive_folder_id || driveFolderId}</code></p>
              <p><strong>Upload Date:</strong> {new Date(selectedGalleryMedia.created_at).toLocaleString('en-IN')}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={`https://drive.google.com/drive/folders/${selectedGalleryMedia.google_drive_folder_id || driveFolderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} /> Open Folder in Google Drive ↗
                </a>
                <a
                  href={selectedGalleryMedia.url}
                  download={selectedGalleryMedia.file_name || 'deivakaram_media.jpg'}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} /> Download Asset
                </a>
              </div>

              <button onClick={() => setSelectedGalleryMedia(null)} className="btn btn-primary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. CELEBRATION BOOKING DETAIL MODAL */}
      {selectedCelebration && (
        <div className="modal-overlay no-print" onClick={() => setSelectedCelebration(null)}>
          <div className="modal-content crm-detail-modal" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCelebration(null)}>✕</button>

            <div className="crm-modal-profile-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2>Celebration Booking #{selectedCelebration.booking_id}</h2>
                  <span className={`badge badge-${(selectedCelebration.status || selectedCelebration.booking_status) === 'confirmed' ? 'success' : (selectedCelebration.status || selectedCelebration.booking_status) === 'banner_printed' ? 'warning' : 'info'}`}>
                    {(selectedCelebration.status || selectedCelebration.booking_status || 'confirmed').replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Occasion: <strong>{selectedCelebration.occasion || selectedCelebration.occasion_type}</strong> of <strong>{selectedCelebration.celebrant_name}</strong> on <strong>{selectedCelebration.occasion_date}</strong>
                </p>
              </div>
              <button
                onClick={() => handleCelebrationWhatsApp(selectedCelebration)}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#16a34a', borderColor: '#16a34a' }}
              >
                <MessageCircle size={14} /> WhatsApp Client
              </button>
            </div>

            {/* BANNER PHOTO PREVIEW WITH PRINT DOWNLOAD BUTTON */}
            {Boolean(selectedCelebration.banner_image_url || selectedCelebration.banner_photo_url) && (
              <div className="card" style={{ backgroundColor: '#0f172a', padding: '16px', marginTop: '16px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12.5px', color: '#e2e8f0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Image size={15} color="#38bdf8" /> Uploaded Banner Photo for Printing
                  </span>
                  <button
                    onClick={() => handleDownloadBannerPhoto(selectedCelebration.banner_image_url || selectedCelebration.banner_photo_url || '', `Banner_${selectedCelebration.celebrant_name.replace(/\s+/g, '_')}_${selectedCelebration.booking_id}.jpg`)}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={13} /> Download Photo for Flex Print
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: '280px', overflow: 'hidden', borderRadius: '8px', backgroundColor: '#020617' }}>
                  <img
                    src={selectedCelebration.banner_image_url || selectedCelebration.banner_photo_url}
                    alt={selectedCelebration.celebrant_name}
                    style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain', cursor: 'pointer' }}
                    onClick={() => setViewingBannerImage(selectedCelebration.banner_image_url || selectedCelebration.banner_photo_url || '')}
                    title="Click to view full screen"
                  />
                </div>
              </div>
            )}

            <div className="crm-modal-body-splits grid-2" style={{ marginTop: '16px', gap: '16px' }}>
              <div className="card">
                <h3>Client / Donor Particulars</h3>
                <p><strong>Name:</strong> {selectedCelebration.donor_name || selectedCelebration.customer_name}</p>
                <p><strong>Phone:</strong> {selectedCelebration.donor_phone || selectedCelebration.customer_phone}</p>
                <p><strong>Email:</strong> {selectedCelebration.donor_email || selectedCelebration.customer_email || '-'}</p>
                <p><strong>PAN:</strong> <span style={{ textTransform: 'uppercase' }}>{selectedCelebration.donor_pan || '-'}</span></p>
                <p><strong>Booking Timestamp:</strong> {new Date(selectedCelebration.created_at).toLocaleString('en-IN')}</p>
              </div>

              <div className="card">
                <h3>Celebration & Feast Package</h3>
                <p><strong>Package:</strong> {selectedCelebration.package_name}</p>
                <p><strong>Food Count:</strong> <span className="badge badge-success">{selectedCelebration.food_count} Meals</span></p>
                <p><strong>Selected Add-ons:</strong> {selectedCelebration.addons_selected && selectedCelebration.addons_selected.length > 0 ? selectedCelebration.addons_selected.join(', ') : 'None'}</p>
                <p><strong>Virtual Meet:</strong> {selectedCelebration.virtual_celebration || selectedCelebration.is_virtual ? `Yes (${selectedCelebration.virtual_time_slot || 'Slot TBD'})` : 'No'}</p>
                <p><strong>Special Notes:</strong> {selectedCelebration.special_instructions || selectedCelebration.notes || 'None'}</p>
              </div>
            </div>

            <div className="card" style={{ marginTop: '16px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--text-main)' }}>
                    Payment & Razorpay Settlement
                  </h4>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Payment ID: <code className="mono">{selectedCelebration.payment_id || selectedCelebration.razorpay_payment_id || 'N/A'}</code>
                    {(selectedCelebration.order_id || selectedCelebration.razorpay_order_id) && <> | Order ID: <code className="mono">{selectedCelebration.order_id || selectedCelebration.razorpay_order_id}</code></>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                    ₹ {(selectedCelebration.amount ?? selectedCelebration.total_amount ?? 0).toLocaleString('en-IN')}
                  </div>
                  <span className={`badge badge-${selectedCelebration.payment_status === 'successful' ? 'success' : 'danger'}`}>
                    Payment: {selectedCelebration.payment_status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* STATUS SELECTOR ROW */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>Update Booking Status:</label>
                {(['confirmed', 'banner_printed', 'completed', 'cancelled'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => handleUpdateCelebrationStatus(selectedCelebration.id, st)}
                    className={`btn btn-sm ${selectedCelebration.status === st ? 'btn-primary' : 'btn-outline'}`}
                    style={{ textTransform: 'capitalize', fontSize: '12px' }}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <button onClick={() => setSelectedCelebration(null)} className="btn btn-outline btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. BANNER IMAGE LIGHTBOX MODAL */}
      {viewingBannerImage && (
        <div className="modal-overlay no-print" onClick={() => setViewingBannerImage(null)} style={{ zIndex: 1250 }}>
          <div className="modal-content" style={{ maxWidth: '850px', backgroundColor: '#090d16', color: '#fff', padding: '20px', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setViewingBannerImage(null)} style={{ color: '#fff' }}>✕</button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Image size={18} /> High-Resolution Banner Photo for Printing
              </h3>
              <button
                onClick={() => handleDownloadBannerPhoto(viewingBannerImage, `banner_photo_${Date.now()}.jpg`)}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> Download Image
              </button>
            </div>

            <div style={{ width: '100%', maxHeight: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '8px', backgroundColor: '#020617' }}>
              <img src={viewingBannerImage} alt="Full Banner Preview" style={{ maxWidth: '100%', maxHeight: '520px', objectFit: 'contain' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #1e293b' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Suitable for flex printing (recommended minimum 3ft x 2ft banner)
              </span>
              <button onClick={() => setViewingBannerImage(null)} className="btn btn-outline btn-sm" style={{ color: '#fff', borderColor: '#475569' }}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. CREATE / EDIT PACKAGE MODAL */}
      {showAddPackageModal && (
        <div className="modal-overlay no-print" onClick={() => setShowAddPackageModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddPackageModal(false)}>✕</button>

            <form onSubmit={handleSavePackageSubmit}>
              <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '16px' }}>
                {editingPackage ? `Edit Package: ${editingPackage.title}` : 'Create Celebration Package'}
              </h3>

              <div className="form-group">
                <label className="form-label">Package Title *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Silver Celebration, Golden Feast"
                  value={pkgTitle}
                  onChange={(e) => setPkgTitle(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Base Price (INR) *</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    min={100}
                    value={pkgBasePrice}
                    onChange={(e) => setPkgBasePrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum Meals *</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    min={1}
                    value={pkgMinMeals}
                    onChange={(e) => setPkgMinMeals(parseInt(e.target.value) || 25)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Package Description</label>
                <textarea
                  rows={2}
                  className="form-control"
                  placeholder="Brief summary of what this celebration package covers"
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Inclusions (One per line) *</label>
                <textarea
                  rows={4}
                  className="form-control"
                  required
                  placeholder="Special Meals for 25 Elders&#10;Customized Name Banner&#10;Celebration Photos"
                  value={pkgInclusionsText}
                  onChange={(e) => setPkgInclusionsText(e.target.value)}
                />
              </div>

              <div className="form-row" style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={pkgIsPopular}
                    onChange={(e) => setPkgIsPopular(e.target.checked)}
                  />
                  <strong>Mark as Most Popular</strong>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={pkgIsActive}
                    onChange={(e) => setPkgIsActive(e.target.checked)}
                  />
                  <strong>Active (Visible on Website)</strong>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowAddPackageModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPackage ? 'Update Package' : 'Save New Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 13. CREATE / EDIT ADD-ON MODAL */}
      {showAddAddonModal && (
        <div className="modal-overlay no-print" onClick={() => setShowAddAddonModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddAddonModal(false)}>✕</button>

            <form onSubmit={handleSaveAddonSubmit}>
              <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '16px' }}>
                {editingAddon ? `Edit Add-on: ${editingAddon.name}` : 'Add Celebration Festive Add-on'}
              </h3>

              <div className="form-group">
                <label className="form-label">Add-on Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Birthday Cake (1kg), Shawls for Elders"
                  value={addonName}
                  onChange={(e) => setAddonName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Unit Price (INR) *</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    min={0}
                    value={addonPrice}
                    onChange={(e) => setAddonPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit / Packaging</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. per cake, per elder, per pack"
                    value={addonUnit}
                    onChange={(e) => setAddonUnit(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Short Description</label>
                <textarea
                  rows={2}
                  className="form-control"
                  placeholder="Details about quality, flavor or seva presentation"
                  value={addonDesc}
                  onChange={(e) => setAddonDesc(e.target.value)}
                />
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={addonIsActive}
                    onChange={(e) => setAddonIsActive(e.target.checked)}
                  />
                  <strong>Active (Available for booking)</strong>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowAddAddonModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAddon ? 'Update Add-on' : 'Save Add-on'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EVENT MODAL */}
      {showAddEvent && (
        <div className="modal-overlay no-print" onClick={() => setShowAddEvent(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <button className="modal-close" onClick={() => setShowAddEvent(false)}>✕</button>
            <div className="modal-header">
              <h3>Create Trust Event</h3>
              <p>Schedule a new field program or community gathering</p>
            </div>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label className="form-label">Event Title *</label>
                <input required type="text" className="form-control" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} placeholder="e.g. Free Eye Diagnostics & Treatment Camp" />
              </div>
              <div>
                <label className="form-label">Description *</label>
                <textarea required rows={3} className="form-control" value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} placeholder="Summary of the event activities and objectives..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Event Date *</label>
                  <input required type="date" className="form-control" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Time String *</label>
                  <input required type="text" className="form-control" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} placeholder="9:00 AM – 2:00 PM" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Location *</label>
                  <input required type="text" className="form-control" value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)} placeholder="e.g. Madurai Rural Center" />
                </div>
                <div>
                  <label className="form-label">Volunteers Required</label>
                  <input type="number" min={0} className="form-control" value={newEventVolReq} onChange={e => setNewEventVolReq(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="form-label">Cover Image URL</label>
                <input type="url" className="form-control" value={newEventCover} onChange={e => setNewEventCover(e.target.value)} placeholder="https://images.unsplash.com/..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddEvent(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEWS MODAL */}
      {showAddNews && (
        <div className="modal-overlay no-print" onClick={() => setShowAddNews(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <button className="modal-close" onClick={() => setShowAddNews(false)}>✕</button>
            <div className="modal-header">
              <h3>Publish Press Bulletin</h3>
              <p>Post an official trust announcement or milestone update</p>
            </div>
            <form onSubmit={handleCreateNews} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label className="form-label">Headline / Title *</label>
                <input required type="text" className="form-control" value={newNewsTitle} onChange={e => setNewNewsTitle(e.target.value)} placeholder="e.g. Over 150 Students Conferred Higher Education Scholarships" />
              </div>
              <div>
                <label className="form-label">Category *</label>
                <select className="form-control" value={newNewsCategory} onChange={e => setNewNewsCategory(e.target.value as any)}>
                  <option value="Education Support">Education Support</option>
                  <option value="Healthcare Support">Healthcare Support</option>
                  <option value="Women Empowerment">Women Empowerment</option>
                  <option value="General">General</option>
                  <option value="Community Welfare">Community Welfare</option>
                  <option value="Elder Care">Elder Care</option>
                </select>
              </div>
              <div>
                <label className="form-label">Article Summary / Content *</label>
                <textarea required rows={4} className="form-control" value={newNewsDesc} onChange={e => setNewNewsDesc(e.target.value)} placeholder="Details of the announcement, beneficiary count, outcomes..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Publish Date</label>
                  <input required type="date" className="form-control" value={newNewsDate} onChange={e => setNewNewsDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Author Name</label>
                  <input required type="text" className="form-control" value={newNewsAuthor} onChange={e => setNewNewsAuthor(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label">Cover Image URL</label>
                <input type="url" className="form-control" value={newNewsImage} onChange={e => setNewNewsImage(e.target.value)} placeholder="https://images.unsplash.com/..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddNews(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        /* CRM Panel Specific Styles */
        .crm-global-search {
          position: relative;
          max-width: 400px;
          width: 100%;
        }
        .crm-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-light);
        }
        .crm-search-input {
          width: 100%;
          padding: 10px 16px 10px 42px;
          font-size: 13.5px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-secondary);
          transition: var(--transition-fast);
        }
        .crm-search-input:focus {
          background-color: #fff;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(10, 74, 156, 0.1);
        }
        
        .crm-filter-header {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 30px;
          background-color: #fff;
          padding: 16px 24px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .filter-group-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-group-row label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .filter-btn {
          padding: 6px 12px;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .filter-btn.active, .filter-btn:hover {
          background-color: var(--bg-primary-light);
          color: var(--primary);
          border-color: var(--primary);
        }
        .btn-export {
          margin-left: auto;
        }
        
        /* Modal Profile details */
        .crm-detail-modal {
          max-width: 600px;
        }
        .crm-modal-profile-header {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .crm-modal-profile-header h2 {
          font-size: 18px;
          color: var(--primary);
        }
        .crm-modal-body-splits p {
          font-size: 13.5px;
          margin-bottom: 10px;
          line-height: 1.5;
        }
        
        /* Notifications List styling */
        .notification-item-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px 20px;
          border-left: 4px solid var(--border-color);
        }
        .notification-item-card.unread {
          background-color: var(--bg-primary-light);
          border-left-color: var(--primary);
        }
        .not-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-round);
          flex-shrink: 0;
          margin-top: 6px;
        }
        .not-content h4 {
          font-size: 14px;
          color: var(--text-main);
          margin-bottom: 2px;
        }
        .not-content p {
          font-size: 12.5px;
          color: var(--text-muted);
          margin-bottom: 4px;
          line-height: 1.4;
        }
        .not-date {
          font-size: 11px;
          color: var(--text-light);
        }
        .btn-table-link {
          background: transparent;
          border: none;
          color: var(--primary);
          font-weight: 700;
          cursor: pointer;
        }
        .btn-table-link:hover {
          color: var(--accent);
          text-decoration: underline;
        }

        .crm-gallery-dropzone:hover {
          border-color: var(--primary) !important;
          background-color: #f1f5f9 !important;
        }
        .crm-gallery-dropzone.is-drag-active {
          border-color: var(--primary) !important;
          background-color: #eff6ff !important;
          transform: scale(1.005);
        }
      `}</style>
    </div>
  );
};
export default CRMPortal;
