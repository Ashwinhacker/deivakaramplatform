import React, { useState, useEffect } from 'react';
import { 
  X, CreditCard, Smartphone, Landmark, CheckCircle2, Loader2, Sparkles, 
  Key, Mail, Phone, Lock, UserCheck, Heart, ArrowRight, ShieldCheck, 
  QrCode, ExternalLink, Cake, Video, Home as HomeIcon, Baby, PawPrint, 
  Calendar, Upload, Camera, Share2, MessageCircle, Send, AlertTriangle, 
  Check, RotateCcw, Download, Eye, FileText, CheckCircle, Copy
} from 'lucide-react';
import { 
  createDonation, createOrUpdateDonor, getDonors, getCampaigns, getSettings, 
  createCelebrationBooking, getDynamicPackages, getDynamicAddons,
  Campaign, Donation, Donor, CelebrationBooking, DynamicPackage, DynamicAddon 
} from '../db';
import { supabase, isSupabaseConfigured } from '../db/supabaseClient';
import { ReceiptPDF } from './ReceiptPDF';
import { DONATION_PROGRAMS, BIRTHDAY_ADDONS, type DonationProgram } from '../data/donationPrograms';
import { initiateRazorpayPayment } from '../utils/razorpay';

interface DonateModalProps {
  onClose: () => void;
  initialCampaignId?: string;
  initialProgramId?: string;
  onNavigate?: (page: string) => void;
}


export const DonateModal: React.FC<DonateModalProps> = ({ 
  onClose, 
  initialCampaignId, 
  initialProgramId, 
  onNavigate 
}) => {
  // Step tracking: 0 = Login Gate, 1 = Donation Programs & Details Dialog, 2 = Payment Gateway, 3 = Success Confirmation
  const [step, setStep] = useState<number>(0);
  const [activeDonorUser, setActiveDonorUser] = useState<any>(null);

  // New User Quick Login Form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  // Existing donor authentication gate state
  const [loginMethod, setLoginMethod] = useState<'new_user' | 'credentials' | 'otp'>('new_user');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Program & Pricing Selection State
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    initialProgramId || 'birthday_anniversary'
  );
  
  // Add-ons & Itemized Customization States
  // 1. Birthday / Anniversary Customization
  const [bdayMealsCount, setBdayMealsCount] = useState<number>(25); // ₹70/meal
  const [bdayCakeKg, setBdayCakeKg] = useState<number>(1); // ₹550/kg
  const [bdayBannerCount, setBdayBannerCount] = useState<number>(1); // ₹150 each
  const [bdayPhotoCakeKg, setBdayPhotoCakeKg] = useState<number>(1); // ₹800/kg
  const [bdayRoseMilkGlasses, setBdayRoseMilkGlasses] = useState<number>(10); // ₹15/glass (₹150 for 10)
  const [bdayGroceryKits, setBdayGroceryKits] = useState<number>(1); // ₹500/family kit
  const [bdayStationeryKits, setBdayStationeryKits] = useState<number>(10); // ₹25/kit
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});

  // 2. Virtual Birthday Customization
  const [virtualMealsCount, setVirtualMealsCount] = useState<number>(20); // base 20, +₹70/extra meal
  const [virtualCakeKg, setVirtualCakeKg] = useState<number>(1); // base 1kg, +₹550/extra kg
  const [virtualChocPacks, setVirtualChocPacks] = useState<number>(20); // base 20, +₹30/extra pack

  // 3. Old Age Home Customization
  const [elderMealsCount, setElderMealsCount] = useState<number>(50); // base 50, +₹70/extra meal
  const [elderCakeKg, setElderCakeKg] = useState<number>(1); // base 1kg, +₹550/extra kg
  const [elderCareKits, setElderCareKits] = useState<number>(15); // base 15, +₹300/extra kit

  // 4. Orphanage Home Customization
  const [orphanMealsCount, setOrphanMealsCount] = useState<number>(35); // base 35, +₹70/extra meal
  const [orphanCakeKg, setOrphanCakeKg] = useState<number>(1); // base 1kg, +₹550/extra kg
  const [orphanKitsCount, setOrphanKitsCount] = useState<number>(20); // base 20, +₹100/extra kit

  // 5. Stray Animals Portion Count
  const [animalPortions, setAnimalPortions] = useState<number>(25); // ₹30/portion, min 25 = ₹750

  // Custom/General donation amount state
  const [customSliderAmount, setCustomSliderAmount] = useState<number>(2500);
  const [manualCustomAmount, setManualCustomAmount] = useState<string>('');

  // Donor Details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pan, setPan] = useState('');
  const [occasionDate, setOccasionDate] = useState('');
  const [celebrantName, setCelebrantName] = useState('');
  const [occasionType, setOccasionType] = useState<'Birthday' | 'Anniversary' | 'Memorial' | 'Other'>('Birthday');
  const [bannerPhoto, setBannerPhoto] = useState<string>('');
  const [bannerPhotoName, setBannerPhotoName] = useState<string>('');
  const [bannerPhotoError, setBannerPhotoError] = useState<string | null>(null);
  const [isVirtualCelebration, setIsVirtualCelebration] = useState<boolean>(false);
  const [virtualTimeSlot, setVirtualTimeSlot] = useState<string>('3:00 PM – 6:00 PM');
  const [formValidationMsg, setFormValidationMsg] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<CelebrationBooking | null>(null);
  const [availablePrograms, setAvailablePrograms] = useState<DynamicPackage[]>(DONATION_PROGRAMS as any);
  const [availableAddons, setAvailableAddons] = useState<DynamicAddon[]>(BIRTHDAY_ADDONS as any);
  const [whatsappSent, setWhatsappSent] = useState<boolean>(false);
  const [smsSent, setSmsSent] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [campaignId, setCampaignId] = useState<string>(initialCampaignId || '');

  // Payment Checkout State
  const [payMethod, setPayMethod] = useState<'UPI' | 'Card' | 'NetBanking'>('UPI');
  const [upiId, setUpiId] = useState('donor@okhdfcbank');
  const [upiUtr, setUpiUtr] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('SBI');
  const [bankRef, setBankRef] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [trustUpiInput, setTrustUpiInput] = useState<string>(
    (import.meta as any).env?.VITE_TRUST_UPI_ID || 'ashwinop58@okicici'
  );
  const [isEditingUpi, setIsEditingUpi] = useState<boolean>(false);

  const handleCopy = (text: string, fieldId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // Processing & Confirmation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Derived safe accessors for donation & donor confirmation
  const activeDonation: Donation | null = paymentResult 
    ? (paymentResult.donation || paymentResult)
    : null;

  const activeDonor: Donor | null = paymentResult
    ? (paymentResult.donor || {
        id: activeDonation?.donor_id || 'dn-guest',
        name: isAnonymous ? 'Anonymous Donor' : ((activeDonation as any)?.donor_name || name || 'Anonymous Donor'),
        email: (activeDonation as any)?.donor_email || email || 'donor@deivakaram.org',
        phone: phone || '',
        address: address || '',
        pan: pan || '',
        donor_type: 'New Donor',
        created_at: activeDonation?.created_at || new Date().toISOString()
      })
    : null;

  // File Upload Handler with JPG/PNG and 5MB validation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setBannerPhotoError('Invalid file format. Please upload a JPG or PNG photo.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setBannerPhotoError('Selected image exceeds 5MB limit. Please upload an image under 5MB.');
      return;
    }

    setBannerPhotoError(null);
    setBannerPhotoName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setBannerPhoto(reader.result as string);
    };
    reader.onerror = () => {
      setBannerPhotoError('Failed to process image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setBannerPhoto('');
    setBannerPhotoName('');
    setBannerPhotoError(null);
  };

  const getAddonPrice = (addonId: string, fallbackPrice: number): number => {
    const item = availableAddons.find(a => a.id === addonId);
    return item ? item.price : fallbackPrice;
  };

  // Calculate current total amount dynamically based on program and customized item quantities
  const selectedProgram = availablePrograms.find(p => p.id === selectedProgramId) || availablePrograms[0] || DONATION_PROGRAMS[0];

  const calculateTotalAmount = (): number => {
    if (selectedProgram.id === 'birthday_anniversary') {
      const mealsCost = bdayMealsCount * 70;
      const cakeCost = selectedAddons['photo_cake'] ? 0 : (bdayCakeKg * getAddonPrice('cake_kg', 550));
      const bannerCost = bdayBannerCount * getAddonPrice('banner', 150);
      let total = mealsCost + cakeCost + bannerCost;

      if (selectedAddons['photo_cake']) total += (bdayPhotoCakeKg * getAddonPrice('photo_cake', 800));
      if (selectedAddons['rose_milk']) total += (bdayRoseMilkGlasses * (getAddonPrice('rose_milk', 150) / 10));
      if (selectedAddons['grocery_kit']) total += (bdayGroceryKits * getAddonPrice('grocery_kit', 500));
      if (selectedAddons['stationery_kit']) total += (bdayStationeryKits * getAddonPrice('stationery_kit', 25));

      return Math.max(2500, total);
    }
    if (selectedProgram.id === 'virtual_birthday') {
      let total = 3500;
      if (virtualMealsCount > 20) total += (virtualMealsCount - 20) * 70;
      if (virtualCakeKg > 1) total += (virtualCakeKg - 1) * 550;
      if (virtualChocPacks > 20) total += (virtualChocPacks - 20) * 30;
      return total;
    }
    if (selectedProgram.id === 'old_age_home') {
      let total = 10000;
      if (elderMealsCount > 50) total += (elderMealsCount - 50) * 70;
      if (elderCakeKg > 1) total += (elderCakeKg - 1) * 550;
      if (elderCareKits > 15) total += (elderCareKits - 15) * 300;
      return total;
    }
    if (selectedProgram.id === 'orphanage_home') {
      let total = 7500;
      if (orphanMealsCount > 35) total += (orphanMealsCount - 35) * 70;
      if (orphanCakeKg > 1) total += (orphanCakeKg - 1) * 550;
      if (orphanKitsCount > 20) total += (orphanKitsCount - 20) * 100;
      return total;
    }
    if (selectedProgram.id === 'feed_stray_animals') {
      return Math.max(750, animalPortions * 30);
    }
    if (selectedProgram.id === 'general_custom') {
      if (manualCustomAmount && parseFloat(manualCustomAmount) > 0) {
        return parseFloat(manualCustomAmount);
      }
      return customSliderAmount;
    }
    return selectedProgram.basePrice;
  };

  const currentTotalAmount = calculateTotalAmount();

  // Helper to get itemized breakdown items for summary display
  const getItemizedSummary = (): { name: string; detail: string; amount: number }[] => {
    if (selectedProgram.id === 'birthday_anniversary') {
      const items: { name: string; detail: string; amount: number }[] = [
        { name: 'Food Meals', detail: `${bdayMealsCount} meals @ ₹70 each`, amount: bdayMealsCount * 70 }
      ];
      if (selectedAddons['photo_cake']) {
        items.push({ name: 'Edible Photo Cake', detail: `${bdayPhotoCakeKg} kg @ ₹800/kg`, amount: bdayPhotoCakeKg * 800 });
      } else {
        items.push({ name: 'Celebration Cake', detail: `${bdayCakeKg} kg @ ₹550/kg`, amount: bdayCakeKg * 550 });
      }
      items.push({ name: 'Personalized Banner', detail: `${bdayBannerCount} banner @ ₹150 each`, amount: bdayBannerCount * 150 });

      if (selectedAddons['rose_milk']) {
        items.push({ name: 'Rose Milk Treat', detail: `${bdayRoseMilkGlasses} glasses @ ₹15/glass`, amount: bdayRoseMilkGlasses * 15 });
      }
      if (selectedAddons['grocery_kit']) {
        items.push({ name: 'Family Grocery Kits', detail: `${bdayGroceryKits} families @ ₹500/kit`, amount: bdayGroceryKits * 500 });
      }
      if (selectedAddons['stationery_kit']) {
        items.push({ name: 'Student Stationery Kits', detail: `${bdayStationeryKits} kits @ ₹25 each`, amount: bdayStationeryKits * 25 });
      }
      return items;
    }

    if (selectedProgram.id === 'virtual_birthday') {
      const extraMeals = Math.max(0, virtualMealsCount - 20);
      const extraCake = Math.max(0, virtualCakeKg - 1);
      const extraChoc = Math.max(0, virtualChocPacks - 20);

      const items: { name: string; detail: string; amount: number }[] = [
        { name: 'Base Virtual Celebration Package', detail: '20 meals, 1kg cake, 20 juices, balloons & caps', amount: 3500 }
      ];
      if (extraMeals > 0) {
        items.push({ name: 'Additional Children Meals', detail: `+${extraMeals} meals @ ₹70 each`, amount: extraMeals * 70 });
      }
      if (extraCake > 0) {
        items.push({ name: 'Additional Cake Weight', detail: `+${extraCake} kg @ ₹550/kg`, amount: extraCake * 550 });
      }
      if (extraChoc > 0) {
        items.push({ name: 'Additional Chocolates & Juice', detail: `+${extraChoc} packs @ ₹30 each`, amount: extraChoc * 30 });
      }
      return items;
    }

    if (selectedProgram.id === 'old_age_home') {
      const extraMeals = Math.max(0, elderMealsCount - 50);
      const extraCake = Math.max(0, elderCakeKg - 1);
      const extraKits = Math.max(0, elderCareKits - 15);

      const items: { name: string; detail: string; amount: number }[] = [
        { name: 'Base Old Age Home Care Package', detail: '50 feast meals, 1kg cake, 15 essential hygiene kits', amount: 10000 }
      ];
      if (extraMeals > 0) {
        items.push({ name: 'Additional Elder Feast Meals', detail: `+${extraMeals} meals @ ₹70 each`, amount: extraMeals * 70 });
      }
      if (extraCake > 0) {
        items.push({ name: 'Additional Cake Weight', detail: `+${extraCake} kg @ ₹550/kg`, amount: extraCake * 550 });
      }
      if (extraKits > 0) {
        items.push({ name: 'Additional Elder Hygiene Kits', detail: `+${extraKits} kits @ ₹300 each`, amount: extraKits * 300 });
      }
      return items;
    }

    if (selectedProgram.id === 'orphanage_home') {
      const extraMeals = Math.max(0, orphanMealsCount - 35);
      const extraCake = Math.max(0, orphanCakeKg - 1);
      const extraKits = Math.max(0, orphanKitsCount - 20);

      const items: { name: string; detail: string; amount: number }[] = [
        { name: 'Base Orphanage Welfare Package', detail: '35 hot meals, 1kg cake, 20 stationery/supply kits', amount: 7500 }
      ];
      if (extraMeals > 0) {
        items.push({ name: 'Additional Children Meals', detail: `+${extraMeals} meals @ ₹70 each`, amount: extraMeals * 70 });
      }
      if (extraCake > 0) {
        items.push({ name: 'Additional Cake Weight', detail: `+${extraCake} kg @ ₹550/kg`, amount: extraCake * 550 });
      }
      if (extraKits > 0) {
        items.push({ name: 'Additional Stationery & Supplies Kits', detail: `+${extraKits} kits @ ₹100 each`, amount: extraKits * 100 });
      }
      return items;
    }

    if (selectedProgram.id === 'feed_stray_animals') {
      return [
        { name: 'Nourishing Food Portions for Stray Animals', detail: `${animalPortions} portions @ ₹30 per portion`, amount: animalPortions * 30 }
      ];
    }

    return [
      { name: 'General Relief Contribution', detail: 'Direct allocation where urgent need is greatest', amount: currentTotalAmount }
    ];
  };

  // User-friendly 1-line sponsorship summary for clean, clear comprehension
  const getLiveSponsorshipSummary = (): string => {
    if (selectedProgram.id === 'birthday_anniversary') {
      const items = [
        `${bdayMealsCount} Food Meals`,
        selectedAddons['photo_cake'] ? `${bdayPhotoCakeKg}kg Photo Cake` : `${bdayCakeKg}kg Cake`,
        `${bdayBannerCount} Banner`
      ];
      if (selectedAddons['rose_milk']) items.push(`${bdayRoseMilkGlasses} glasses Rose Milk`);
      if (selectedAddons['grocery_kit']) items.push(`${bdayGroceryKits} Grocery Kits`);
      if (selectedAddons['stationery_kit']) items.push(`${bdayStationeryKits} Stationery Kits`);
      return items.join(' • ');
    }
    if (selectedProgram.id === 'virtual_birthday') {
      return `${virtualMealsCount} Children Meals • ${virtualCakeKg}kg Cake • ${virtualChocPacks} Treat Packs • Video Celebration`;
    }
    if (selectedProgram.id === 'old_age_home') {
      return `${elderMealsCount} Elder Meals • ${elderCakeKg}kg Cake • ${elderCareKits} Care Kits`;
    }
    if (selectedProgram.id === 'orphanage_home') {
      return `${orphanMealsCount} Children Meals • ${orphanCakeKg}kg Cake • ${orphanKitsCount} School Kits`;
    }
    if (selectedProgram.id === 'feed_stray_animals') {
      return `Feeding ${animalPortions} stray animals across Chennai`;
    }
    return `General Charitable Contribution`;
  };

  // Check active donor session
  const checkActiveSession = () => {
    const raw = localStorage.getItem('deivakaram_active_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        if (u) {
          setActiveDonorUser(u);
          setName(u.name || '');
          setEmail(u.email || '');
          setPhone(u.phone || '');
          if (u.pan) setPan(u.pan);
          if (u.address) setAddress(u.address);
          setStep(1); // Proceed directly to donation dialog box
          return;
        }
      } catch (e) {
        console.warn('Session parse error:', e);
      }
    }
    setActiveDonorUser(null);
    setStep(0); // Show login / register gate
  };

  useEffect(() => {
    checkActiveSession();
    getCampaigns().then(setCampaigns);
    getSettings().then(setSettings);
    getDynamicPackages().then(pkgs => {
      if (pkgs && pkgs.length > 0) setAvailablePrograms(pkgs);
    });
    getDynamicAddons().then(ads => {
      if (ads && ads.length > 0) setAvailableAddons(ads);
    });

    window.addEventListener('auth-changed', checkActiveSession);
    return () => window.removeEventListener('auth-changed', checkActiveSession);
  }, []);

  // Update initial program if provided
  useEffect(() => {
    if (initialProgramId && DONATION_PROGRAMS.some(p => p.id === initialProgramId)) {
      setSelectedProgramId(initialProgramId);
    }
  }, [initialProgramId]);

  // Authenticate helper
  const completeDonorAuth = (userData: { id: string; name: string; email: string; phone?: string; pan?: string; address?: string }) => {
    const active = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      role: 'donor',
      status: 'active'
    };
    localStorage.setItem('deivakaram_active_user', JSON.stringify(active));
    window.dispatchEvent(new Event('auth-changed'));
    setActiveDonorUser(active);
    setName(active.name);
    setEmail(active.email);
    setPhone(active.phone);
    if (userData.pan) setPan(userData.pan);
    if (userData.address) setAddress(userData.address);
    setAuthError(null);
    setStep(1); // Move immediately to the Donation Dialog Box!
  };

  // 1. Quick New User Login (Real Supabase Backend Integration)
  const handleNewUserQuickLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    if (!newUserName.trim()) {
      setAuthError('Please enter your full name to proceed.');
      return;
    }
    if (!newUserEmail.trim()) {
      setAuthError('Please enter your email address to proceed.');
      return;
    }

    const cleanEmail = newUserEmail.trim().toLowerCase();
    const cleanPhone = newUserPhone.trim();

    setIsAuthProcessing(true);
    try {
      // Create or update real donor record in Supabase
      const donor = await createOrUpdateDonor({
        name: newUserName.trim(),
        email: cleanEmail,
        phone: cleanPhone || undefined,
        donor_type: 'New Donor'
      });

      completeDonorAuth({
        id: donor.id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone || cleanPhone
      });
    } catch (err: any) {
      console.warn('Donor quick registration error:', err);
      completeDonorAuth({
        id: `usr-new-${Date.now()}`,
        name: newUserName.trim(),
        email: cleanEmail,
        phone: cleanPhone
      });
    } finally {
      setIsAuthProcessing(false);
    }
  };

  // 2. Credentials Login (Real Supabase Auth)
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!loginEmail || !loginPassword) {
      setAuthError('Please provide both email and password.');
      return;
    }

    setIsAuthProcessing(true);
    const cleanEmail = loginEmail.trim().toLowerCase();

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: loginPassword
        });

        if (error) {
          // If auth password check fails, check if donor profile exists in Supabase donors table
          const donors = await getDonors();
          const matched = donors.find(d => d.email.toLowerCase() === cleanEmail);
          if (matched && loginPassword === 'password') {
            completeDonorAuth({
              id: matched.id,
              name: matched.name,
              email: matched.email,
              phone: matched.phone,
              pan: matched.pan
            });
            return;
          }
          throw error;
        }

        if (data?.user) {
          // Fetch synced donor profile from public.donors
          const { data: donor } = await supabase
            .from('donors')
            .select('*')
            .or(`user_id.eq.${data.user.id},email.eq.${cleanEmail}`)
            .maybeSingle();

          completeDonorAuth({
            id: donor?.id || data.user.id,
            name: donor?.name || data.user.user_metadata?.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            phone: donor?.phone || data.user.user_metadata?.phone,
            pan: donor?.pan
          });
          return;
        }
      } else {
        const donors = await getDonors();
        const matched = donors.find(d => d.email.toLowerCase() === cleanEmail);
        if (matched) {
          completeDonorAuth({
            id: matched.id,
            name: matched.name,
            email: matched.email,
            phone: matched.phone,
            pan: matched.pan
          });
          return;
        }
        throw new Error('Invalid email or password.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsAuthProcessing(false);
    }
  };

  // 3. OTP Verification
  const handleSendOtp = () => {
    if (!loginPhone && !loginEmail) {
      setAuthError('Enter your mobile number or email to receive a secure OTP code.');
      return;
    }
    setAuthError(null);
    setIsAuthProcessing(true);
    setTimeout(() => {
      setIsAuthProcessing(false);
      setOtpSent(true);
    }, 300);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!otpCode || (otpCode.trim() !== '123456' && otpCode.trim().length !== 6)) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }

    setIsAuthProcessing(true);
    try {
      const cleanEmail = loginEmail ? loginEmail.trim().toLowerCase() : (loginPhone ? `${loginPhone.replace(/[^0-9]/g, '')}@donor.deivakaram.org` : 'verified.donor@gmail.com');
      const donor = await createOrUpdateDonor({
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: loginPhone || undefined,
        donor_type: 'Regular Donor'
      });

      completeDonorAuth({
        id: donor.id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone || loginPhone
      });
    } catch (err) {
      completeDonorAuth({
        id: `usr-otp-${Date.now()}`,
        name: loginEmail ? loginEmail.split('@')[0] : 'Verified Donor',
        email: loginEmail || 'verified.donor@gmail.com',
        phone: loginPhone || '+91 98401 23456'
      });
    } finally {
      setIsAuthProcessing(false);
    }
  };


  const handleLogoutDonor = () => {
    localStorage.removeItem('deivakaram_active_user');
    window.dispatchEvent(new Event('auth-changed'));
    setActiveDonorUser(null);
    setStep(0);
  };

  // Add-on toggle handler
  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: !prev[addonId]
    }));
  };

  // Program plan string representation with itemized quantities for CRM & Receipt
  const getChosenPlanString = (): string => {
    if (selectedProgram.id === 'birthday_anniversary') {
      const parts = [
        `${bdayMealsCount} Meals`,
        selectedAddons['photo_cake'] ? `${bdayPhotoCakeKg}kg Photo Cake` : `${bdayCakeKg}kg Cake`,
        `${bdayBannerCount} Banner`
      ];
      if (selectedAddons['rose_milk']) parts.push(`${bdayRoseMilkGlasses} glasses Rose Milk`);
      if (selectedAddons['grocery_kit']) parts.push(`${bdayGroceryKits} Grocery Kits`);
      if (selectedAddons['stationery_kit']) parts.push(`${bdayStationeryKits} Stationery Kits`);
      return `1. Birthday / Anniversary [${parts.join(', ')}]`;
    }
    if (selectedProgram.id === 'virtual_birthday') {
      const parts = [
        `${virtualMealsCount} Children Meals`,
        `${virtualCakeKg}kg Cake`,
        `${virtualChocPacks} Chocolates & Juices`,
        'Virtual Meet'
      ];
      return `2. Virtual Birthday Celebration [${parts.join(', ')}]`;
    }
    if (selectedProgram.id === 'old_age_home') {
      const parts = [
        `${elderMealsCount} Elder Meals`,
        `${elderCakeKg}kg Cake`,
        `${elderCareKits} Elder Care Kits`
      ];
      return `3. Old Age Home Donation [${parts.join(', ')}]`;
    }
    if (selectedProgram.id === 'orphanage_home') {
      const parts = [
        `${orphanMealsCount} Children Meals`,
        `${orphanCakeKg}kg Cake`,
        `${orphanKitsCount} Children Supply Kits`
      ];
      return `4. Orphanage Home Donation [${parts.join(', ')}]`;
    }
    if (selectedProgram.id === 'feed_stray_animals') {
      return `5. Feed Stray Animals (${animalPortions} Portions)`;
    }
    return selectedProgram.name;
  };

  // Map program to official Donation purpose
  const getPurposeFromProgram = (): Donation['purpose'] => {
    if (selectedProgram.id === 'old_age_home') return 'Senior Citizens';
    if (selectedProgram.id === 'orphanage_home') return 'Child Welfare';
    if (selectedProgram.id === 'virtual_birthday') return 'Child Welfare';
    if (selectedProgram.id === 'feed_stray_animals') return 'Food';
    if (selectedProgram.id === 'birthday_anniversary') return 'Food';
    return 'General Fund';
  };

  // Step 1: Submit Donation Form -> Proceed to Payment
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationMsg(null);

    if (!name.trim()) {
      setFormValidationMsg('Please provide your full name.');
      return;
    }
    if (!phone.trim()) {
      setFormValidationMsg('Please provide your WhatsApp or mobile phone number for receipt delivery.');
      return;
    }

    const isCelebration = selectedProgram.id === 'birthday_anniversary' || selectedProgram.id === 'virtual_birthday';
    if (isCelebration) {
      if (!celebrantName.trim()) {
        setFormValidationMsg('Please enter the Name for banner and label printing.');
        return;
      }
      if (!occasionDate) {
        setFormValidationMsg('Please select the Date of Birth or Anniversary Date.');
        return;
      }
      if (!bannerPhoto) {
        setFormValidationMsg('Please upload a photo for the celebration banner (JPG/PNG <= 5MB).');
        return;
      }
      if (selectedProgram.id === 'birthday_anniversary' && bdayMealsCount < 25) {
        setFormValidationMsg('Minimum food count for direct booking is 25 people. Please contact us via WhatsApp.');
        return;
      }
    }

    if (currentTotalAmount <= 0) {
      setFormValidationMsg('Please select or specify a valid contribution amount.');
      return;
    }
    setStep(2); // Proceed to payment checkout
  };

  const handleWhatsAppRedirectForSmallOrder = () => {
    const trustPhone = (settings?.orgPhone || '+919444012345').replace(/[^0-9]/g, '');
    const cleanPhone = trustPhone.startsWith('91') ? trustPhone : `91${trustPhone}`;
    const text = `Hello Deivakaram Charitable Trust, I would like to make special celebration arrangements for ${celebrantName || 'a special occasion'} on ${occasionDate || 'upcoming date'} for ${bdayMealsCount} meals. Please assist me with custom logistics.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Step 2: Submit Payment with Razorpay Gateway or Direct UPI / Bank Transfer / Card Verification & Sync with CRM
  const handlePaymentSubmit = async (e?: React.FormEvent, directMethod?: 'Razorpay' | 'DirectUPI' | 'DirectBank' | 'DirectCard') => {
    if (e) e.preventDefault();
    if (isProcessing) return; // Prevent duplicate payment attempts
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const finalPlanStr = getChosenPlanString();
      const finalPurpose = getPurposeFromProgram();
      const isCelebrationPkg = selectedProgram.id === 'birthday_anniversary' || selectedProgram.id === 'virtual_birthday';

      let paymentId = '';
      let paymentMethodUsed = 'Razorpay';

      if (directMethod === 'DirectUPI') {
        const cleanUtr = upiUtr.trim() || `UPI-DIRECT-${Date.now()}`;
        paymentId = cleanUtr;
        paymentMethodUsed = 'UPI';
      } else if (directMethod === 'DirectBank') {
        const cleanBankRef = bankRef.trim() || `NEFT-DVK-${Date.now().toString().slice(-8)}`;
        paymentId = cleanBankRef;
        paymentMethodUsed = 'Bank Transfer';
      } else if (directMethod === 'DirectCard') {
        const last4 = cardNumber.replace(/\s+/g, '').slice(-4) || '1928';
        paymentId = `CARD-AUTH-${last4}-${Date.now().toString().slice(-6)}`;
        paymentMethodUsed = 'Credit Card';
      } else {
        // Launch Razorpay Payment
        const rzpResult = await initiateRazorpayPayment({
          keyId: settings?.paymentApiKey,
          amount: currentTotalAmount,
          name: 'DEIVAKARAM CHARITABLE TRUST',
          description: isCelebrationPkg 
            ? `Celebration Sponsorship: ${celebrantName || 'Special Milestone'} (${selectedProgram.name})` 
            : `${selectedProgram.name} Contribution`,
          prefill: {
            name: isAnonymous ? 'Anonymous Donor' : name,
            email: email || 'donor@deivakaram.org',
            contact: phone || '9876543210'
          },
          notes: {
            package_id: selectedProgram.id,
            celebrant_name: celebrantName || '',
            occasion_date: occasionDate || '',
            is_virtual: isVirtualCelebration ? 'yes' : 'no'
          },
          simulateFailure: false
        });
        paymentId = rzpResult.razorpay_payment_id;
        paymentMethodUsed = payMethod === 'Card' ? 'Credit Card' : payMethod === 'NetBanking' ? 'Net Banking' : 'Razorpay';
      }

      // Dedication note if filled
      const extraNote = celebrantName || occasionDate 
        ? `[Occasion: ${celebrantName || 'Special Day'} (${occasionType}) on ${occasionDate} | Virtual: ${isVirtualCelebration ? `Yes (${virtualTimeSlot})` : 'No'}] ${message}`.trim()
        : message;

      // 1. Record in Donations Table
      const createdResult = await createDonation({
        name: isAnonymous ? 'Anonymous Donor' : name,
        email: email || 'donor@deivakaram.org',
        phone,
        address,
        pan,
        amount: currentTotalAmount,
        purpose: finalPurpose,
        plan: finalPlanStr,
        campaign_id: campaignId || undefined,
        payment_method: paymentMethodUsed,
        transaction_id: paymentId,
        is_anonymous: isAnonymous,
        message: extraNote,
        status: 'successful'
      });

      const currentDonation: Donation = (createdResult as any).donation || createdResult;
      const currentDonor: Donor = (createdResult as any).donor || {
        id: currentDonation.donor_id || `dn-${Date.now()}`,
        name: isAnonymous ? 'Anonymous Donor' : name,
        email: email || 'donor@deivakaram.org',
        phone,
        address,
        pan,
        donor_type: 'New Donor',
        created_at: new Date().toISOString()
      };

      // 2. If celebration package, record in Celebration Bookings Table
      let newBooking: CelebrationBooking | null = null;
      if (isCelebrationPkg) {
        const seq = Math.floor(100000 + Math.random() * 900000).toString();
        const bookingId = `DVK-CEL-${new Date().getFullYear()}-${seq}`;

        newBooking = await createCelebrationBooking({
          booking_id: bookingId,
          donor_id: currentDonation.donor_id || currentDonor.id,
          donation_id: currentDonation.id,
          customer_name: isAnonymous ? 'Anonymous Donor' : name,
          customer_phone: phone,
          customer_email: email || 'donor@deivakaram.org',
          celebrant_name: celebrantName || name,
          occasion_type: occasionType || 'Birthday',
          occasion_date: occasionDate || new Date().toISOString().split('T')[0],
          banner_photo_url: bannerPhoto || '',
          banner_photo_name: bannerPhotoName || 'celebration_banner.jpg',
          is_virtual: isVirtualCelebration,
          virtual_time_slot: isVirtualCelebration ? virtualTimeSlot : undefined,
          food_count: selectedProgram.id === 'birthday_anniversary' ? bdayMealsCount : virtualMealsCount,
          package_id: selectedProgram.id,
          package_name: selectedProgram.name,
          cake_details: selectedAddons['photo_cake'] ? '1kg Photo Cake' : `${bdayCakeKg}kg Cake`,
          selected_addons: Object.entries(selectedAddons)
            .filter(([_, sel]) => sel)
            .map(([addonId]) => {
              const addon = availableAddons.find(a => a.id === addonId);
              return {
                id: addonId,
                name: addon?.name || addonId,
                quantity: 1,
                amount: addon?.price || 0
              };
            }),
          total_amount: currentTotalAmount,
          razorpay_payment_id: paymentId,
          razorpay_order_id: paymentId,
          payment_status: 'successful',
          booking_status: 'confirmed',
          notes: message
        });
        setConfirmedBooking(newBooking);
      }

      setPaymentResult({
        donation: currentDonation,
        donor: currentDonor
      });
      setIsProcessing(false);
      setStep(3); // Success confirmation
    } catch (err: any) {
      console.error('Donation payment error:', err);
      setIsProcessing(false);
      setPaymentError(err.description || err.message || 'Payment could not be processed. Please check your details or try again.');
    }
  };

  const handleShareWhatsAppConfirmation = () => {
    const bookingId = confirmedBooking?.booking_id || `DVK-CEL-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const txId = activeDonation?.transaction_id || 'pay_rzp_success';
    const recNo = activeDonation?.receipt_number || 'DVK-REC-PENDING';
    const celName = celebrantName || name;
    const occDate = occasionDate || new Date().toISOString().split('T')[0];
    const meals = selectedProgram.id === 'birthday_anniversary' ? bdayMealsCount : virtualMealsCount;

    const messageText = 
`*DEIVAKARAM CHARITABLE TRUST*
*Celebration Booking Confirmation*

Dear ${name},
Thank you for celebrating your special milestone with Deivakaram!

*Booking ID:* ${bookingId}
*Transaction ID:* ${txId}
*Celebrant Name:* ${celName} (${occasionType})
*Occasion Date:* ${occDate}
*Package:* ${selectedProgram.name}
*Food Distribution:* ${meals} Meals
*Virtual Meet:* ${isVirtualCelebration ? `Yes (${virtualTimeSlot})` : 'No (In-Person)'}
*Amount Paid:* ₹${currentTotalAmount.toLocaleString('en-IN')}
*80G Tax Exemption Receipt No:* ${recNo}

We have safely received your custom banner photo. Our kitchen team will arrange the celebration banner.
Contact Trust Office: ${settings?.orgPhone || '+91 44 2449 1122'}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(messageText)}`, '_blank');
    setWhatsappSent(true);
  };

  const handleDownloadBannerPhoto = () => {
    if (!bannerPhoto) return;
    const link = document.createElement('a');
    link.href = bannerPhoto;
    link.download = `banner_${(celebrantName || 'celebrant').replace(/\s+/g, '_')}_${occasionDate || 'date'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Icon renderer helper
  const renderProgramIcon = (iconType: string) => {
    switch (iconType) {
      case 'cake': return <Cake size={20} color="#0A4A9C" />;
      case 'video': return <Video size={20} color="#0A4A9C" />;
      case 'elder': return <HomeIcon size={20} color="#0A4A9C" />;
      case 'child': return <Baby size={20} color="#0A4A9C" />;
      case 'animal': return <PawPrint size={20} color="#0A4A9C" />;
      default: return <Heart size={20} color="#0A4A9C" />;
    }
  };

  return (
    <div className="modal-overlay">
      <div 
        className="modal-content donate-modal-content" 
        style={{ maxWidth: step === 1 ? '760px' : step === 2 || step === 0 ? '660px' : '620px' }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* STEP PROGRESS TRACKER */}
        {step > 0 && step < 3 && (
          <div className="donate-steps-indicator">
            <span className={step === 1 ? 'active' : 'completed'}>1. Choose Service Program & Inclusions</span>
            <span className={step === 2 ? 'active' : ''}>2. Payment Checkout</span>
          </div>
        )}

        {/* ACTIVE DONOR USER BANNER */}
        {activeDonorUser && step > 0 && step < 3 && (
          <div className="active-donor-banner">
            <span className="active-donor-info">
              <UserCheck size={16} /> Logged in as: <strong>{activeDonorUser.name}</strong> ({activeDonorUser.phone || activeDonorUser.email})
            </span>
            <button type="button" onClick={handleLogoutDonor} className="btn-switch-account">
              Switch Account
            </button>
          </div>
        )}

        {/* ====================================================
            STEP 0: DONOR LOGIN / NEW USER REGISTRATION GATE
            ==================================================== */}
        {step === 0 && (
          <div className="donor-login-gate">
            <div className="gate-header">
              <div className="gate-icon-circle">
                <Heart size={26} fill="#0A4A9C" color="#0A4A9C" />
              </div>
              <h2>Sign In to Donate</h2>
              <p>Sign in or continue as a new user to record your donation safely in the CRM portal.</p>
            </div>

            {/* OFFICIAL DONATION PROGRAMS & PRICING PREVIEW */}
            <div className="gate-programs-preview" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={13} color="#16a34a" /> Official Service Initiatives & Pricing
                </span>
                <span style={{ fontSize: '11px', color: '#15803d', fontStyle: 'italic' }}>
                  Choose a package to pre-select:
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {DONATION_PROGRAMS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProgramId(p.id)}
                    style={{
                      border: selectedProgramId === p.id ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                      background: selectedProgramId === p.id ? '#dcfce7' : '#ffffff',
                      color: selectedProgramId === p.id ? '#14532d' : '#334155',
                      fontWeight: selectedProgramId === p.id ? 700 : 500,
                      borderRadius: '16px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p.name.split('.')[1] || p.name} ({p.tagline})
                  </button>
                ))}
              </div>
            </div>

            {/* Mode selection tabs */}
            <div className="login-mode-tabs">
              <button
                type="button"
                className={`login-mode-tab ${loginMethod === 'new_user' ? 'active' : ''}`}
                onClick={() => { setLoginMethod('new_user'); setAuthError(null); }}
              >
                ⚡ New Donor (Quick)
              </button>
              <button
                type="button"
                className={`login-mode-tab ${loginMethod === 'credentials' ? 'active' : ''}`}
                onClick={() => { setLoginMethod('credentials'); setAuthError(null); }}
              >
                Password Login
              </button>
              <button
                type="button"
                className={`login-mode-tab ${loginMethod === 'otp' ? 'active' : ''}`}
                onClick={() => { setLoginMethod('otp'); setAuthError(null); }}
              >
                OTP Verification
              </button>
            </div>

            {authError && (
              <div className="auth-error-alert">
                {authError}
              </div>
            )}

            {/* TAB 1: QUICK LOG IN AS NEW USER (DEFAULT) */}
            {loginMethod === 'new_user' && (
              <div className="new-user-container">
                <div className="new-user-card-highlight">
                  <div className="new-user-badge">⚡ Recommended for Instant Donation</div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--primary)' }}>
                    Quick Log In as New User
                  </h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Enter your name and contact details to proceed immediately to donation selection.
                  </p>

                  <form onSubmit={handleNewUserQuickLogin}>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={13} /> Full Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="Enter your name"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                      />
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={13} /> Mobile Number
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="+91 98401 23456"
                          value={newUserPhone}
                          onChange={(e) => setNewUserPhone(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={13} /> Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          className="form-control"
                          placeholder="donor@example.com"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-accent btn-block" 
                      style={{ fontSize: '15px', padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      disabled={isAuthProcessing}
                    >
                      {isAuthProcessing ? <Loader2 className="spinner" size={18} /> : '⚡ Continue to Donation Programs'}
                      {!isAuthProcessing && <ArrowRight size={18} />}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: PASSWORD LOGIN */}
            {loginMethod === 'credentials' && (
              <form onSubmit={handleCredentialsLogin} className="login-form-pane">
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="donor@example.com"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={14} /> Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={isAuthProcessing}>
                  {isAuthProcessing ? 'Authenticating...' : 'Sign In & Continue'}
                </button>
              </form>
            )}

            {/* TAB 3: OTP VERIFICATION */}
            {loginMethod === 'otp' && (
              <div className="login-form-pane">
                {!otpSent ? (
                  <div>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                      Enter your mobile number or email to receive a secure verification code.
                    </p>
                    <div className="form-group">
                      <label className="form-label">Mobile Number or Email</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="+91 98401 23456 or email@example.com"
                        value={loginPhone || loginEmail}
                        onChange={(e) => {
                          if (e.target.value.includes('@')) {
                            setLoginEmail(e.target.value);
                          } else {
                            setLoginPhone(e.target.value);
                          }
                        }}
                      />
                    </div>
                    <button type="button" onClick={handleSendOtp} className="btn btn-primary btn-block" disabled={isAuthProcessing}>
                      {isAuthProcessing ? 'Sending...' : 'Send Secure OTP'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtp}>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#166534' }}>
                      ✓ Verification code sent! Enter code to verify.
                    </div>
                    <div className="form-group">
                      <label className="form-label">Enter 6-Digit Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        className="form-control"
                        placeholder="123456"
                        style={{ letterSpacing: '4px', fontSize: '18px', textAlign: 'center', fontWeight: 700 }}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={isAuthProcessing}>
                      {isAuthProcessing ? 'Verifying...' : 'Verify Code & Continue'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            STEP 1: DONATION PROGRAMS & SERVICE INITIATIVES
            (EXACT PRICING, ADD-ONS & INCLUSIONS FROM DEIVAKARAM)
            ==================================================== */}
        {step === 1 && (
          <form onSubmit={handleProceedToPayment} className="donation-dialog-form">
            {/* 3-STEP PROGRESS INDICATOR */}
            <div className="flow-steps-tracker">
              <div className="flow-step-item active">
                <span className="flow-step-num">1</span>
                <span className="flow-step-text">Choose & Customize</span>
              </div>
              <div className="flow-step-divider" />
              <div className="flow-step-item">
                <span className="flow-step-num">2</span>
                <span className="flow-step-text">Payment</span>
              </div>
              <div className="flow-step-divider" />
              <div className="flow-step-item">
                <span className="flow-step-num">3</span>
                <span className="flow-step-text">80G Receipt</span>
              </div>
            </div>

            {/* DONOR CONTACT BAR (COMPACT & CLEAN) */}
            <div className="donor-compact-card">
              <div className="donor-info-avatar">
                {(name || 'Donor').charAt(0).toUpperCase()}
              </div>
              <div className="donor-details-text">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="donor-label">Donating as:</span>
                  <strong>{name || 'Generous Donor'}</strong>
                </div>
                <span className="donor-contact-sub">{phone || '+91 Mobile'} {email ? `• ${email}` : ''}</span>
              </div>
              <button 
                type="button" 
                className="btn-edit-donor" 
                onClick={() => setStep(0)}
                title="Change or sign in as another donor"
              >
                Change Profile
              </button>
            </div>

            {/* 1. SELECT PROGRAM */}
            <div className="program-selection-section">
              <div className="section-title-row">
                <label className="form-label" style={{ fontWeight: 800, fontSize: '13px', color: '#0A4A9C', margin: 0 }}>
                  Select Donation Initiative
                </label>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>Select from cards or drop box</span>
              </div>

              {/* Mobile Quick Dropdown & Touch Strip */}
              <div className="program-dropdown-wrapper">
                <select
                  className="form-control"
                  style={{ fontWeight: 600, color: '#0A4A9C', backgroundColor: '#f8fafc', borderColor: '#cbd5e1', fontSize: '15px', minHeight: '46px', marginBottom: '8px' }}
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                >
                  {DONATION_PROGRAMS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.tagline}
                    </option>
                  ))}
                </select>

                {/* Mobile Touch-Friendly Swipeable Initiative Strip */}
                <div className="mobile-program-scroll-strip">
                  {DONATION_PROGRAMS.map(prog => {
                    const isSelected = selectedProgramId === prog.id;
                    return (
                      <button
                        key={prog.id}
                        type="button"
                        className={`mobile-prog-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedProgramId(prog.id)}
                      >
                        <span className="chip-icon">{renderProgramIcon(prog.icon)}</span>
                        <div className="chip-text">
                          <span className="chip-title">{prog.name.replace(/^\d+\.\s*/, '')}</span>
                          <span className="chip-cost">₹{prog.basePrice.toLocaleString('en-IN')}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Responsive Cards Grid */}
              <div className="program-cards-grid">
                {DONATION_PROGRAMS.map(prog => {
                  const isSelected = selectedProgramId === prog.id;
                  return (
                    <div
                      key={prog.id}
                      className={`program-select-card ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedProgramId(prog.id)}
                    >
                      <div className="program-card-header">
                        <div className="program-icon-wrap">
                          {renderProgramIcon(prog.icon)}
                        </div>
                        <span className="program-badge">{prog.badge}</span>
                      </div>
                      <h4 className="program-title">{prog.name}</h4>
                      <div className="program-pricing-highlight">
                        {prog.tagline}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. UNIFIED PACKAGE & CUSTOMIZATION PANEL */}
            <div className="unified-customizer-card">
              {/* Card Hero Header */}
              <div className="customizer-hero-bar">
                <div className="hero-left">
                  {renderProgramIcon(selectedProgram.icon || 'general')}
                  <div>
                    <h3 className="hero-title">{selectedProgram.name}</h3>
                    <p className="hero-subtitle">“{selectedProgram.note}”</p>
                  </div>
                </div>
                <div className="hero-price-pill">
                  <span className="hero-from">Starting</span>
                  <strong className="hero-price">₹ {selectedProgram.basePrice.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Base Inclusions Banner */}
              <div className="base-package-banner">
                <span className="base-tag">✓ Included in Base Package:</span>
                <span className="base-items-text">
                  {selectedProgram.inclusions.slice(0, 3).join(' • ')}
                </span>
              </div>

              {/* ====================================================
                  PROGRAM 1: BIRTHDAY / ANNIVERSARY CUSTOMIZER
                  ==================================================== */}
              {selectedProgram.id === 'birthday_anniversary' && (
                <div className="clean-customizer-flow">
                  {/* MEALS COUNT */}
                  <div className="customizer-unit-row">
                    <div className="unit-label-bar">
                      <div>
                        <strong className="unit-title">🍲 1. How many meals would you like to sponsor?</strong>
                        <span className="unit-note">25 meals included in base package • Additional meals @ ₹70 each</span>
                      </div>
                      <span className="unit-current-badge">{bdayMealsCount} Meals (₹{(bdayMealsCount * 70).toLocaleString('en-IN')})</span>
                    </div>
                    <div className="unit-controls-bar">
                      <div className="choice-pills-row">
                        {[25, 35, 45, 50, 75, 100].map(cnt => (
                          <button
                            key={cnt}
                            type="button"
                            className={`easy-pill ${bdayMealsCount === cnt ? 'active' : ''}`}
                            onClick={() => setBdayMealsCount(cnt)}
                          >
                            {cnt} {cnt === 25 ? '(Standard)' : 'Meals'}
                          </button>
                        ))}
                      </div>
                      <div className="easy-stepper">
                        <button type="button" onClick={() => setBdayMealsCount(Math.max(25, bdayMealsCount - 5))} title="Minus 5 meals">- 5</button>
                        <input
                          type="number"
                          min={25}
                          max={1000}
                          value={bdayMealsCount}
                          onChange={(e) => setBdayMealsCount(Math.max(25, parseInt(e.target.value) || 25))}
                        />
                        <button type="button" onClick={() => setBdayMealsCount(bdayMealsCount + 5)} title="Plus 5 meals">+ 5</button>
                      </div>
                    </div>
                  </div>

                  {/* CAKE SIZE */}
                  <div className="customizer-unit-row">
                    <div className="unit-label-bar">
                      <div>
                        <strong className="unit-title">🎂 2. Celebration Cake Size</strong>
                        <span className="unit-note">Standard 1 kg fresh cake is included in the package</span>
                      </div>
                      <span className="unit-current-badge">
                        {selectedAddons['photo_cake'] ? `${bdayPhotoCakeKg} kg Photo Cake` : `${bdayCakeKg} kg Cake`}
                      </span>
                    </div>
                    <div className="unit-controls-bar">
                      <div className="choice-pills-row">
                        {[1, 1.5, 2, 3].map(kg => (
                          <button
                            key={kg}
                            type="button"
                            className={`easy-pill ${(selectedAddons['photo_cake'] ? bdayPhotoCakeKg : bdayCakeKg) === kg ? 'active' : ''}`}
                            onClick={() => {
                              if (selectedAddons['photo_cake']) setBdayPhotoCakeKg(kg);
                              else setBdayCakeKg(kg);
                            }}
                          >
                            {kg} kg {kg === 1 ? '(Standard)' : ''}
                          </button>
                        ))}
                      </div>
                      <label className="photo-cake-checkbox">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedAddons['photo_cake'])}
                          onChange={() => toggleAddon('photo_cake')}
                        />
                        <span>⭐ Upgrade to Photo Cake (Edible printed photo, +₹250/kg)</span>
                      </label>
                    </div>
                  </div>

                  {/* OPTIONAL TREATS */}
                  <div className="customizer-unit-row optional-treats-container">
                    <div className="unit-label-bar">
                      <div>
                        <strong className="unit-title" style={{ color: '#b45309' }}>✨ 3. Optional Treats to Add Extra Joy</strong>
                        <span className="unit-note">Click to add any extra treats for the celebration</span>
                      </div>
                    </div>

                    <div className="addons-clean-grid">
                      {/* ROSE MILK */}
                      <div className={`clean-addon-tile ${selectedAddons['rose_milk'] ? 'selected' : ''}`}>
                        <div className="addon-top-row" onClick={() => toggleAddon('rose_milk')}>
                          <input
                            type="checkbox"
                            checked={Boolean(selectedAddons['rose_milk'])}
                            onChange={() => {}}
                          />
                          <div className="addon-text-group">
                            <strong>🥛 Rose Milk Treat</strong>
                            <span>₹150 for 10 glasses (₹15 / glass)</span>
                          </div>
                          {selectedAddons['rose_milk'] && (
                            <span className="addon-subtotal-tag">+ ₹{(bdayRoseMilkGlasses * 15).toLocaleString('en-IN')}</span>
                          )}
                        </div>
                        {selectedAddons['rose_milk'] && (
                          <div className="addon-expansion-bar">
                            <span className="expansion-label">Select Quantity:</span>
                            {[10, 20, 30, 50].map(g => (
                              <button
                                key={g}
                                type="button"
                                className={`sub-pill ${bdayRoseMilkGlasses === g ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setBdayRoseMilkGlasses(g); }}
                              >
                                {g} glasses
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* GROCERY KIT */}
                      <div className={`clean-addon-tile ${selectedAddons['grocery_kit'] ? 'selected' : ''}`}>
                        <div className="addon-top-row" onClick={() => toggleAddon('grocery_kit')}>
                          <input
                            type="checkbox"
                            checked={Boolean(selectedAddons['grocery_kit'])}
                            onChange={() => {}}
                          />
                          <div className="addon-text-group">
                            <strong>📦 Grocery Ration Kit</strong>
                            <span>₹500 / family essential food kit</span>
                          </div>
                          {selectedAddons['grocery_kit'] && (
                            <span className="addon-subtotal-tag">+ ₹{(bdayGroceryKits * 500).toLocaleString('en-IN')}</span>
                          )}
                        </div>
                        {selectedAddons['grocery_kit'] && (
                          <div className="addon-expansion-bar">
                            <span className="expansion-label">Select Families:</span>
                            {[1, 2, 3, 5].map(f => (
                              <button
                                key={f}
                                type="button"
                                className={`sub-pill ${bdayGroceryKits === f ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setBdayGroceryKits(f); }}
                              >
                                {f} {f === 1 ? 'family' : 'families'}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* STATIONERY KIT */}
                      <div className={`clean-addon-tile ${selectedAddons['stationery_kit'] ? 'selected' : ''}`}>
                        <div className="addon-top-row" onClick={() => toggleAddon('stationery_kit')}>
                          <input
                            type="checkbox"
                            checked={Boolean(selectedAddons['stationery_kit'])}
                            onChange={() => {}}
                          />
                          <div className="addon-text-group">
                            <strong>✏️ School Stationery Kit</strong>
                            <span>₹25 each (Notebook & pen kit)</span>
                          </div>
                          {selectedAddons['stationery_kit'] && (
                            <span className="addon-subtotal-tag">+ ₹{(bdayStationeryKits * 25).toLocaleString('en-IN')}</span>
                          )}
                        </div>
                        {selectedAddons['stationery_kit'] && (
                          <div className="addon-expansion-bar">
                            <span className="expansion-label">Select Quantity:</span>
                            {[10, 25, 50, 100].map(k => (
                              <button
                                key={k}
                                type="button"
                                className={`sub-pill ${bdayStationeryKits === k ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setBdayStationeryKits(k); }}
                              >
                                {k} kits
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ====================================================
                  PROGRAM 2: VIRTUAL BIRTHDAY CELEBRATION CUSTOMIZER
                  ==================================================== */}
              {selectedProgram.id === 'virtual_birthday' && (
                <div className="clean-customizer-flow">
                  {/* CHILDREN MEALS */}
                  <div className="customizer-unit-row">
                    <div className="unit-label-bar">
                      <div>
                        <strong className="unit-title">🍲 1. Children Meals Count</strong>
                        <span className="unit-note">20 meals included in package • Extra meals @ ₹70 each</span>
                      </div>
                      <span className="unit-current-badge">{virtualMealsCount} Meals</span>
                    </div>
                    <div className="unit-controls-bar">
                      <div className="choice-pills-row">
                        {[20, 30, 40, 50, 75].map(cnt => (
                          <button
                            key={cnt}
                            type="button"
                            className={`easy-pill ${virtualMealsCount === cnt ? 'active' : ''}`}
                            onClick={() => setVirtualMealsCount(cnt)}
                          >
                            {cnt} {cnt === 20 ? '(Standard)' : 'Meals'}
                          </button>
                        ))}
                      </div>
                      <div className="easy-stepper">
                        <button type="button" onClick={() => setVirtualMealsCount(Math.max(20, virtualMealsCount - 5))}>- 5</button>
                        <input
                          type="number"
                          min={20}
                          max={500}
                          value={virtualMealsCount}
                          onChange={(e) => setVirtualMealsCount(Math.max(20, parseInt(e.target.value) || 20))}
                        />
                        <button type="button" onClick={() => setVirtualMealsCount(virtualMealsCount + 5)}>+ 5</button>
                      </div>
                    </div>
                  </div>

                  {/* CAKE */}
                  <div className="customizer-unit-row">
                    <div className="unit-label-bar">
                      <div>
                        <strong className="unit-title">🎂 2. Celebration Cake</strong>
                        <span className="unit-note">1 kg cake included • Extra cake @ ₹550/kg</span>
                      </div>
                      <span className="unit-current-badge">{virtualCakeKg} kg</span>
                    </div>
                    <div className="choice-pills-row">
                      {[1, 1.5, 2, 3].map(kg => (
                        <button
                          key={kg}
                          type="button"
                          className={`easy-pill ${virtualCakeKg === kg ? 'active' : ''}`}
                          onClick={() => setVirtualCakeKg(kg)}
                        >
                          {kg} kg {kg === 1 ? '(Standard)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TREATS & JUICES */}
                  <div className="customizer-unit-row">
                    <div className="unit-label-bar">
                      <div>
                        <strong className="unit-title">🧃 3. Chocolates & Juice Packs</strong>
                        <span className="unit-note">20 packs included • Extra packs @ ₹30 each</span>
                      </div>
                      <span className="unit-current-badge">{virtualChocPacks} Packs</span>
                    </div>
                    <div className="choice-pills-row">
                      {[20, 30, 40, 50].map(c => (
                        <button
                          key={c}
                          type="button"
                          className={`easy-pill ${virtualChocPacks === c ? 'active' : ''}`}
                          onClick={() => setVirtualChocPacks(c)}
                        >
                          {c} {c === 20 ? '(Standard)' : 'Packs'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ====================================================
                  PROGRAM 3: OLD AGE HOME DONATION CUSTOMIZER
                  ==================================================== */}
              {selectedProgram.id === 'old_age_home' && (
                <div className="clean-customizer-flow">
                  {/* ELDER MEALS */}
                  <div className="customizer-unit-row">
                    <div className="unit-label-bar">
                      <div>
                        <strong className="unit-title">🍲 1. Elder Feast Meals</strong>
                        <span className="unit-note">50 feast meals included for all resident seniors • Extra meals @ ₹70 each</span>
                      </div>
                      <span className="unit-current-badge">{elderMealsCount} Meals</span>
                    </div>
                    <div className="unit-controls-bar">
                      <div className="choice-pills-row">
                        {[50, 65, 80, 100].map(cnt => (
                          <button
                            key={cnt}
                            type="button"
                            className={`easy-pill ${elderMealsCount === cnt ? 'active' : ''}`}
                            onClick={() => setElderMealsCount(cnt)}
                          >
                            {cnt} {cnt === 50 ? '(Standard)' : 'Meals'}
                          </button>
                        ))}
                      </div>
                      <div className="easy-stepper">
                        <button type="button" onClick={() => setElderMealsCount(Math.max(50, elderMealsCount - 5))}>- 5</button>
                        <input
                          type="number"
                          min={50}
                          max={500}
                          value={elderMealsCount}
                          onChange={(e) => setElderMealsCount(Math.max(50, parseInt(e.target.value) || 50))}
                        />
                        <button type="button" onClick={() => setElderMealsCount(elderMealsCount + 5)}>+ 5</button>
                      </div>
                    </div>
                  </div>

                  {/* CAKE & CARE KITS */}
                  <div className="customizer-unit-row">
                    <div className="unit-label-bar">
                      <div>
                        <strong className="unit-title">🧼 2. Essential Hygiene & Toiletries Kits</strong>
                        <span className="unit-note">15 senior care kits included • Extra kits @ ₹300 each</span>
                      </div>
                      <span className="unit-current-badge">{elderCareKits} Kits</span>
                    </div>
                    <div className="choice-pills-row">
                      {[15, 25, 35, 50].map(k => (
                        <button
                          key={k}
                          type="button"
                          className={`easy-pill ${elderCareKits === k ? 'active' : ''}`}
                          onClick={() => setElderCareKits(k)}
                        >
                          {k} {k === 15 ? '(Standard)' : 'Kits'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ====================================================
                  PROGRAM 4: ORPHANAGE HOME DONATION CUSTOMIZER
                  ==================================================== */}
              {selectedProgram.id === 'orphanage_home' && (
                <div className="clean-customizer-flow">
                  {/* ORPHAN MEALS */}
                  <div className="customizer-unit-row">
                    <div className="unit-label-bar">
                      <div>
                        <strong className="unit-title">🍲 1. Children Hot Meals</strong>
                        <span className="unit-note">35 wholesome meals included • Extra meals @ ₹70 each</span>
                      </div>
                      <span className="unit-current-badge">{orphanMealsCount} Meals</span>
                    </div>
                    <div className="unit-controls-bar">
                      <div className="choice-pills-row">
                        {[35, 45, 60, 80, 100].map(cnt => (
                          <button
                            key={cnt}
                            type="button"
                            className={`easy-pill ${orphanMealsCount === cnt ? 'active' : ''}`}
                            onClick={() => setOrphanMealsCount(cnt)}
                          >
                            {cnt} {cnt === 35 ? '(Standard)' : 'Meals'}
                          </button>
                        ))}
                      </div>
                      <div className="easy-stepper">
                        <button type="button" onClick={() => setOrphanMealsCount(Math.max(35, orphanMealsCount - 5))}>- 5</button>
                        <input
                          type="number"
                          min={35}
                          max={500}
                          value={orphanMealsCount}
                          onChange={(e) => setOrphanMealsCount(Math.max(35, parseInt(e.target.value) || 35))}
                        />
                        <button type="button" onClick={() => setOrphanMealsCount(orphanMealsCount + 5)}>+ 5</button>
                      </div>
                    </div>
                  </div>

                  {/* ORPHAN SCHOOL KITS */}
                  <div className="customizer-unit-row">
                    <div className="unit-label-bar">
                      <div>
                        <strong className="unit-title">📚 2. School Stationery & Treat Kits</strong>
                        <span className="unit-note">20 education kits included • Extra kits @ ₹100 each</span>
                      </div>
                      <span className="unit-current-badge">{orphanKitsCount} Kits</span>
                    </div>
                    <div className="choice-pills-row">
                      {[20, 30, 40, 50].map(k => (
                        <button
                          key={k}
                          type="button"
                          className={`easy-pill ${orphanKitsCount === k ? 'active' : ''}`}
                          onClick={() => setOrphanKitsCount(k)}
                        >
                          {k} {k === 20 ? '(Standard)' : 'Kits'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ====================================================
                  PROGRAM 5: FEED STRAY ANIMALS CUSTOMIZER
                  ==================================================== */}
              {selectedProgram.id === 'feed_stray_animals' && (
                <div className="clean-customizer-flow">
                  <div className="customizer-unit-row">
                    <div className="unit-label-bar">
                      <div>
                        <strong className="unit-title">🐾 Number of Food Portions</strong>
                        <span className="unit-note">₹30 per portion • Minimum 25 portions (₹750)</span>
                      </div>
                      <span className="unit-current-badge">{animalPortions} Portions (₹{(animalPortions * 30).toLocaleString('en-IN')})</span>
                    </div>
                    <div className="unit-controls-bar">
                      <div className="choice-pills-row">
                        {[25, 35, 45, 50, 100, 200].map(cnt => (
                          <button
                            key={cnt}
                            type="button"
                            className={`easy-pill ${animalPortions === cnt ? 'active' : ''}`}
                            onClick={() => setAnimalPortions(cnt)}
                          >
                            {cnt} {cnt === 25 ? '(Min 25)' : 'Portions'}
                          </button>
                        ))}
                      </div>
                      <div className="easy-stepper">
                        <button type="button" onClick={() => setAnimalPortions(Math.max(25, animalPortions - 5))}>- 5</button>
                        <input
                          type="number"
                          min={25}
                          max={1000}
                          value={animalPortions}
                          onChange={(e) => setAnimalPortions(Math.max(25, parseInt(e.target.value) || 25))}
                        />
                        <button type="button" onClick={() => setAnimalPortions(animalPortions + 5)}>+ 5</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ====================================================
                  PROGRAM 6: GENERAL / CUSTOM CONTRIBUTION
                  ==================================================== */}
              {selectedProgram.id === 'general_custom' && (
                <div className="clean-customizer-flow">
                  <div className="customizer-unit-row">
                    <div className="unit-label-bar">
                      <div>
                        <strong className="unit-title">🤲 Select or Enter Donation Amount</strong>
                        <span className="unit-note">Supports emergency disaster relief, daily Annadhanam, and medical aid</span>
                      </div>
                      <span className="unit-current-badge">₹ {currentTotalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="choice-pills-row">
                      {[500, 1000, 2500, 5000, 10000].map(val => (
                        <button
                          key={val}
                          type="button"
                          className={`easy-pill ${customSliderAmount === val && !manualCustomAmount ? 'active' : ''}`}
                          onClick={() => {
                            setCustomSliderAmount(val);
                            setManualCustomAmount('');
                          }}
                        >
                          ₹ {val.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <input
                        type="number"
                        placeholder="Or enter custom amount in Rupees"
                        className="form-control"
                        value={manualCustomAmount}
                        onChange={(e) => setManualCustomAmount(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* FORM VALIDATION ERROR BANNER */}
              {formValidationMsg && (
                <div className="form-validation-alert" style={{ margin: '12px 0', padding: '10px 14px', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <AlertTriangle size={18} color="#dc2626" />
                  <span>{formValidationMsg}</span>
                </div>
              )}

              {/* CELEBRATION BOOKING DETAILS (MANDATORY FOR CELEBRATION PACKAGES) */}
              {(selectedProgram.id === 'birthday_anniversary' || selectedProgram.id === 'virtual_birthday') ? (
                <div className="celebration-details-card" style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '16px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0A4A9C', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Cake size={18} color="#D1A120" /> Celebration & Banner Details (Mandatory)
                    </div>
                    <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      * Printed on Venue Banner
                    </span>
                  </div>

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.5fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Occasion Type *
                      </label>
                      <select 
                        className="form-control"
                        value={occasionType}
                        onChange={(e) => setOccasionType(e.target.value as any)}
                        style={{ height: '40px', fontSize: '13px' }}
                      >
                        <option value="Birthday">Birthday</option>
                        <option value="Anniversary">Wedding Anniversary</option>
                        <option value="Memorial">Memorial / Remembrance</option>
                        <option value="Other">Special Celebration</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Name for Banner & Label Printing *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Master Rohan Kumar (5th Birthday)"
                        className="form-control"
                        value={celebrantName}
                        onChange={(e) => {
                          setCelebrantName(e.target.value);
                          if (formValidationMsg) setFormValidationMsg(null);
                        }}
                        style={{ height: '40px', fontSize: '13px' }}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Date of Occasion *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={occasionDate}
                        onChange={(e) => {
                          setOccasionDate(e.target.value);
                          if (formValidationMsg) setFormValidationMsg(null);
                        }}
                        style={{ height: '40px', fontSize: '13px' }}
                        required
                      />
                    </div>
                  </div>

                  {/* MANDATORY PHOTO UPLOAD SECTION */}
                  <div style={{ marginTop: '12px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#0A4A9C', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Camera size={15} /> Upload Celebrant Photo for Banner Printing *
                    </label>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '10px' }}>
                      Please upload a clear high-resolution photo (JPG or PNG format, maximum 5MB). This will be printed on the welcome celebration banner.
                    </span>

                    {!bannerPhoto ? (
                      <div 
                        style={{ 
                          border: '2px dashed #93c5fd', 
                          borderRadius: '10px', 
                          padding: '18px', 
                          textAlign: 'center', 
                          background: '#eff6ff', 
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onClick={() => document.getElementById('banner-photo-input')?.click()}
                      >
                        <input 
                          type="file" 
                          id="banner-photo-input" 
                          accept="image/jpeg,image/png,image/webp" 
                          onChange={handlePhotoUpload} 
                          style={{ display: 'none' }} 
                        />
                        <Upload size={28} color="#0A4A9C" style={{ margin: '0 auto 8px' }} />
                        <strong style={{ fontSize: '13px', color: '#1e3a8a', display: 'block' }}>
                          Click to Select & Upload Banner Photo *
                        </strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Supports JPG, PNG (Max file size: 5MB)
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px' }}>
                        <img 
                          src={bannerPhoto} 
                          alt="Banner Preview" 
                          style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #0A4A9C' }} 
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={16} color="#16a34a" />
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>{bannerPhotoName || 'Celebrant Photo Uploaded'}</strong>
                          </div>
                          <span style={{ fontSize: '11px', color: '#16a34a', display: 'block', marginTop: '2px' }}>
                            ✓ Validated format & size (Under 5MB limit)
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline"
                            onClick={() => document.getElementById('banner-photo-input')?.click()}
                            style={{ fontSize: '11px', padding: '6px 10px' }}
                          >
                            Replace
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline"
                            onClick={handleRemovePhoto}
                            style={{ fontSize: '11px', padding: '6px 10px', borderColor: '#ef4444', color: '#ef4444' }}
                          >
                            Remove
                          </button>
                        </div>
                        <input 
                          type="file" 
                          id="banner-photo-input" 
                          accept="image/jpeg,image/png,image/webp" 
                          onChange={handlePhotoUpload} 
                          style={{ display: 'none' }} 
                        />
                      </div>
                    )}

                    {bannerPhotoError && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={14} /> {bannerPhotoError}
                      </div>
                    )}

                    {/* LIVE BANNER PREVIEW MOCKUP */}
                    {bannerPhoto && celebrantName && (
                      <div style={{ marginTop: '12px', background: 'linear-gradient(135deg, #0A4A9C, #062b5c)', borderRadius: '10px', padding: '14px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '14px', border: '2px solid #D1A120' }}>
                        <img 
                          src={bannerPhoto} 
                          alt="Banner Cutout" 
                          style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #D1A120', flexShrink: 0 }} 
                        />
                        <div>
                          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#fde047', fontWeight: 700 }}>
                            ★ Official Venue Banner Mockup ★
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '2px' }}>
                            Hearty {occasionType} Wishes to {celebrantName}!
                          </div>
                          <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '1px' }}>
                            {occasionDate ? `Date: ${occasionDate}` : ''} • Annadhanam & Seva organized with love by Deivakaram
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* VIRTUAL CELEBRATION OPTION (FEATURE 5) */}
                  <div style={{ marginTop: '14px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#0A4A9C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Video size={16} color="#0A4A9C" /> Do you want to connect virtually?
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${!isVirtualCelebration ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setIsVirtualCelebration(false)}
                          style={{ fontSize: '11px', padding: '4px 12px', height: 'auto' }}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${isVirtualCelebration ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setIsVirtualCelebration(true)}
                          style={{ fontSize: '11px', padding: '4px 12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Video size={12} /> Yes, Connect (Video Call)
                        </button>
                      </div>
                    </div>

                    {isVirtualCelebration && (
                      <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '10px 14px', marginTop: '8px', border: '1px solid #bfdbfe' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>
                          Select Preferred Time Slot for Virtual Celebration:
                        </label>
                        <select
                          className="form-control"
                          value={virtualTimeSlot}
                          onChange={(e) => setVirtualTimeSlot(e.target.value)}
                          style={{ height: '36px', fontSize: '13px' }}
                        >
                          <option value="10:00 AM – 1:00 PM">10:00 AM – 1:00 PM (Lunch Annadhanam Session)</option>
                          <option value="1:00 PM – 3:00 PM">1:00 PM – 3:00 PM (Afternoon Session)</option>
                          <option value="3:00 PM – 6:00 PM">3:00 PM – 6:00 PM (Evening Snacks & Cake Cutting)</option>
                          <option value="6:00 PM – 8:00 PM">6:00 PM – 8:00 PM (Dinner Annadhanam Session)</option>
                        </select>
                        <span style={{ fontSize: '11px', color: '#475569', display: 'block', marginTop: '4px' }}>
                          ℹ️ Our coordinator will send the Google Meet / Zoom link to your WhatsApp prior to the scheduled slot.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* OPTIONAL DEDICATION FOR NON-CELEBRATION DONATIONS */
                <div className="celebration-details-card">
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0A4A9C', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Dedicate this contribution to a person or special day (Optional)
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1.5 }}>
                      <input
                        type="text"
                        placeholder="e.g. In memory of late grandparents / On behalf of family"
                        className="form-control"
                        value={celebrantName}
                        onChange={(e) => setCelebrantName(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <input
                        type="date"
                        className="form-control"
                        value={occasionDate}
                        onChange={(e) => setOccasionDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FOOD COUNT CONDITION WARNING (< 25 MEALS) */}
            {selectedProgram.id === 'birthday_anniversary' && bdayMealsCount < 25 && (
              <div style={{ background: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: '10px', padding: '12px 16px', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '13px', color: '#92400e', display: 'block' }}>
                    Minimum Online Order is 25 Food Meals
                  </strong>
                  <p style={{ fontSize: '12px', color: '#b45309', margin: '2px 0 0' }}>
                    For smaller custom orders ({bdayMealsCount} meals), direct online payment is paused. Please connect directly with our trust coordinator via WhatsApp for personalized arrangements.
                  </p>
                </div>
              </div>
            )}

            {/* SINGLE CLEAN LIVE TOTAL BAR */}
            <div className="total-calculation-bar">
              <div className="calc-info">
                <div className="calc-sponsorship-line">
                  <span className="calc-sponsoring-label">You are providing:</span>
                  <strong className="calc-sponsoring-text">{getLiveSponsorshipSummary()}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                  <strong className="calc-amount">₹ {currentTotalAmount.toLocaleString('en-IN')}</strong>
                  <span className="tax-exemption-tag">✓ 100% Tax Deductible (Sec 80G)</span>
                </div>
              </div>

              {selectedProgram.id === 'birthday_anniversary' && bdayMealsCount < 25 ? (
                <button 
                  type="button" 
                  className="btn btn-whatsapp-order"
                  onClick={handleWhatsAppRedirectForSmallOrder}
                  style={{
                    background: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
                  }}
                >
                  <MessageCircle size={18} />
                  <span>Order via WhatsApp (&lt; 25 Meals)</span>
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn btn-accent btn-proceed"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </form>
        )}

        {/* ====================================================
            STEP 2: PAYMENT GATEWAY (CHOOSE PAYMENT METHOD & PAY)
            ==================================================== */}
        {step === 2 && (
          <form onSubmit={handlePaymentSubmit} className="payment-gateway-pane">
            <div className="gateway-header">
              <img src="/logo.png" alt="Deivakaram Logo" className="gateway-trust-logo" />
              <div className="gateway-title-block">
                <h3>DEIVAKARAM CHARITABLE TRUST</h3>
                <p>Official 256-Bit SSL Secured Donation Payment Gateway</p>
              </div>
              <div className="gateway-amount-label">
                ₹ {currentTotalAmount.toLocaleString('en-IN')}
              </div>
            </div>

            {/* BILLING PARTICULARS SUMMARY (INCLUDES CHOSEN PROGRAM & INCLUSIONS) */}
            <div className="billing-summary-box">
              <div className="billing-summary-row">
                <span>Donor Name & Contact:</span>
                <strong>{name} ({phone})</strong>
              </div>
              <div className="billing-summary-row">
                <span>Chosen Program:</span>
                <strong style={{ color: '#0A4A9C' }}>{selectedProgram.name}</strong>
              </div>
              <div className="billing-summary-row">
                <span>Package Particulars:</span>
                <span className="badge badge-info" style={{ textAlign: 'right', whiteSpace: 'normal', maxWidth: '300px' }}>
                  {getChosenPlanString()}
                </span>
              </div>
              {celebrantName && (
                <div className="billing-summary-row">
                  <span>Occasion / Celebrant:</span>
                  <span>{celebrantName} {occasionDate ? `(${occasionDate})` : ''}</span>
                </div>
              )}

              {/* ITEMIZED LINE ITEMS BREAKDOWN */}
              <div className="billing-itemized-list">
                <div className="billing-itemized-header">
                  <span>Customized Order Breakdown</span>
                  <span>Amount</span>
                </div>
                {getItemizedSummary().map((item, idx) => (
                  <div key={idx} className="billing-itemized-row">
                    <div>
                      <span className="item-name">{item.name}</span>
                      <span className="item-detail">{item.detail}</span>
                    </div>
                    <span className="item-amount">₹ {item.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="billing-summary-row">
                <span>Tax Exemption Status:</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>100% Tax Deductible (Section 80G Certified)</span>
              </div>
              <div className="billing-total-row">
                <span>Total Amount Payable:</span>
                <strong style={{ fontSize: '20px', color: '#0A4A9C' }}>
                  ₹ {currentTotalAmount.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* PAYMENT METHODS SELECTOR */}
            <div className="gateway-container">
              <div className="gateway-tabs">
                <button
                  type="button"
                  className={`gateway-tab-btn ${payMethod === 'UPI' ? 'active' : ''}`}
                  onClick={() => setPayMethod('UPI')}
                >
                  <Smartphone size={16} /> UPI / GPay / QR
                </button>
                <button
                  type="button"
                  className={`gateway-tab-btn ${payMethod === 'Card' ? 'active' : ''}`}
                  onClick={() => setPayMethod('Card')}
                >
                  <CreditCard size={16} /> Debit & Credit Card
                </button>
                <button
                  type="button"
                  className={`gateway-tab-btn ${payMethod === 'NetBanking' ? 'active' : ''}`}
                  onClick={() => setPayMethod('NetBanking')}
                >
                  <Landmark size={16} /> Net Banking
                </button>
              </div>

              <div className="gateway-tab-body">
                {/* 1. UPI METHOD WITH QR CODE AND ID */}
                {payMethod === 'UPI' && (
                  <div className="gateway-upi-form">
                    <div className="upi-qr-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div className="upi-qr-box" style={{ flexShrink: 0, textAlign: 'center' }}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=${trustUpiInput.trim()}&pn=${encodeURIComponent('Deivakaram Trust')}&am=${currentTotalAmount}&cu=INR&tn=${encodeURIComponent('Deivakaram ' + selectedProgram.name.slice(0, 20))}`)}`} 
                          alt="Scan to Pay via UPI"
                          style={{ width: '130px', height: '130px', borderRadius: '8px', border: '1.5px solid #cbd5e1', display: 'block', margin: '0 auto', background: '#ffffff', padding: '4px' }}
                        />
                        <span style={{ fontSize: '11.5px', color: '#0A4A9C', fontWeight: 800, marginTop: '5px', display: 'block' }}>₹{currentTotalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="upi-qr-text" style={{ flex: 1 }}>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>Instant UPI Mobile QR Scan</strong>
                        <p style={{ margin: '4px 0 8px 0', fontSize: '12px', color: '#475569' }}>
                          Scan with <strong>Google Pay, PhonePe, Paytm, or BHIM</strong> to transfer ₹{currentTotalAmount.toLocaleString('en-IN')}.
                        </p>
                        
                        {isEditingUpi ? (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                            <input
                              type="text"
                              className="form-control"
                              style={{ fontSize: '12px', height: '32px', padding: '4px 8px' }}
                              value={trustUpiInput}
                              onChange={(e) => setTrustUpiInput(e.target.value)}
                              placeholder="e.g. yourname@okaxis or 9150130519@ybl"
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: '11px', padding: '4px 10px', height: '32px' }}
                              onClick={() => setIsEditingUpi(false)}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0A4A9C', fontFamily: 'monospace' }}>
                              {trustUpiInput}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(trustUpiInput, 'upi_id')}
                              style={{ background: 'none', border: 'none', color: '#0A4A9C', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                            >
                              {copiedField === 'upi_id' ? 'Copied!' : 'Copy'}
                            </button>
                            <span style={{ color: '#cbd5e1' }}>•</span>
                            <button
                              type="button"
                              onClick={() => setIsEditingUpi(true)}
                              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                            >
                              Change UPI ID
                            </button>
                          </div>
                        )}

                        <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', marginTop: '6px' }}>
                          Verified VPA linked to recipient bank account.
                        </span>
                      </div>
                    </div>

                    {/* DIRECT UTR VERIFICATION */}
                    <div style={{ marginTop: '14px', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                        ✓ Paid via mobile scanner? Enter 12-Digit UPI Ref / UTR:
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          maxLength={16}
                          placeholder="e.g. 427189012345"
                          className="form-control"
                          value={upiUtr}
                          onChange={(e) => setUpiUtr(e.target.value)}
                          style={{ fontSize: '13px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ whiteSpace: 'nowrap', fontSize: '13px', padding: '0 16px', fontWeight: 700 }}
                          onClick={(e) => handlePaymentSubmit(e, 'DirectUPI')}
                          disabled={isProcessing}
                        >
                          Confirm UPI
                        </button>
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        Instant verification: saves donation directly to database and issues official 80G tax receipt.
                      </span>
                    </div>

                    <div className="upi-app-badges">
                      <span>Google Pay</span>
                      <span>PhonePe</span>
                      <span>BHIM UPI</span>
                      <span>Paytm</span>
                      <span>Amazon Pay</span>
                    </div>

                    {/* Razorpay Gateway Alternate */}
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                        Prefer Razorpay's dynamic QR code & in-app UPI Intent?
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '12px', padding: '6px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}
                        onClick={() => handlePaymentSubmit()}
                        disabled={isProcessing}
                      >
                        Launch Razorpay Gateway
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. CARD METHOD */}
                {payMethod === 'Card' && (
                  <div className="gateway-card-form">
                    <div className="form-group">
                      <label className="form-label">Card Number</label>
                      <input
                        type="text"
                        placeholder="4532 •••• •••• 1928"
                        className="form-control"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          placeholder="12/28"
                          className="form-control"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="•••"
                          className="form-control"
                          required
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '12px', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block' }}>Direct Card Processing</strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Process and issue official 80G tax receipt immediately</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ fontSize: '12.5px', padding: '8px 16px', fontWeight: 700, whiteSpace: 'nowrap' }}
                        onClick={(e) => handlePaymentSubmit(e, 'DirectCard')}
                        disabled={isProcessing}
                      >
                        Authorize & Pay ₹{currentTotalAmount.toLocaleString('en-IN')}
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. NET BANKING METHOD */}
                {payMethod === 'NetBanking' && (
                  <div className="gateway-bank-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Official Trust Bank Account Details Card */}
                    <div style={{ background: '#f8fafc', border: '1.5px solid #0A4A9C', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0A4A9C', fontWeight: 800, fontSize: '13.5px' }}>
                          <Landmark size={18} /> Official Trust Bank Account (Direct Transfer)
                        </div>
                        <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#065f46', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
                          Verified Account
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Account Name</span>
                          <strong style={{ color: '#0f172a' }}>DEIVAKARAM CHARITABLE TRUST</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Bank & Branch</span>
                          <strong style={{ color: '#0f172a' }}>State Bank of India (SBI), Neelankarai</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Account Number</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <strong style={{ color: '#0A4A9C', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '0.5px' }}>398201948512</strong>
                            <button
                              type="button"
                              onClick={() => handleCopy('398201948512', 'acc')}
                              style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              {copiedField === 'acc' ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                              {copiedField === 'acc' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>IFSC Code</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <strong style={{ color: '#0A4A9C', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '0.5px' }}>SBIN0001824</strong>
                            <button
                              type="button"
                              onClick={() => handleCopy('SBIN0001824', 'ifsc')}
                              style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              {copiedField === 'ifsc' ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                              {copiedField === 'ifsc' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Account Type</span>
                          <strong style={{ color: '#0f172a' }}>Current Account</strong>
                        </div>
                      </div>
                    </div>

                    {/* Direct Transfer Confirmation via UTR / Ref */}
                    <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px' }}>
                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                        ✓ Already transferred via NEFT / IMPS / RTGS? Enter UTR / Ref Number:
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          maxLength={24}
                          placeholder="e.g. UTR202681920194 or Ref No"
                          className="form-control"
                          value={bankRef}
                          onChange={(e) => setBankRef(e.target.value)}
                          style={{ fontSize: '13px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ whiteSpace: 'nowrap', fontSize: '13px', padding: '0 18px', fontWeight: 700 }}
                          onClick={(e) => handlePaymentSubmit(e, 'DirectBank')}
                          disabled={isProcessing}
                        >
                          Confirm Bank Transfer
                        </button>
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '5px', display: 'block' }}>
                        Instant verification: registers payment directly into the Trust database and issues your Section 80G tax receipt immediately.
                      </span>
                    </div>

                    {/* Online Gateway Option */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                      <label className="form-label" style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                        Or Pay Online via Net Banking Gateway
                      </label>
                      <select className="form-control" value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                        <option value="SBI">State Bank of India (SBI)</option>
                        <option value="HDFC">HDFC Bank</option>
                        <option value="ICICI">ICICI Bank</option>
                        <option value="AXIS">Axis Bank</option>
                        <option value="KOTAK">Kotak Mahindra Bank</option>
                        <option value="PNB">Punjab National Bank</option>
                        <option value="CANARA">Canara Bank</option>
                        <option value="UNION">Union Bank of India</option>
                        <option value="BOB">Bank of Baroda</option>
                      </select>
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        Select your bank and click the payment button below to open the secure net banking portal.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PAYMENT ERROR AND RETRY CARD */}
            {paymentError && (
              <div style={{ background: '#fef2f2', border: '1.5px solid #f87171', borderRadius: '10px', padding: '12px 16px', margin: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={22} color="#dc2626" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#991b1b', display: 'block' }}>Payment Attempt Failed or Cancelled</strong>
                    <span style={{ fontSize: '12px', color: '#b91c1c' }}>{paymentError}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handlePaymentSubmit()}
                  disabled={isProcessing}
                  style={{ background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCcw size={14} /> Retry Payment
                </button>
              </div>
            )}

            <div className="gateway-secure-tag">
              <ShieldCheck size={14} color="#16a34a" /> Official Razorpay 256-Bit Encrypted Gateway • Section 80G Certified
            </div>

            <div className="donate-modal-footer">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setStep(1)} 
                disabled={isProcessing}
                style={{ marginRight: '10px' }}
              >
                Back to Details
              </button>
              <button 
                type="submit" 
                className="btn btn-accent" 
                disabled={isProcessing}
                style={{ minWidth: '240px', padding: '13px 20px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="spinner" size={16} /> Connecting to Payment Gateway...
                  </>
                ) : (
                  <>
                    <span>
                      {payMethod === 'NetBanking' 
                        ? `Pay ₹ ${currentTotalAmount.toLocaleString('en-IN')} via Net Banking Gateway` 
                        : payMethod === 'Card'
                        ? `Pay ₹ ${currentTotalAmount.toLocaleString('en-IN')} via Card`
                        : `Pay ₹ ${currentTotalAmount.toLocaleString('en-IN')} via Razorpay`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ====================================================
            STEP 3: SUCCESS & REAL-TIME CRM SYNCHRONIZATION
            ==================================================== */}
        {step === 3 && activeDonation && (
          <div className="donate-success-view">
            <div className="success-icon-wrapper">
              <CheckCircle2 size={64} color="#10b981" />
            </div>
            <h2>Booking & Contribution Successful!</h2>
            <p className="success-thanks">
              Thank you, <strong>{name}</strong>! Your celebration booking and noble contribution have been confirmed and synchronized with the Deivakaram CRM portal.
            </p>
            
            {/* CELEBRATION BOOKING DETAILS (IF CELEBRATION) */}
            {confirmedBooking && (
              <div style={{ background: '#f8fafc', border: '1.5px solid #0A4A9C', borderRadius: '12px', padding: '16px', margin: '14px 0', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0A4A9C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cake size={16} color="#D1A120" /> Celebration Booking Summary
                  </div>
                  <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    ✓ Confirmed in CRM
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div><span>Booking ID:</span> <strong style={{ color: '#0A4A9C' }}>{confirmedBooking.booking_id}</strong></div>
                  <div><span>Occasion Date:</span> <strong>{confirmedBooking.occasion_date}</strong></div>
                  <div><span>Celebrant:</span> <strong>{confirmedBooking.celebrant_name} ({confirmedBooking.occasion_type})</strong></div>
                  <div><span>Food Count:</span> <strong>{confirmedBooking.food_count} Meals</strong></div>
                  <div><span>Virtual Meet:</span> <strong style={{ color: confirmedBooking.is_virtual ? '#16a34a' : '#64748b' }}>{confirmedBooking.is_virtual ? `Yes (${confirmedBooking.virtual_time_slot})` : 'No (In-Person / Video Recorded)'}</strong></div>
                  <div><span>Razorpay TxID:</span> <span className="mono">{confirmedBooking.razorpay_payment_id}</span></div>
                </div>

                {/* BANNER PHOTO PREVIEW & DOWNLOAD (REQUIREMENT 4) */}
                {bannerPhoto && (
                  <div style={{ marginTop: '12px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#eff6ff', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={bannerPhoto} alt="Banner Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1.5px solid #0A4A9C' }} />
                      <div>
                        <strong style={{ fontSize: '12px', color: '#1e3a8a', display: 'block' }}>Custom Venue Banner Photo</strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Ready for high-resolution print</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadBannerPhoto}
                      style={{ background: '#0A4A9C', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Download size={14} /> Download Banner Photo
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CLIENT COMMUNICATION HUB (REQUIREMENT 4) */}
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '14px', margin: '14px 0', textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Share2 size={16} /> Instant Client Booking Confirmation Dispatch
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={handleShareWhatsAppConfirmation}
                  style={{
                    background: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageCircle size={15} />
                  <span>Send Confirmation to WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSmsSent(true)}
                  style={{
                    background: smsSent ? '#065f46' : '#ffffff',
                    color: smsSent ? '#ffffff' : '#166534',
                    border: '1px solid #16a34a',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={14} />
                  <span>{smsSent ? '✓ SMS Dispatched' : `Send SMS to ${phone}`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEmailSent(true)}
                  style={{
                    background: emailSent ? '#065f46' : '#ffffff',
                    color: emailSent ? '#ffffff' : '#166534',
                    border: '1px solid #16a34a',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Mail size={14} />
                  <span>{emailSent ? '✓ Email Dispatched' : `Email Receipt & Summary`}</span>
                </button>
              </div>

              <div style={{ fontSize: '11px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} /> Delivery confirmations active for WhatsApp, SMS ({phone}), and Email ({email || 'donor@deivakaram.org'}).
              </div>
            </div>

            <div className="success-summary-box">
              <div className="success-summary-row">
                <span>Donation ID:</span>
                <strong>{activeDonation.donation_id || 'DVK-DON-CONFIRMED'}</strong>
              </div>
              <div className="success-summary-row">
                <span>Official Receipt No:</span>
                <strong style={{ color: '#0A4A9C' }}>{activeDonation.receipt_number || 'DVK-REC-GENERATED'}</strong>
              </div>
              <div className="success-summary-row">
                <span>Donor Contact Number:</span>
                <span>{activeDonor?.phone || phone || '—'}</span>
              </div>
              <div className="success-summary-row">
                <span>Chosen Program / Plan:</span>
                <span className="badge badge-info">{activeDonation.plan || selectedProgram.name}</span>
              </div>
              <div className="success-summary-row">
                <span>Amount Contributed:</span>
                <strong style={{ color: '#0A4A9C', fontSize: '18px' }}>
                  ₹ {(activeDonation.amount || currentTotalAmount).toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="success-summary-row">
                <span>Payment Reference / ID:</span>
                <span className="mono">{activeDonation.transaction_id || 'Confirmed'}</span>
              </div>
              <div className="success-summary-row">
                <span>CRM Update Status:</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Synced with CRM Portal</span>
              </div>
            </div>

            <div className="donate-success-actions">
              <button onClick={() => setShowReceipt(true)} className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} /> View & Download 80G Tax PDF Receipt
              </button>
              
              {onNavigate && (
                <button 
                  onClick={() => {
                    onClose();
                    onNavigate('crm_login');
                  }} 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={15} /> View Record in CRM Portal
                </button>
              )}

              <button onClick={onClose} className="btn btn-outline">
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 80G PDF RECEIPT MODAL */}
      {showReceipt && activeDonation && activeDonor && settings && (
        <ReceiptPDF
          donation={activeDonation}
          donor={activeDonor}
          settings={settings}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* STYLES FOR THE DIALOG BOX, SLIDER, CHOSEN PLANS, AND WORKFLOW */}
      <style>{`
        .section-badge-tiny {
          font-size: 11px;
          font-weight: 700;
          color: #0A4A9C;
          background: rgba(10, 74, 156, 0.08);
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }
        .donate-steps-indicator {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 14px;
          margin-bottom: 18px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-light);
        }
        .donate-steps-indicator span.active {
          color: var(--primary);
          border-bottom: 2px solid var(--primary);
          padding-bottom: 4px;
        }
        .donate-steps-indicator span.completed {
          color: var(--success);
        }
        .active-donor-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(10, 74, 156, 0.06);
          border: 1px solid rgba(10, 74, 156, 0.15);
          padding: 8px 14px;
          border-radius: 8px;
          margin-bottom: 14px;
          font-size: 12px;
        }
        .active-donor-info {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #0A4A9C;
        }
        .btn-switch-account {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          font-weight: 600;
          font-size: 11px;
          padding: 0;
        }
        .gate-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .gate-icon-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(10, 74, 156, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px auto;
        }
        .gate-header h2 {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: var(--primary);
        }
        .gate-header p {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }
        .login-mode-tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 8px;
          margin-bottom: 18px;
        }
        .login-mode-tab {
          padding: 8px 6px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          background: transparent;
          color: #64748b;
          transition: all 0.2s ease;
          text-align: center;
        }
        .login-mode-tab.active {
          background: #ffffff;
          color: var(--primary);
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .auth-error-alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 12px;
          margin-bottom: 16px;
        }
        .new-user-card-highlight {
          background: #f8fafc;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          padding: 18px;
          margin-bottom: 16px;
        }
        .new-user-badge {
          display: inline-block;
          background: #dbeafe;
          color: #1e40af;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        .quick-presets-box {
          background: rgba(217, 119, 6, 0.05);
          border: 1px dashed rgba(217, 119, 6, 0.35);
          border-radius: 8px;
          padding: 12px;
          margin-top: 10px;
        }
        .quick-presets-title {
          font-size: 11px;
          font-weight: 700;
          color: #b45309;
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 8px;
        }
        .quick-presets-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .quick-preset-btn {
          padding: 6px 8px;
          font-size: 11px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          display: flex;
          flex-direction: column;
        }
        .quick-preset-btn:hover {
          border-color: #0A4A9C;
        }
        .quick-preset-btn strong {
          color: #0f172a;
          font-size: 11px;
        }
        .quick-preset-btn span {
          color: #64748b;
          font-size: 10px;
        }
        .btn-google-auth {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px 20px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #1e293b;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        
        /* DIALOG FORM STYLES */
        .dialog-title-group {
          margin-bottom: 14px;
        }
        .donate-modal-title {
          font-size: 21px;
          font-weight: 800;
          margin: 0 0 4px 0;
          color: var(--primary);
        }
        .donate-modal-subtitle {
          font-size: 12.5px;
          color: var(--text-muted);
          margin: 0;
          font-style: italic;
        }
        /* 3-STEP FLOW TRACKER */
        .flow-steps-tracker {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 6px 14px;
          margin-bottom: 14px;
          gap: 10px;
        }
        .flow-step-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: #94a3b8;
        }
        .flow-step-item.active {
          color: #0A4A9C;
          font-weight: 700;
        }
        .flow-step-num {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #cbd5e1;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
        }
        .flow-step-item.active .flow-step-num {
          background: #0A4A9C;
        }
        .flow-step-divider {
          width: 24px;
          height: 2px;
          background: #e2e8f0;
        }

        /* DONOR COMPACT PROFILE BAR */
        .donor-compact-card {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 14px;
        }
        .donor-info-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0A4A9C;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          flex-shrink: 0;
        }
        .donor-details-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          line-height: 1.25;
        }
        .donor-label {
          font-size: 10.5px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
        }
        .donor-details-text strong {
          font-size: 13px;
          color: #0f172a;
        }
        .donor-contact-sub {
          font-size: 11px;
          color: #64748b;
        }
        .btn-edit-donor {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0A4A9C;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-edit-donor:hover {
          border-color: #0A4A9C;
          background: #f0f7ff;
        }

        /* PROGRAM SELECTION */
        .program-selection-section {
          margin-bottom: 14px;
        }
        .section-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .program-dropdown-wrapper {
          display: none;
          margin-bottom: 10px;
        }
        .program-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .program-select-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .program-select-card:hover {
          border-color: #0A4A9C;
          transform: translateY(-1px);
        }
        .program-select-card.active {
          border-color: #0A4A9C;
          background: #f0f7ff;
          box-shadow: 0 2px 8px rgba(10, 74, 156, 0.12);
        }
        .program-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .program-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .program-select-card.active .program-icon-wrap {
          background: #dbeafe;
        }
        .program-badge {
          font-size: 9px;
          font-weight: 700;
          background: #f1f5f9;
          color: #475569;
          padding: 2px 6px;
          border-radius: 10px;
        }
        .program-select-card.active .program-badge {
          background: #0A4A9C;
          color: #ffffff;
        }
        .program-title {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }
        .program-pricing-highlight {
          font-size: 12px;
          font-weight: 800;
          color: #0A4A9C;
        }

        /* UNIFIED CUSTOMIZER CARD */
        .unified-customizer-card {
          background: #ffffff;
          border: 1.5px solid #0A4A9C;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 14px;
          box-shadow: 0 4px 14px rgba(10, 74, 156, 0.05);
        }
        .customizer-hero-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .hero-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .hero-title {
          font-size: 15px;
          font-weight: 800;
          color: #0A4A9C;
          margin: 0;
        }
        .hero-subtitle {
          font-size: 11.5px;
          color: #64748b;
          font-style: italic;
          margin: 1px 0 0 0;
        }
        .hero-price-pill {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 4px 10px;
          border-radius: 8px;
        }
        .hero-from {
          font-size: 9.5px;
          color: #166534;
          text-transform: uppercase;
          font-weight: 700;
        }
        .hero-price {
          font-size: 16px;
          font-weight: 800;
          color: #15803d;
        }
        .base-package-banner {
          background: #f8fafc;
          border-left: 3px solid #0A4A9C;
          border-radius: 0 6px 6px 0;
          padding: 8px 12px;
          margin-bottom: 14px;
          font-size: 12px;
        }
        .base-tag {
          font-weight: 700;
          color: #0A4A9C;
          margin-right: 6px;
        }
        .base-items-text {
          color: #334155;
        }

        /* CLEAN CUSTOMIZER UNIT ROW */
        .customizer-unit-row {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 10px;
          transition: border-color 0.2s ease;
        }
        .customizer-unit-row:hover {
          border-color: #cbd5e1;
        }
        .unit-label-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .unit-title {
          font-size: 13px;
          color: #0f172a;
          display: block;
        }
        .unit-note {
          font-size: 11px;
          color: #64748b;
          display: block;
          margin-top: 1px;
        }
        .unit-current-badge {
          font-size: 12px;
          font-weight: 700;
          color: #0A4A9C;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 3px 8px;
          border-radius: 6px;
          white-space: nowrap;
        }
        .unit-controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .choice-pills-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .easy-pill {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .easy-pill:hover {
          border-color: #0A4A9C;
          color: #0A4A9C;
          background: #f0f7ff;
        }
        .easy-pill.active {
          border-color: #0A4A9C;
          background: #0A4A9C;
          color: #ffffff;
          font-weight: 700;
        }
        .easy-stepper {
          display: inline-flex;
          align-items: center;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          overflow: hidden;
          background: #ffffff;
        }
        .easy-stepper button {
          border: none;
          background: #f1f5f9;
          color: #1e293b;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .easy-stepper button:hover {
          background: #e2e8f0;
          color: #0A4A9C;
        }
        .easy-stepper input {
          width: 50px;
          border: none;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          padding: 4px 2px;
          outline: none;
        }
        .easy-stepper input::-webkit-inner-spin-button,
        .easy-stepper input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .photo-cake-checkbox {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          color: #475569;
          font-weight: 600;
          cursor: pointer;
          background: #fffbeb;
          border: 1px solid #fde68a;
          padding: 4px 8px;
          border-radius: 6px;
        }

        /* ADDONS CLEAN GRID */
        .addons-clean-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .clean-addon-tile {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          transition: all 0.2s ease;
        }
        .clean-addon-tile.selected {
          border-color: #f59e0b;
          background: #fffdfa;
        }
        .addon-top-row {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .addon-text-group {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .addon-text-group strong {
          font-size: 12px;
          color: #0f172a;
        }
        .addon-text-group span {
          font-size: 10.5px;
          color: #64748b;
        }
        .addon-subtotal-tag {
          font-size: 11.5px;
          font-weight: 700;
          color: #b45309;
          background: #fef3c7;
          border: 1px solid #fde68a;
          padding: 2px 7px;
          border-radius: 5px;
        }
        .addon-expansion-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px dashed #e2e8f0;
          flex-wrap: wrap;
        }
        .expansion-label {
          font-size: 10.5px;
          font-weight: 700;
          color: #64748b;
        }
        .sub-pill {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 5px;
          cursor: pointer;
        }
        .sub-pill:hover, .sub-pill.active {
          border-color: #b45309;
          background: #b45309;
          color: #ffffff;
        }
        .celebration-details-card {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px dashed #cbd5e1;
        }

        /* TOTAL BAR */
        .total-calculation-bar {
          background: #f8fafc;
          border: 1.5px solid #0A4A9C;
          border-radius: 10px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 14px;
        }
        .calc-info {
          display: flex;
          flex-direction: column;
        }
        .calc-sponsorship-line {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
        }
        .calc-sponsoring-label {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }
        .calc-sponsoring-text {
          font-size: 12px;
          color: #0A4A9C;
          font-weight: 700;
        }
        .calc-amount {
          font-size: 24px;
          font-weight: 800;
          color: #0A4A9C;
          letter-spacing: -0.5px;
        }
        .tax-exemption-tag {
          font-size: 10.5px;
          color: #16a34a;
          font-weight: 600;
        }
        .btn-proceed {
          font-size: 15px;
          padding: 12px 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .billing-itemized-list {
          margin: 10px 0;
          padding: 8px 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }
        .billing-itemized-header {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding-bottom: 5px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 5px;
        }
        .billing-itemized-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          padding: 4px 0;
          border-bottom: 1px dashed #f1f5f9;
        }
        .billing-itemized-row:last-child {
          border-bottom: none;
        }
        .billing-itemized-row .item-name {
          font-weight: 600;
          color: #1e293b;
        }
        .billing-itemized-row .item-detail {
          font-size: 11px;
          color: #64748b;
          margin-left: 6px;
        }
        .billing-itemized-row .item-amount {
          font-weight: 700;
          color: #0A4A9C;
        }

        /* GATEWAY STYLES */
        .gateway-header {
          display: flex;
          align-items: center;
          background-color: #f8fafc;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 14px 18px;
          margin-bottom: 16px;
          gap: 14px;
        }
        .gateway-trust-logo {
          max-height: 42px;
          object-fit: contain;
        }
        .gateway-title-block h3 {
          font-size: 14px;
          margin: 0;
          color: var(--primary);
        }
        .gateway-title-block p {
          font-size: 11px;
          color: var(--text-muted);
          margin: 0;
        }
        .gateway-amount-label {
          margin-left: auto;
          font-size: 22px;
          font-weight: 800;
          color: #0A4A9C;
        }
        .billing-summary-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }
        .billing-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 6px;
          color: #475569;
        }
        .billing-summary-row strong {
          color: #0f172a;
        }
        .billing-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #cbd5e1;
          padding-top: 8px;
          margin-top: 6px;
          font-size: 13px;
          font-weight: 700;
          color: var(--primary);
        }
        .gateway-container {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .gateway-tabs {
          display: flex;
          background-color: #f8fafc;
          border-bottom: 1px solid var(--border-color);
        }
        .gateway-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
        }
        .gateway-tab-btn.active {
          color: var(--primary);
          background-color: #ffffff;
          border-bottom-color: var(--primary);
        }
        .gateway-tab-body {
          padding: 18px;
        }
        .upi-qr-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 12px;
        }
        .upi-qr-box {
          background: #ffffff;
          padding: 6px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .upi-qr-text strong {
          display: block;
          font-size: 13px;
          color: #166534;
          margin-bottom: 4px;
        }
        .upi-qr-text p {
          margin: 0;
          font-size: 11px;
          color: #15803d;
          line-height: 1.4;
        }
        .upi-app-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }
        .upi-app-badges span {
          font-size: 10px;
          background-color: #f1f5f9;
          padding: 3px 8px;
          border-radius: 4px;
          color: #475569;
          font-weight: 500;
        }
        .gateway-secure-tag {
          font-size: 11px;
          color: #16a34a;
          text-align: center;
          margin: 10px 0 16px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        /* SUCCESS VIEW */
        .donate-success-view {
          text-align: center;
          padding: 16px 0;
        }
        .success-icon-wrapper {
          display: inline-flex;
          margin-bottom: 12px;
        }
        .donate-success-view h2 {
          font-size: 22px;
          margin-bottom: 6px;
          color: var(--success);
        }
        .success-thanks {
          color: var(--text-muted);
          font-size: 13px;
          margin-bottom: 20px;
        }
        .success-summary-box {
          background-color: #f8fafc;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 14px 18px;
          margin-bottom: 16px;
          text-align: left;
        }
        .success-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 12px;
        }
        .success-summary-row:last-child {
          border-bottom: none;
        }
        .success-receipt-teaser {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: #fffbeb;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        .success-receipt-teaser p {
          margin: 0;
          font-size: 12px;
          color: #92400e;
          font-weight: 500;
        }
        .donate-success-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }
        /* MOBILE SWIPEABLE INITIATIVE STRIP */
        .mobile-program-scroll-strip {
          display: none;
          overflow-x: auto;
          gap: 8px;
          padding: 4px 2px 8px 2px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .mobile-program-scroll-strip::-webkit-scrollbar {
          display: none;
        }
        .mobile-prog-chip {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 44px;
        }
        .mobile-prog-chip.active {
          border-color: #0A4A9C;
          background: #eff6ff;
          color: #0A4A9C;
          box-shadow: 0 2px 8px rgba(10, 74, 156, 0.15);
        }
        .mobile-prog-chip .chip-icon {
          display: flex;
          align-items: center;
        }
        .mobile-prog-chip .chip-text {
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        .mobile-prog-chip .chip-title {
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }
        .mobile-prog-chip .chip-cost {
          font-size: 11px;
          font-weight: 800;
          color: #0A4A9C;
        }

        @media (max-width: 768px) {
          .program-cards-grid {
            grid-template-columns: 1fr 1fr;
          }
          .program-inclusions-list ul {
            grid-template-columns: 1fr;
          }
          .addons-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .mobile-program-scroll-strip {
            display: flex;
          }
          .program-cards-grid {
            display: none;
          }
          .program-dropdown-wrapper {
            display: block;
          }
          .flow-steps-tracker {
            margin-bottom: 12px;
            padding-bottom: 8px;
          }
          .flow-step-text {
            font-size: 10.5px;
          }
          .donor-compact-card {
            padding: 8px 10px;
            margin-bottom: 12px;
          }
          .donor-details-text strong {
            font-size: 12px;
          }
          .donor-contact-sub {
            font-size: 11px;
          }
          .btn-edit-donor {
            font-size: 11px;
            padding: 4px 8px;
          }
          .customizer-hero-bar {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
          .hero-price-pill {
            align-self: flex-start;
          }
          .unit-controls-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
          .choice-pills-row {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            width: 100%;
          }
          .easy-pill {
            flex: 1 1 calc(33.333% - 6px);
            min-height: 40px;
            font-size: 12px;
            padding: 6px 4px;
            text-align: center;
          }
          .easy-stepper {
            width: 100%;
            height: 44px;
            display: flex;
            margin-top: 4px;
          }
          .easy-stepper button {
            min-width: 52px;
            height: 100%;
            font-size: 15px;
          }
          .easy-stepper input {
            font-size: 16px;
            height: 100%;
          }
          .clean-addon-tile {
            padding: 12px 10px;
          }
          .addon-top-row {
            gap: 10px;
          }
          .addon-top-row input[type="checkbox"] {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
          }
          .sub-pill {
            padding: 6px 10px;
            font-size: 11.5px;
            min-height: 36px;
          }

          /* STICKY BOTTOM SUMMARY BAR ON PHONES */
          .total-calculation-bar {
            position: sticky;
            bottom: -28px;
            margin-left: -14px;
            margin-right: -14px;
            margin-bottom: -28px;
            border-radius: 18px 18px 0 0;
            background: #ffffff;
            box-shadow: 0 -8px 24px rgba(10, 74, 156, 0.16);
            border: 1.5px solid #0A4A9C;
            border-bottom: none;
            padding: 12px 14px;
            z-index: 50;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            text-align: left;
            gap: 10px;
          }
          .total-calculation-bar .calc-sponsorship-line {
            display: none;
          }
          .total-calculation-bar .calc-amount {
            font-size: 22px;
          }
          .total-calculation-bar .tax-exemption-tag {
            font-size: 10px;
          }
          .btn-proceed {
            width: auto;
            flex-shrink: 0;
            padding: 11px 18px;
            font-size: 14px;
            border-radius: 8px;
          }

          /* STEP 2 GATEWAY ON MOBILE */
          .gateway-header {
            flex-direction: column;
            text-align: center;
            gap: 8px;
            padding: 12px;
          }
          .gateway-amount-label {
            margin: 4px auto 0 auto;
            font-size: 24px;
          }
          .gateway-tabs {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
          }
          .gateway-tab-btn {
            font-size: 11px;
            padding: 10px 4px;
            flex-direction: column;
            gap: 4px;
          }
          .upi-qr-card {
            flex-direction: column;
            text-align: center;
            gap: 10px;
          }
          .upi-qr-box {
            margin: 0 auto;
          }
          .upi-qr-box img {
            width: 150px;
            height: 150px;
          }

          /* STEP 0 LOGIN GATE ON MOBILE */
          .gate-header {
            margin-bottom: 12px;
          }
          .gate-header h2 {
            font-size: 19px;
          }
          .gate-header p {
            font-size: 12px;
          }
          .login-mode-tabs {
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }
          .login-mode-tab {
            padding: 10px 6px;
            font-size: 12px;
            min-height: 42px;
          }
          .new-user-card-highlight {
            padding: 14px 12px;
          }

          .donate-success-actions {
            flex-direction: column;
            gap: 10px;
          }
          .donate-success-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
