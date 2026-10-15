// DEIVAKARAM CHARITABLE TRUST MOCK DATABASE ENGINE
// Provides standard CRUD interfaces, state persistence, statistics, notifications, and audit logging.

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'donor' | 'sub_admin' | 'super_admin';
  status: 'active' | 'suspended';
  permissions?: string[];
  created_at: string;
}

export interface AdminUser {
  id: string;
  permissions: string[];
  status: 'active' | 'suspended';
}

export interface Donor {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  pan?: string;
  donor_type: 'New Donor' | 'Regular Donor' | 'Major Donor' | 'Monthly Donor' | 'Inactive Donor' | 'Campaign Donor' | 'Anonymous Donor';
  created_at: string;
}

export interface Donation {
  id: string;
  donation_id: string; // DVK-DON-2026-000001
  donor_id: string;
  campaign_id?: string;
  amount: number;
  purpose: 'General Fund' | 'Education' | 'Healthcare' | 'Food' | 'Child Welfare' | 'Women Empowerment' | 'Senior Citizens' | 'Emergency Relief' | 'Specific Campaign';
  plan?: string;
  payment_method: string;
  transaction_id: string;
  payment_status: 'pending' | 'processing' | 'successful' | 'failed' | 'refunded' | 'cancelled';
  receipt_number?: string;
  is_anonymous: boolean;
  message?: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  target_amount: number;
  raised_amount: number;
  start_date: string;
  end_date: string;
  beneficiary_info: string;
  location: string;
  status: 'active' | 'completed' | 'paused' | 'draft';
  gallery: string[];
  updates: Array<{ id: string; date: string; title: string; content: string }>;
  created_at: string;
}

export interface Volunteer {
  id: string;
  volunteer_id: string; // DVK-VOL-000001
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  location: string;
  occupation: string;
  skills: string[];
  interests: string[];
  availability: string;
  experience: string;
  emergency_contact: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'inactive';
  created_at: string;
}

export interface Beneficiary {
  id: string;
  case_id: string; // DVK-CASE-000001
  name: string;
  phone: string;
  email?: string;
  address: string;
  category: 'Medical' | 'Education' | 'Food' | 'Child Welfare' | 'Senior Citizen' | 'Women Support' | 'Emergency' | 'Other';
  description: string;
  family_info: string;
  income_info: string;
  required_assistance: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'submitted' | 'under_review' | 'documents_required' | 'approved' | 'rejected' | 'assistance_provided' | 'closed';
  supporting_docs: string[];
  created_at: string;
}

export interface AssistanceRecord {
  id: string;
  beneficiary_id: string;
  amount: number;
  assistance_type: string;
  date: string;
  notes?: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  time_str: string;
  cover_image: string;
  volunteer_required: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  registrations: string[]; // List of volunteer names or IDs
  created_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  category: 'Education Support' | 'Healthcare Support' | 'Women Empowerment' | 'General' | 'Community Welfare' | 'Elder Care';
  date: string;
  author: string;
  image?: string;
  status: 'published' | 'draft' | 'archived';
  created_at?: string;
}

export interface ContactMessage {
  id: string;
  inquiry_id: string; // DVK-INQ-000001
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'pending' | 'read' | 'resolved';
  created_at: string;
}

export interface Receipt {
  id: string;
  donation_id: string;
  receipt_number: string;
  pdf_url?: string;
  created_at: string;
}

export interface SystemNotification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'donation' | 'volunteer' | 'case' | 'message' | 'alert';
  read_status: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name: string;
  role: string;
  action: string;
  module: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Education' | 'Medical Camps' | 'Food Distribution' | 'Volunteers' | 'Events' | 'Senior Citizens' | 'Child Welfare' | 'Animal Welfare' | 'General';
  media_type: 'image' | 'video';
  url: string;
  thumbnail_url?: string;
  google_drive_file_id: string;
  google_drive_folder_id: string;
  file_name: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

export interface Settings {
  orgName: string;
  orgAddress: string;
  orgEmail: string;
  orgPhone: string;
  trustUpiId?: string;
  socialFacebook: string;
  socialTwitter: string;
  socialInstagram: string;
  socialLinkedin: string;
  paymentGateway: 'Razorpay' | 'Stripe' | 'Cashfree';
  paymentApiKey: string;
  paymentSecretKey: string;
  paymentWebhookUrl: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  smtpSenderName: string;
  smtpSenderEmail: string;
  twoFactorEnabled: boolean;
  googleDriveFolderId?: string;
  googleDriveFolderName?: string;
  googleDriveWebhookUrl?: string;
}

export interface CelebrationBooking {
  id: string;
  booking_id: string; // DVK-CEL-2026-XXXXXX
  donor_id?: string;
  donation_id?: string;
  customer_name: string;
  donor_name?: string;
  customer_phone: string;
  donor_phone?: string;
  customer_email: string;
  donor_email?: string;
  donor_pan?: string;
  celebrant_name: string;
  occasion_type: 'Birthday' | 'Anniversary' | 'Memorial' | 'Other';
  occasion?: 'Birthday' | 'Anniversary' | 'Memorial' | 'Other';
  occasion_date: string;
  banner_photo_url: string;
  banner_image_url?: string;
  banner_photo_name?: string;
  is_virtual: boolean;
  virtual_celebration?: boolean;
  virtual_time_slot?: string;
  food_count: number;
  package_id: string;
  package_name: string;
  cake_details?: string;
  selected_addons?: Array<{ id: string; name: string; quantity: number; amount: number }>;
  addons_selected?: string[];
  total_amount: number;
  amount?: number;
  razorpay_payment_id?: string;
  payment_id?: string;
  razorpay_order_id?: string;
  order_id?: string;
  payment_status: 'pending' | 'successful' | 'failed';
  booking_status: 'pending' | 'confirmed' | 'banner_printed' | 'completed' | 'cancelled';
  status?: 'pending' | 'confirmed' | 'banner_printed' | 'completed' | 'cancelled';
  notes?: string;
  special_instructions?: string;
  created_at: string;
}

export interface DynamicPackage {
  id: string;
  name: string;
  title?: string;
  basePrice: number;
  base_price?: number;
  minFoodCount: number;
  min_meals?: number;
  tagline: string;
  description?: string;
  badge?: string;
  icon?: 'cake' | 'video' | 'elder' | 'child' | 'animal' | 'general';
  inclusions: string[];
  note?: string;
  is_popular?: boolean;
  is_active: boolean;
  updated_at?: string;
}

export interface DynamicAddon {
  id: string;
  name: string;
  price: number;
  desc?: string;
  description?: string;
  unit?: string;
  isPerUnit?: boolean;
  is_active: boolean;
  updated_at?: string;
}

// Internal Database Schema type
interface MockSchema {
  users: User[];
  admin_users: Record<string, AdminUser>;
  donors: Donor[];
  donations: Donation[];
  campaigns: Campaign[];
  volunteers: Volunteer[];
  beneficiaries: Beneficiary[];
  assistance_records: AssistanceRecord[];
  events: Event[];
  contact_messages: ContactMessage[];
  receipts: Receipt[];
  notifications: SystemNotification[];
  audit_logs: AuditLog[];
  settings: Settings;
  gallery_items: GalleryItem[];
  celebration_bookings: CelebrationBooking[];
  packages: DynamicPackage[];
  addons: DynamicAddon[];
  news: NewsArticle[];
}

const STORAGE_KEY = 'deivakaram_mock_db';

// ----------------------------------------------------
// SEEDING DATA
// ----------------------------------------------------
const SEED_USERS: User[] = [
  { id: 'usr-1', name: 'Super Admin User', email: 'admin@deivakaram.org', phone: '+919876543210', role: 'super_admin', status: 'active', created_at: '2026-01-01T10:00:00Z' },
  { id: 'usr-2', name: 'Ramanathan K', email: 'ramanathan@deivakaram.org', phone: '+919876543211', role: 'sub_admin', status: 'active', created_at: '2026-02-15T09:30:00Z' },
  { id: 'usr-3', name: 'Meera S', email: 'meera@deivakaram.org', phone: '+919876543212', role: 'sub_admin', status: 'active', created_at: '2026-03-01T11:45:00Z' },
  { id: 'usr-4', name: 'Ananth Kumar', email: 'ananth@gmail.com', phone: '+919840123456', role: 'donor', status: 'active', created_at: '2026-04-10T12:00:00Z' },
  { id: 'usr-5', name: 'Deepa Lakshmi', email: 'deepa@gmail.com', phone: '+919840789012', role: 'donor', status: 'active', created_at: '2026-05-18T14:20:00Z' }
];

const SEED_ADMIN_USERS: Record<string, AdminUser> = {
  'usr-1': { id: 'usr-1', permissions: ['donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns', 'events', 'content', 'reports', 'settings', 'admins', 'logs'], status: 'active' },
  'usr-2': { id: 'usr-2', permissions: ['donations', 'donors', 'volunteers', 'events'], status: 'active' },
  'usr-3': { id: 'usr-3', permissions: ['beneficiaries', 'reports', 'content'], status: 'active' }
};

const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp-1',
    title: 'Dr. APJ Abdul Kalam Memorial Scholarship 2026',
    description: 'Providing full academic tuition sponsorships, textbooks, and laptops to 100 meritorious students from economically marginalized backgrounds pursuing higher education in Tamil Nadu.',
    cover_image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800',
    target_amount: 1500000,
    raised_amount: 1245000,
    start_date: '2026-04-01',
    end_date: '2026-10-31',
    beneficiary_info: 'Underprivileged college students in Rural and Urban parts of South India.',
    location: 'Chennai, Madurai, Trichy',
    status: 'active',
    gallery: [
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=400'
    ],
    updates: [
      { id: 'upd-1-1', date: '2026-05-15', title: 'Phase 1 Scholarships Awarded', content: 'Distributed scholarships worth ₹5,00,000 to the first batch of 35 engineering and science stream students.' }
    ],
    created_at: '2026-03-20T10:00:00Z'
  },
  {
    id: 'cmp-2',
    title: 'Mobile Healthcare Clinic & Diagnostic Camps',
    description: 'Equipping a custom medical van with essential diagnostic gear (ECG, diabetes check, vitals screening) to conduct weekly medical relief camps and distribute free medicines across 50 tribal villages.',
    cover_image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    target_amount: 800000,
    raised_amount: 680000,
    start_date: '2026-03-01',
    end_date: '2026-09-30',
    beneficiary_info: 'Tribal communities and rural farmers in Jawadhu Hills and Eastern Ghats villages.',
    location: 'Javadi Hills, Tiruvannamalai',
    status: 'active',
    gallery: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400'
    ],
    updates: [
      { id: 'upd-2-1', date: '2026-06-10', title: 'Healthcare Camp in Jamunamarathur', content: 'Screened 320 people for diabetes and hypertension. Distributed free eye-care glasses and cardiac medicines.' }
    ],
    created_at: '2026-02-10T09:00:00Z'
  },
  {
    id: 'cmp-3',
    title: 'Deivakaram Annadanam Project - Hunger Alleviation',
    description: 'Our flagship program providing hot nutritious meals and monthly grocery support kits to homeless individuals, daily wage workers, and struggling senior citizens.',
    cover_image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    target_amount: 500000,
    raised_amount: 512000,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    beneficiary_info: 'Homeless shelters, street-dwelling elders, and daily wage workers.',
    location: 'Chennai Central, Tambaram, Koyambedu',
    status: 'completed',
    gallery: [],
    updates: [
      { id: 'upd-3-1', date: '2026-07-01', title: 'Target Reached! Campaign Completed', content: 'Thanks to the generous community, we achieved and surpassed our targets. Deliveries will continue throughout the year.' }
    ],
    created_at: '2025-12-25T11:00:00Z'
  },
  {
    id: 'cmp-4',
    title: 'Self-Reliance & Tailoring Center for Women',
    description: 'Empowering marginalized women and single mothers with technical tailoring courses, business mentorship, and providing free sewing machines to graduates to kickstart home businesses.',
    cover_image: 'https://images.unsplash.com/photo-1489533119213-66a5cd877091?auto=format&fit=crop&q=80&w=800',
    target_amount: 600000,
    raised_amount: 320000,
    start_date: '2026-05-01',
    end_date: '2026-11-30',
    beneficiary_info: 'Widows, single mothers, and unemployed young women.',
    location: 'Kanchipuram, Chengalpattu',
    status: 'active',
    gallery: [],
    updates: [],
    created_at: '2026-04-15T15:00:00Z'
  },
  {
    id: 'cmp-5',
    title: 'Emergency Flood Mitigation and Relief Fund',
    description: 'Creating a standby emergency response fund for rapid distribution of blankets, tarpaulins, dry rations, first-aid kits, and water purification tablets during seasonal monsoons.',
    cover_image: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=800',
    target_amount: 1000000,
    raised_amount: 150000,
    start_date: '2026-07-01',
    end_date: '2026-12-31',
    beneficiary_info: 'Low-lying coastal areas and flood-prone slums.',
    location: 'Cuddalore, Chennai, Thoothukudi',
    status: 'active',
    gallery: [],
    updates: [],
    created_at: '2026-06-25T08:30:00Z'
  }
];

const firstNames = ['Rajesh', 'Suresh', 'Amit', 'Vijay', 'Arun', 'Priya', 'Karthik', 'Sanjay', 'Divya', 'Anjali', 'Vikram', 'Ramesh', 'Harish', 'Nisha', 'Sunita', 'Kiran', 'Deepak', 'Manoj', 'Asha', 'Ganesh', 'Lakshmi', 'Narayanan', 'Balaji', 'Swathi', 'Srinivasan'];
const lastNames = ['Kumar', 'Sharma', 'Iyer', 'Pillai', 'Reddy', 'Patel', 'Singh', 'Nair', 'Verma', 'Gupta', 'Sen', 'Das', 'Joshi', 'Menon', 'Rao', 'Babu', 'Subramanian', 'Krishnan', 'Chandran', 'Sundaram', 'Murthy', 'Prasad', 'Raman', 'Swamy', 'Naidu'];
const states = ['Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Kerala', 'Maharashtra', 'Delhi'];
const cities = ['Chennai', 'Bengaluru', 'Hyderabad', 'Kochi', 'Mumbai', 'New Delhi'];

// Deterministic seed helper
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Generate seeded donors
const SEED_DONORS: Donor[] = [];
for (let i = 1; i <= 25; i++) {
  const rand1 = seededRandom(i * 11);
  const rand2 = seededRandom(i * 22);
  const rand3 = seededRandom(i * 33);
  const rand4 = seededRandom(i * 44);

  const fName = firstNames[Math.floor(rand1 * firstNames.length)];
  const lName = lastNames[Math.floor(rand2 * lastNames.length)];
  const city = cities[Math.floor(rand4 * cities.length)];
  const state = states[Math.floor(rand4 * states.length)];
  const address = `${Math.floor(rand1 * 120 + 1)}, Gandhi Street, ${city}, ${state} - 60000${i}`;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let dName = `${fName} ${lName}`;
  let dEmail = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@gmail.com`;
  let dPhone = `+91984${Math.floor(rand3 * 9000000 + 1000000)}`;
  let dPan = `${alphabet[Math.floor(rand1 * 26)]}${alphabet[Math.floor(rand2 * 26)]}${alphabet[Math.floor(rand3 * 26)]}P${alphabet[Math.floor(rand4 * 26)]}${Math.floor(rand1 * 9000 + 1000)}${alphabet[Math.floor(rand2 * 26)]}`;

  if (i === 1) {
    dName = 'Ananth Kumar';
    dEmail = 'ananth@gmail.com';
    dPhone = '+919840123456';
    dPan = 'ABCDE1234F';
  } else if (i === 2) {
    dName = 'Deepa Lakshmi';
    dEmail = 'deepa@gmail.com';
    dPhone = '+919840789012';
    dPan = 'FGHIJ5678K';
  }

  let donor_type: Donor['donor_type'] = 'New Donor';
  if (i <= 5) donor_type = 'Major Donor';
  else if (i <= 12) donor_type = 'Regular Donor';
  else if (i <= 16) donor_type = 'Monthly Donor';
  else if (i === 18 || i === 22) donor_type = 'Anonymous Donor';

  SEED_DONORS.push({
    id: `dnr-${i}`,
    user_id: i === 1 ? 'usr-4' : i === 2 ? 'usr-5' : undefined,
    name: dName,
    email: dEmail,
    phone: dPhone,
    address,
    pan: dPan,
    donor_type,
    created_at: new Date(2025, i % 12, (i * 7) % 28).toISOString()
  });
}

// Generate seeded donations
const SEED_DONATIONS: Donation[] = [];
const purposes: Donation['purpose'][] = ['General Fund', 'Education', 'Healthcare', 'Food', 'Child Welfare', 'Women Empowerment', 'Senior Citizens', 'Emergency Relief'];
const paymentMethods = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking'];

let donationSeq = 1;
for (let i = 1; i <= 60; i++) {
  const r1 = seededRandom(i * 1.5);
  const r2 = seededRandom(i * 2.5);
  const r3 = seededRandom(i * 3.5);
  const r4 = seededRandom(i * 4.5);

  const donor = SEED_DONORS[Math.floor(r1 * SEED_DONORS.length)];
  const campaign = r2 > 0.3 ? SEED_CAMPAIGNS[Math.floor(r3 * SEED_CAMPAIGNS.length)] : undefined;
  
  // Align purpose with campaign
  let purpose: Donation['purpose'] = purposes[Math.floor(r4 * purposes.length)];
  if (campaign) {
    if (campaign.id === 'cmp-1') purpose = 'Education';
    else if (campaign.id === 'cmp-2') purpose = 'Healthcare';
    else if (campaign.id === 'cmp-3') purpose = 'Food';
    else if (campaign.id === 'cmp-4') purpose = 'Women Empowerment';
    else if (campaign.id === 'cmp-5') purpose = 'Emergency Relief';
  }

  let amount = 500;
  if (donor.donor_type === 'Major Donor') {
    amount = [10000, 15000, 20000, 25000, 50000][Math.floor(r1 * 5)];
  } else if (donor.donor_type === 'Regular Donor') {
    amount = [2000, 3000, 5000, 7500][Math.floor(r2 * 4)];
  } else {
    amount = [500, 1000, 1500, 2000][Math.floor(r3 * 4)];
  }

  const pMethod = paymentMethods[Math.floor(r4 * paymentMethods.length)];
  const txnId = `pay_${Math.floor(r1 * 90000000 + 10000000)}`;
  const dateObj = new Date(2026, Math.floor(r2 * 8), Math.floor(r3 * 27) + 1, Math.floor(r4 * 23), Math.floor(r1 * 59));
  
  let payment_status: Donation['payment_status'] = 'successful';
  if (i === 15 || i === 42) payment_status = 'failed';
  else if (i === 28) payment_status = 'pending';
  else if (i === 55) payment_status = 'refunded';

  const donationIdStr = `DVK-DON-2026-${String(donationSeq++).padStart(6, '0')}`;
  const receiptNum = payment_status === 'successful' ? `DVK-REC-${20260000 + i}` : undefined;

  const samplePlans = [
    'One-Time Contribution',
    'Monthly Annadanam Sponsor',
    'Elder Healthcare Patron',
    'Child Education Sponsor',
    'Monthly Care Supporter',
    'Quarterly Community Pillar',
    'Annual Foundation Benefactor'
  ];
  const assignedPlan = donor.donor_type === 'Monthly Donor' 
    ? (i % 2 === 0 ? 'Monthly Annadanam Sponsor' : 'Monthly Care Supporter') 
    : samplePlans[i % samplePlans.length];

  SEED_DONATIONS.push({
    id: `don-${i}`,
    donation_id: donationIdStr,
    donor_id: donor.id,
    campaign_id: campaign?.id,
    amount,
    purpose,
    plan: assignedPlan,
    payment_method: pMethod,
    transaction_id: txnId,
    payment_status,
    receipt_number: receiptNum,
    is_anonymous: donor.donor_type === 'Anonymous Donor' || r4 > 0.85,
    message: r3 > 0.6 ? 'Keep up the excellent divine service!' : undefined,
    created_at: dateObj.toISOString()
  });
}

// Generate seeded volunteers
const SEED_VOLUNTEERS: Volunteer[] = [];
const volunteerSkills = ['Teaching', 'First Aid', 'Cooking', 'Event Management', 'Public Speaking', 'Social Media', 'Photography', 'Coding', 'Data Entry', 'Logistics'];
const volunteerInterests = ['Education', 'Healthcare', 'Food Distribution', 'Event Management', 'Fundraising', 'Social Media', 'Photography', 'Technology', 'Administration', 'Field Work'];

for (let i = 1; i <= 20; i++) {
  const r1 = seededRandom(i * 1.7);
  const r2 = seededRandom(i * 2.7);
  const r3 = seededRandom(i * 3.7);
  const r4 = seededRandom(i * 4.7);

  const fName = firstNames[Math.floor(r1 * firstNames.length)];
  const lName = lastNames[Math.floor(r2 * lastNames.length)];
  const name = `${fName} ${lName}`;
  const email = `${fName.toLowerCase()}.${lName.toLowerCase()}@volunteer.org`;
  const phone = `+91986${Math.floor(r3 * 9000000 + 1000000)}`;
  const city = cities[Math.floor(r4 * cities.length)];
  const age = Math.floor(r1 * 40) + 18;
  const status: Volunteer['status'] = i <= 14 ? 'approved' : i <= 17 ? 'submitted' : i <= 19 ? 'under_review' : 'rejected';

  SEED_VOLUNTEERS.push({
    id: `vol-${i}`,
    volunteer_id: `DVK-VOL-${String(i).padStart(6, '0')}`,
    name,
    email,
    phone,
    age,
    location: `${city}, India`,
    occupation: ['Student', 'IT Professional', 'Teacher', 'Self Employed', 'Retired'][Math.floor(r2 * 5)],
    skills: [volunteerSkills[Math.floor(r1 * volunteerSkills.length)], volunteerSkills[Math.floor(r4 * volunteerSkills.length)]].filter((v, idx, self) => self.indexOf(v) === idx),
    interests: [volunteerInterests[Math.floor(r3 * volunteerInterests.length)], volunteerInterests[Math.floor(r2 * volunteerInterests.length)]].filter((v, idx, self) => self.indexOf(v) === idx),
    availability: ['Weekends', 'Weekdays', 'Evenings', 'Flexible'][Math.floor(r4 * 4)],
    experience: i % 3 === 0 ? 'Worked at local NGO coordinates blood camps.' : 'First time volunteering, highly eager to support!',
    emergency_contact: `Emergency Contact: ${lastNames[Math.floor(r2 * lastNames.length)]} - +91900${Math.floor(r1 * 9000000 + 1000000)}`,
    status,
    created_at: new Date(2026, Math.floor(r3 * 6), Math.floor(r4 * 28)).toISOString()
  });
}

// Generate seeded beneficiary cases
const SEED_BENEFICIARIES: Beneficiary[] = [];
const caseDetails = [
  { cat: 'Medical', req: 'Heart surgery assistance', desc: 'Patient requires emergency cardiac stent placement. Family income is insufficient to cover hospital costs.', pri: 'Critical' },
  { cat: 'Education', req: 'College tuition fees support', desc: 'Exemplary student scoring 95% in HSC needs support to pay her B.Tech first year semester fees.', pri: 'High' },
  { cat: 'Food', req: 'Dry ration kit request for village', desc: 'A remote settlement has been cut off due to minor landslides. Rations needed for 20 families.', pri: 'High' },
  { cat: 'Child Welfare', req: 'Orphanage basic supply request', desc: 'Local orphanage housing 35 kids needs dry grocery items and bedsheets for the upcoming monsoon.', pri: 'Medium' },
  { cat: 'Senior Citizen', req: 'Geriatric medical care expense', desc: 'Elderly bedridden widow living alone requires monthly supplies of hypertension and arthritis medicines.', pri: 'Medium' },
  { cat: 'Women Support', req: 'Self-employment sewing machine', desc: 'Single mother of two daughters wishes to set up a tailoring unit at home but lacks capital for a machine.', pri: 'Medium' },
  { cat: 'Emergency', req: 'Accidental house fire relief', desc: 'Laborer family lost all their household goods and roof in a tragic electrical fire. Urgently needs shelter materials.', pri: 'Critical' },
  { cat: 'Other', req: 'Community drinking water pump repair', desc: 'The borewell handpump in a slum community is broken, forcing mothers to walk 3km for water.', pri: 'High' }
];

for (let i = 1; i <= 15; i++) {
  const r1 = seededRandom(i * 1.9);
  const r2 = seededRandom(i * 2.9);
  const r3 = seededRandom(i * 3.9);
  const r4 = seededRandom(i * 4.9);

  const detail = caseDetails[i % caseDetails.length];
  const fName = firstNames[Math.floor(r1 * firstNames.length)];
  const lName = lastNames[Math.floor(r2 * lastNames.length)];
  const name = `${fName} ${lName}`;
  const phone = `+91987${Math.floor(r3 * 9000000 + 1000000)}`;
  const city = cities[Math.floor(r4 * cities.length)];
  
  let status: Beneficiary['status'] = 'submitted';
  if (i <= 4) status = 'assistance_provided';
  else if (i <= 7) status = 'approved';
  else if (i <= 10) status = 'under_review';
  else if (i <= 12) status = 'documents_required';
  else if (i === 13) status = 'closed';
  else if (i === 14) status = 'rejected';

  SEED_BENEFICIARIES.push({
    id: `ben-${i}`,
    case_id: `DVK-CASE-${String(i).padStart(6, '0')}`,
    name,
    phone,
    email: `${fName.toLowerCase()}@example.com`,
    address: `No. ${Math.floor(r1 * 40 + 10)}, Amman Temple Road, ${city}, India`,
    category: detail.cat as Beneficiary['category'],
    description: `${detail.desc} Verified local reports confirm genuine distress.`,
    family_info: `Dependents: ${Math.floor(r2 * 4) + 1} members. Annual family income below ₹60,000.`,
    income_info: `Income Source: Daily wage manual labor (Avg ₹300/day, irregular).`,
    required_assistance: `Financial aid of ₹${[15000, 25000, 5000, 8000, 45000][i % 5]} or direct material supply.`,
    priority: detail.pri as Beneficiary['priority'],
    status,
    supporting_docs: ['income_certificate.pdf', 'medical_report.pdf', 'recommendation_letter.jpg'].slice(0, Math.floor(r3 * 3) + 1),
    created_at: new Date(2026, Math.floor(r4 * 7), Math.floor(r1 * 28) + 1).toISOString()
  });
}

// Generate seeded events
const SEED_EVENTS: Event[] = [
  {
    id: 'evt-1',
    title: 'Dr. APJ Abdul Kalam Scholarship Presentation Ceremony',
    description: 'Annual distribution ceremony where education scholarships will be formally handed over to the selected candidates. Prominent academicians will present keynotes.',
    location: 'Anna University Alumni Hall, Chennai',
    event_date: '2026-09-05T10:00:00Z',
    time_str: '10:00 AM - 01:00 PM',
    cover_image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400',
    volunteer_required: 15,
    status: 'upcoming',
    registrations: ['Rajesh Kumar', 'Vijay Nair', 'Anjali Sen'],
    created_at: '2026-06-01T10:00:00Z'
  },
  {
    id: 'evt-2',
    title: 'Rural Mega Medical & Dental Camp - Jawadhu Hills',
    description: 'Providing free health checks, blood pressure screenings, sugar tests, dental extraction, and pediatric nutrition consultations along with free pharmaceutical distribution.',
    location: 'Government School Ground, Jamunamarathur',
    event_date: '2026-09-20T08:00:00Z',
    time_str: '08:00 AM - 04:00 PM',
    cover_image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=400',
    volunteer_required: 25,
    status: 'upcoming',
    registrations: ['Amit Sharma', 'Suresh Iyer', 'Karthik Pillai', 'Priya Reddy'],
    created_at: '2026-06-15T09:00:00Z'
  },
  {
    id: 'evt-3',
    title: 'Annadanam Food & Grocery Kit Distribution Drive',
    description: 'Distributing grocery supply bags containing rice, lentils, oil, and spices to 150 daily wage worker families impacted by seasonal work closures.',
    location: 'Deivakaram Trust Center, Koyambedu, Chennai',
    event_date: '2026-08-15T09:00:00Z',
    time_str: '09:00 AM - 01:00 PM',
    cover_image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=400',
    volunteer_required: 10,
    status: 'completed',
    registrations: ['Deepak Sen', 'Manoj Joshi', 'Lakshmi Prasad'],
    created_at: '2026-07-01T12:00:00Z'
  },
  {
    id: 'evt-4',
    title: 'Volunteers Meet & Annual Plan Briefing',
    description: 'An interactive session for all registered volunteers of Deivakaram to meet the core trustees, align on upcoming campaigns, and suggest program refinements.',
    location: 'YMCA Hall, Royapettah, Chennai',
    event_date: '2026-08-25T16:00:00Z',
    time_str: '04:00 PM - 06:30 PM',
    cover_image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400',
    volunteer_required: 0,
    status: 'upcoming',
    registrations: [],
    created_at: '2026-08-01T11:00:00Z'
  },
  {
    id: 'evt-5',
    title: 'Tailoring Center Inauguration & Machines Handover',
    description: 'Official inauguration of the newly funded women empowerment workspace. Handing over 15 industrial sewing machines to the self-help cohort graduates.',
    location: 'Deivakaram Center, Kanchipuram',
    event_date: '2026-07-10T11:00:00Z',
    time_str: '11:00 AM - 01:30 PM',
    cover_image: 'https://images.unsplash.com/photo-1489533119213-66a5cd877091?auto=format&fit=crop&q=80&w=400',
    volunteer_required: 5,
    status: 'completed',
    registrations: ['Nisha Das', 'Sunita Joshi'],
    created_at: '2026-06-10T09:30:00Z'
  }
];

const SEED_NEWS: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Over 120 Students Empowered with Scholarships this Academic Year',
    description: 'Deivakaram Charitable Trust holds its academic distribution meet to clear pending college dues and distribute textbooks to underprivileged scholars.',
    category: 'Education Support',
    date: '2026-07-28',
    author: 'Trust Secretariat',
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400',
    status: 'published'
  },
  {
    id: 'news-2',
    title: 'Emergency Medical Camps Organized in Coastal Villages',
    description: 'Medical camps screen 450+ patients, offering free diagnostics, pediatric screenings, cardiac support, and free pharmaceutical medicines.',
    category: 'Healthcare Support',
    date: '2026-07-15',
    author: 'Dr. Ramesh Kumar (Chief Medical Trustee)',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=400',
    status: 'published'
  },
  {
    id: 'news-3',
    title: 'Trust Establishes Free Skill Tailoring Center for Kanchipuram Women',
    description: 'Aiming to build entrepreneurship, the trust sets up a self-reliance center with sewing machines, technical trainers, and marketing support.',
    category: 'Women Empowerment',
    date: '2026-06-30',
    author: 'Trustee Board',
    image: 'https://images.unsplash.com/photo-1489533119213-66a5cd877091?auto=format&fit=crop&q=80&w=400',
    status: 'published'
  }
];

const SEED_SUCCESS = [
  {
    id: 'succ-1',
    title: 'From Slum to Software Engineer: Kausalya’s Inspiring Journey',
    story: 'Kausalya, daughter of a street vendor, scored excellent grades but could not pay university fees. Deivakaram sponsored her entire 4-year Engineering tuition. She is now placed in a global tech firm, lifting her family out of poverty.',
    before: 'Struggling to afford two meals a day, facing drop-out from engineering.',
    after: 'Graduated B.E Computer Science, employed as Software Engineer, supporting parents.',
    location: 'Madurai, TN',
    program: 'Scholarships Program'
  },
  {
    id: 'succ-2',
    title: 'Successful Cardiac Surgery of 6-Year-Old Sanjay',
    story: 'Sanjay had a congenital heart disease requiring immediate surgery worth ₹3.5 Lakhs. His father, a farm worker, was desperate. Deivakaram intervened, reconciled hospital invoices, raised emergency campaign funds, and successfully sponsored the surgery.',
    before: 'Severe respiratory distress, family without funds to afford surgical care.',
    after: 'Post-operative recovery fully complete. Sanjay is actively going to school.',
    location: 'Salem Rural, TN',
    program: 'Emergency Medical Care'
  }
];

const SEED_LOGS: AuditLog[] = [
  { id: 'log-1', user_name: 'Super Admin User', role: 'super_admin', action: 'database_initialized', module: 'Settings', created_at: '2026-08-01T00:00:00Z' },
  { id: 'log-2', user_name: 'Meera S', role: 'sub_admin', action: 'approved_volunteer', module: 'Volunteers', record_id: 'vol-3', created_at: '2026-08-10T11:20:00Z' },
  { id: 'log-3', user_name: 'Super Admin User', role: 'super_admin', action: 'created_campaign', module: 'Campaigns', record_id: 'cmp-5', created_at: '2026-08-12T14:40:00Z' }
];

export const SEED_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Scholarship Presentation Chennai',
    category: 'Education',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600',
    thumbnail_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=300',
    google_drive_file_id: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ01',
    google_drive_folder_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    file_name: 'scholarship_presentation_2026.jpg',
    file_size: 1420500,
    created_at: '2026-08-10T10:00:00Z'
  },
  {
    id: 'gal-2',
    title: 'Eye Diagnostics Jawadhu Hills',
    category: 'Medical Camps',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600',
    thumbnail_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=300',
    google_drive_file_id: '1bBcDeFgHiJkLmNoPqRsTuVwXyZ02',
    google_drive_folder_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    file_name: 'eye_diagnostics_camp.jpg',
    file_size: 2180400,
    created_at: '2026-08-12T14:30:00Z'
  },
  {
    id: 'gal-3',
    title: 'Annadanam Feeding Koyambedu',
    category: 'Food Distribution',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600',
    thumbnail_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=300',
    google_drive_file_id: '1cBcDeFgHiJkLmNoPqRsTuVwXyZ03',
    google_drive_folder_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    file_name: 'annadanam_koyambedu_feeding.jpg',
    file_size: 1890200,
    created_at: '2026-08-14T09:15:00Z'
  },
  {
    id: 'gal-4',
    title: 'Volunteers Core Meet Royapettah',
    category: 'Volunteers',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1559027615-cdbe687d8a4b?auto=format&fit=crop&q=80&w=600',
    thumbnail_url: 'https://images.unsplash.com/photo-1559027615-cdbe687d8a4b?auto=format&fit=crop&q=80&w=300',
    google_drive_file_id: '1dBcDeFgHiJkLmNoPqRsTuVwXyZ04',
    google_drive_folder_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    file_name: 'volunteers_core_meet.jpg',
    file_size: 1650300,
    created_at: '2026-08-15T11:00:00Z'
  },
  {
    id: 'gal-5',
    title: 'Textbooks Distribution Drive',
    category: 'Education',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
    thumbnail_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=300',
    google_drive_file_id: '1eBcDeFgHiJkLmNoPqRsTuVwXyZ05',
    google_drive_folder_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    file_name: 'textbooks_distribution_drive.jpg',
    file_size: 2010800,
    created_at: '2026-08-16T16:20:00Z'
  },
  {
    id: 'gal-6',
    title: 'Free Medicines Distribution',
    category: 'Medical Camps',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600',
    thumbnail_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=300',
    google_drive_file_id: '1fBcDeFgHiJkLmNoPqRsTuVwXyZ06',
    google_drive_folder_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    file_name: 'free_medicines_supply.jpg',
    file_size: 1750000,
    created_at: '2026-08-17T13:45:00Z'
  },
  {
    id: 'gal-7',
    title: 'Birthday Annadhanam & Cake Celebration',
    category: 'Food Distribution',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600',
    thumbnail_url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=300',
    google_drive_file_id: '1gBcDeFgHiJkLmNoPqRsTuVwXyZ07',
    google_drive_folder_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    file_name: 'birthday_annadhanam_celebration.jpg',
    file_size: 1980000,
    created_at: '2026-08-20T12:00:00Z'
  },
  {
    id: 'gal-8',
    title: 'Old Age Home Festive Feast & Care Drive',
    category: 'Senior Citizens',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&q=80&w=600',
    thumbnail_url: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&q=80&w=300',
    google_drive_file_id: '1hBcDeFgHiJkLmNoPqRsTuVwXyZ08',
    google_drive_folder_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    file_name: 'old_age_home_feast.jpg',
    file_size: 2150000,
    created_at: '2026-08-22T14:00:00Z'
  },
  {
    id: 'gal-9',
    title: 'Orphanage Children Hot Meals & School Kits',
    category: 'Child Welfare',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600',
    thumbnail_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=300',
    google_drive_file_id: '1iBcDeFgHiJkLmNoPqRsTuVwXyZ09',
    google_drive_folder_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    file_name: 'orphanage_meals_stationery.jpg',
    file_size: 1820000,
    created_at: '2026-08-25T11:30:00Z'
  },
  {
    id: 'gal-10',
    title: 'Street Feeding Drive for Stray Animals',
    category: 'Animal Welfare',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=600',
    thumbnail_url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=300',
    google_drive_file_id: '1jBcDeFgHiJkLmNoPqRsTuVwXyZ10',
    google_drive_folder_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    file_name: 'stray_animals_street_feeding.jpg',
    file_size: 1640000,
    created_at: '2026-08-28T09:00:00Z'
  }
];

// Initialize database object
const INITIAL_DATABASE: MockSchema = {
  users: SEED_USERS,
  admin_users: SEED_ADMIN_USERS,
  donors: SEED_DONORS,
  donations: SEED_DONATIONS,
  campaigns: SEED_CAMPAIGNS,
  volunteers: SEED_VOLUNTEERS,
  beneficiaries: SEED_BENEFICIARIES,
  assistance_records: [],
  events: SEED_EVENTS,
  contact_messages: [
    { id: 'msg-1', inquiry_id: 'DVK-INQ-000001', name: 'Alok Mishra', email: 'alok@gmail.com', phone: '+919999888877', subject: 'Corporate CSR Partnership', message: 'We wish to explore a collaboration for educational sponsorships in Madurai school clusters.', status: 'pending', created_at: '2026-08-12T10:00:00Z' },
    { id: 'msg-2', inquiry_id: 'DVK-INQ-000002', name: 'Saranya Dev', email: 'saranya@yahoo.com', subject: 'Volunteer opportunity', message: 'I have experience in medical camps and want to volunteer for the upcoming camp.', status: 'resolved', created_at: '2026-08-05T09:30:00Z' }
  ],
  receipts: SEED_DONATIONS.filter(d => d.payment_status === 'successful').map(d => ({
    id: `rec-${d.id}`,
    donation_id: d.id,
    receipt_number: d.receipt_number || `DVK-REC-${d.transaction_id}`,
    created_at: d.created_at
  })),
  notifications: [
    { id: 'not-1', title: 'New Donation Received', message: '₹25,000 received from Arun Pillai for Education.', type: 'donation', read_status: false, created_at: '2026-08-17T10:00:00Z' },
    { id: 'not-2', title: 'New Volunteer Application', message: 'Ganesh Krishnan submitted volunteer profile.', type: 'volunteer', read_status: false, created_at: '2026-08-17T08:30:00Z' }
  ],
  audit_logs: SEED_LOGS,
  gallery_items: SEED_GALLERY_ITEMS,
  news: SEED_NEWS,
  celebration_bookings: [
    {
      id: 'cel-1',
      booking_id: 'DVK-CEL-2026-891024',
      customer_name: 'Ananth Kumar',
      customer_phone: '+919840123456',
      customer_email: 'ananth@gmail.com',
      celebrant_name: 'Master Rohan Kumar',
      occasion_type: 'Birthday',
      occasion_date: '2026-09-25',
      banner_photo_url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=400',
      banner_photo_name: 'rohan_birthday_banner.jpg',
      is_virtual: true,
      virtual_time_slot: '3:00 PM – 6:00 PM',
      food_count: 50,
      package_id: 'birthday_anniversary',
      package_name: '1. Birthday / Anniversary Donation',
      cake_details: '1kg Photo Cake',
      selected_addons: [
        { id: 'photo_cake', name: 'Photo Cake', quantity: 1, amount: 800 },
        { id: 'rose_milk', name: 'Rose Milk (10 glasses)', quantity: 2, amount: 300 }
      ],
      total_amount: 4600,
      razorpay_payment_id: 'pay_rzp_demo_891024',
      razorpay_order_id: 'order_dvk_891024',
      payment_status: 'successful',
      booking_status: 'confirmed',
      notes: 'Include blue balloons and celebrate during 4:30 PM cake cutting.',
      created_at: '2026-09-20T10:30:00Z'
    }
  ],
  packages: [
    {
      id: 'birthday_anniversary',
      name: '1. Birthday / Anniversary Donation',
      basePrice: 2500,
      minFoodCount: 25,
      tagline: 'Starts from Rs. 2,500',
      badge: 'Celebrate Life',
      icon: 'cake',
      inclusions: [
        '25 food meals - Rs. 70 each',
        '1 kg Cake - Rs. 550',
        'Photo Banner - Rs. 150'
      ],
      note: 'Celebrate your special milestones with those who need it most. We share food and joy in your name.',
      is_active: true
    },
    {
      id: 'virtual_birthday',
      name: '2. Virtual Birthday Celebration',
      basePrice: 3500,
      minFoodCount: 20,
      tagline: 'Rs. 3,500',
      badge: 'Interactive Meet',
      icon: 'video',
      inclusions: [
        '20 food meals for children',
        'Cake',
        'Chocolates & Juice',
        'Festive items such as balloons and caps'
      ],
      note: 'You can join a virtual meet and celebrate your special day with the children.',
      is_active: true
    },
    {
      id: 'old_age_home',
      name: '3. Old Age Home Donation',
      basePrice: 10000,
      minFoodCount: 50,
      tagline: 'Total: Rs. 10,000',
      badge: 'Senior Respect',
      icon: 'elder',
      inclusions: [
        'Food',
        'Cake',
        'Essential items for elders'
      ],
      note: 'A meaningful way to share love, care and respect with senior citizens.',
      is_active: true
    },
    {
      id: 'orphanage_home',
      name: '4. Orphanage Home Donation',
      basePrice: 7500,
      minFoodCount: 35,
      tagline: 'Total: Rs. 7,500',
      badge: 'Brighten Childhood',
      icon: 'child',
      inclusions: [
        'Food',
        'Cake',
        'Essential items for children'
      ],
      note: 'Make a special occasion brighter by sharing it with children in need.',
      is_active: true
    },
    {
      id: 'feed_stray_animals',
      name: '5. Feed Stray Animals',
      basePrice: 750,
      minFoodCount: 25,
      tagline: 'Starts from Rs. 750',
      badge: 'Compassion for All',
      icon: 'animal',
      inclusions: [
        'Minimum: 25 food portions',
        'Rs. 30 per food portion',
        'Minimum contribution for 25 portions - Rs. 750'
      ],
      note: 'Help provide nourishment and care to animals in need.',
      is_active: true
    },
    {
      id: 'general_custom',
      name: '6. General / Custom Contribution',
      basePrice: 1000,
      minFoodCount: 1,
      tagline: 'Flexible Amount',
      badge: 'Where Most Needed',
      icon: 'general',
      inclusions: [
        'Disaster and emergency hospital relief',
        'Daily Annadhanam free kitchen supplies',
        'Elder medical aid and children education'
      ],
      note: 'Support general operational relief funds where the urgent need is greatest.',
      is_active: true
    }
  ],
  addons: [
    { id: 'photo_cake', name: 'Photo Cake', price: 800, desc: 'Photo Cake - Rs. 800', is_active: true },
    { id: 'rose_milk', name: 'Rose Milk (10 glasses)', price: 150, desc: 'Rose Milk - 10 glasses - Rs. 150', is_active: true },
    { id: 'grocery_kit', name: 'Grocery Kit (1 family)', price: 500, desc: 'Grocery Kit - 1 family - Rs. 500', is_active: true },
    { id: 'stationery_kit', name: 'Stationery Kit', price: 25, desc: 'Stationery Kit - Rs. 25 each', isPerUnit: true, is_active: true }
  ],
  settings: {
    orgName: 'DEIVAKARAM CHARITABLE TRUST',
    orgAddress: 'No 4/298, East Coast Road, Neelankarai, Chennai - 600115, Tamil Nadu, India',
    orgEmail: 'info@deivakaram.org',
    orgPhone: '+91 44 2449 1122 / +91 94440 12345',
    trustUpiId: (import.meta as any).env?.VITE_TRUST_UPI_ID || 'ashwinop58@okicici',
    socialFacebook: 'https://facebook.com/deivakaramtrust',
    socialTwitter: 'https://twitter.com/deivakaramtrust',
    socialInstagram: 'https://instagram.com/deivakaramtrust',
    socialLinkedin: 'https://linkedin.com/company/deivakaramtrust',
    paymentGateway: 'Razorpay',
    paymentApiKey: 'rzp_test_ThjuUUhraxOPtf',
    paymentSecretKey: 'XbfEsqjOEUuL7LcnBa60GiHi',
    paymentWebhookUrl: 'https://deivakaram.org/api/webhooks/payments',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'donations@deivakaram.org',
    smtpPass: '••••••••••••••••',
    smtpSenderName: 'Deivakaram Charitable Trust',
    smtpSenderEmail: 'donations@deivakaram.org',
    twoFactorEnabled: true,
    googleDriveFolderId: '1mANBFXk-moSZ8ll9elajfF9eOmkDTDnX',
    googleDriveFolderName: 'Deivakaram_Public_Media_Vault',
    googleDriveWebhookUrl: 'https://script.google.com/macros/s/AKfycbwojrkpTkatYsEWI9Augz_uuCQ2_zWduUypBwljMlzO_2ShlW0XMgv8htEkB1GjPKit/exec'
  }
};

export const sanitizeDriveFolderId = (val?: string): string => {
  if (!val) return '1mANBFXk-moSZ8ll9elajfF9eOmkDTDnX';
  const trimmed = val.trim();
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return trimmed.split('?')[0].replace(/^https?:\/\/[^/]+\//, '');
};

// Database class
class MockDbEngine {
  private db: MockSchema;

  constructor() {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try {
        this.db = JSON.parse(raw);
        if (this.db.donors && !this.db.donors.some(d => d.email === 'ananth@gmail.com')) {
          if (this.db.donors[0]) {
            this.db.donors[0].name = 'Ananth Kumar';
            this.db.donors[0].email = 'ananth@gmail.com';
            this.db.donors[0].user_id = 'usr-4';
            this.db.donors[0].pan = 'ABCDE1234F';
          }
        }
        if (this.db.donors && !this.db.donors.some(d => d.email === 'deepa@gmail.com')) {
          if (this.db.donors[1]) {
            this.db.donors[1].name = 'Deepa Lakshmi';
            this.db.donors[1].email = 'deepa@gmail.com';
            this.db.donors[1].user_id = 'usr-5';
            this.db.donors[1].pan = 'FGHIJ5678K';
          }
        }
        if (!this.db.gallery_items || this.db.gallery_items.length === 0) {
          this.db.gallery_items = SEED_GALLERY_ITEMS;
        }
        if (!this.db.news || this.db.news.length === 0) {
          this.db.news = SEED_NEWS;
        }
        if (!this.db.celebration_bookings) {
          this.db.celebration_bookings = [
            {
              id: 'cel-1',
              booking_id: 'DVK-CEL-2026-891024',
              customer_name: 'Ananth Kumar',
              customer_phone: '+919840123456',
              customer_email: 'ananth@gmail.com',
              celebrant_name: 'Master Rohan Kumar',
              occasion_type: 'Birthday',
              occasion_date: '2026-09-25',
              banner_photo_url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=400',
              banner_photo_name: 'rohan_birthday_banner.jpg',
              is_virtual: true,
              virtual_time_slot: '3:00 PM – 6:00 PM',
              food_count: 50,
              package_id: 'birthday_anniversary',
              package_name: '1. Birthday / Anniversary Donation',
              cake_details: '1kg Photo Cake',
              selected_addons: [
                { id: 'photo_cake', name: 'Photo Cake', quantity: 1, amount: 800 },
                { id: 'rose_milk', name: 'Rose Milk (10 glasses)', quantity: 2, amount: 300 }
              ],
              total_amount: 4600,
              razorpay_payment_id: 'pay_rzp_demo_891024',
              razorpay_order_id: 'order_dvk_891024',
              payment_status: 'successful',
              booking_status: 'confirmed',
              notes: 'Include blue balloons and celebrate during 4:30 PM cake cutting.',
              created_at: '2026-09-20T10:30:00Z'
            }
          ];
        }
        if (!this.db.packages || this.db.packages.length === 0) {
          this.db.packages = INITIAL_DATABASE.packages;
        }
        if (!this.db.addons || this.db.addons.length === 0) {
          this.db.addons = INITIAL_DATABASE.addons;
        }
        if (this.db.settings) {
          if (!this.db.settings.paymentApiKey || this.db.settings.paymentApiKey.includes('DVK826194018')) {
            this.db.settings.paymentApiKey = 'rzp_test_ThjuUUhraxOPtf';
          }
          if (!this.db.settings.paymentSecretKey || this.db.settings.paymentSecretKey.includes('•••')) {
            this.db.settings.paymentSecretKey = 'XbfEsqjOEUuL7LcnBa60GiHi';
          }
          if (!this.db.settings.trustUpiId || this.db.settings.trustUpiId.includes('deivakaram@sbi')) {
            this.db.settings.trustUpiId = (import.meta as any).env?.VITE_TRUST_UPI_ID || 'ashwinop58@okicici';
          }
          this.db.settings.googleDriveFolderId = '1mANBFXk-moSZ8ll9elajfF9eOmkDTDnX';
          if (!this.db.settings.googleDriveFolderName) {
            this.db.settings.googleDriveFolderName = 'Deivakaram_Public_Media_Vault';
          }
          // Pre-configure the user's deployed Google Apps Script Webhook URL
          this.db.settings.googleDriveWebhookUrl = 'https://script.google.com/macros/s/AKfycbwojrkpTkatYsEWI9Augz_uuCQ2_zWduUypBwljMlzO_2ShlW0XMgv8htEkB1GjPKit/exec';
          this.save();
        }
      } catch (e) {
        this.db = { ...INITIAL_DATABASE };
        this.save();
      }
    } else {
      this.db = { ...INITIAL_DATABASE };
      this.save();
    }
  }

  private save() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch (e) {
      console.warn('LocalStorage quota limit reached, applying non-destructive safe compact payload:', e);
      try {
        const compactDb: MockSchema = {
          ...this.db,
          audit_logs: (this.db.audit_logs || []).slice(0, 20),
          notifications: (this.db.notifications || []).slice(0, 20),
          gallery_items: (this.db.gallery_items || []).slice(0, 30)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compactDb));
      } catch (innerErr) {
        console.warn('Fallback save: trimming older logs to preserve core platform data:', innerErr);
        try {
          const minimalDb = {
            ...this.db,
            audit_logs: (this.db.audit_logs || []).slice(0, 10),
            gallery_items: (this.db.gallery_items || []).slice(0, 15)
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalDb));
        } catch (fatal) {
          console.error('Data safely retained in active browser memory:', fatal);
        }
      }
    }
  }

  // AUDIT LOG HELPER
  public logAudit(action: string, module: string, recordId?: string, oldData?: any, newData?: any) {
    const activeUser = typeof localStorage !== 'undefined' 
      ? (JSON.parse(localStorage.getItem('deivakaram_active_user') || 'null') as User | null) 
      : null;
    const userName = activeUser ? activeUser.name : 'System/Guest';
    const role = activeUser ? activeUser.role : 'guest';
    const userId = activeUser ? activeUser.id : undefined;

    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user_id: userId,
      user_name: userName,
      role,
      action,
      module,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
      created_at: new Date().toISOString()
    };
    this.db.audit_logs.unshift(log);
    this.save();
  }

  // NOTIFICATION HELPER
  public createNotification(title: string, message: string, type: SystemNotification['type']) {
    const notification: SystemNotification = {
      id: `not-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title,
      message,
      type,
      read_status: false,
      created_at: new Date().toISOString()
    };
    this.db.notifications.unshift(notification);
    this.save();
  }

  // GETTERS
  public getUsers() { return this.db.users; }
  public getAdminUsers() { return this.db.admin_users; }
  public getDonors() { return this.db.donors; }
  public getDonations() { return this.db.donations; }
  public getCampaigns() { return this.db.campaigns; }
  public getVolunteers() { return this.db.volunteers; }
  public getBeneficiaries() { return this.db.beneficiaries; }
  public getAssistanceRecords() { return this.db.assistance_records; }
  public getEvents() { return this.db.events; }
  public getContactMessages() { return this.db.contact_messages; }
  public getReceipts() { return this.db.receipts; }
  public getNotifications() { return this.db.notifications; }
  public getAuditLogs() { return this.db.audit_logs; }
  public getSettings() { return this.db.settings; }

  // SETTINGS SETTER
  public updateSettings(newSettings: Partial<MockSchema['settings']>) {
    const old = { ...this.db.settings };
    const sanitized = { ...newSettings };
    if (sanitized.googleDriveFolderId) {
      sanitized.googleDriveFolderId = sanitizeDriveFolderId(sanitized.googleDriveFolderId);
    }
    this.db.settings = { ...this.db.settings, ...sanitized };
    this.save();
    this.logAudit('updated_settings', 'Settings', 'global', old, this.db.settings);
  }

  // NOTIFICATIONS READ SETTER
  public markNotificationsRead() {
    this.db.notifications.forEach(n => n.read_status = true);
    this.save();
  }

  // ----------------------------------------------------
  // DONATION WORKFLOW
  // ----------------------------------------------------
  public createDonation(data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    pan?: string;
    amount: number;
    purpose: Donation['purpose'];
    plan?: string;
    campaign_id?: string;
    payment_method: string;
    transaction_id: string;
    is_anonymous: boolean;
    message?: string;
    status: Donation['payment_status'];
  }) {
    // 1. Create or Find Donor
    let donor = this.db.donors.find(d => d.email.toLowerCase() === data.email.toLowerCase());
    const isNewDonor = !donor;
    const isMonthlyPlan = data.plan && (data.plan.toLowerCase().includes('monthly') || data.plan.toLowerCase().includes('recurring'));

    if (!donor) {
      const donorType = data.is_anonymous ? 'Anonymous Donor' : isMonthlyPlan ? 'Monthly Donor' : 'New Donor';
      donor = {
        id: `dnr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        pan: data.pan,
        donor_type: donorType,
        created_at: new Date().toISOString()
      };
      this.db.donors.unshift(donor);
      this.logAudit('created_donor_profile', 'Donors', donor.id, null, donor);
    } else {
      // Update details if provided
      if (data.name && (!donor.name || donor.name === 'Anonymous Donor')) donor.name = data.name;
      if (data.phone) donor.phone = data.phone;
      if (data.address && !donor.address) donor.address = data.address;
      if (data.pan && !donor.pan) donor.pan = data.pan;
      if (isMonthlyPlan && donor.donor_type !== 'Major Donor') {
        donor.donor_type = 'Monthly Donor';
      }
    }

    // 2. Create Donation Record
    const year = new Date().getFullYear();
    const donationSeqVal = this.db.donations.length + 1;
    const donationIdStr = `DVK-DON-${year}-${String(donationSeqVal).padStart(6, '0')}`;
    const receiptNum = data.status === 'successful' ? `DVK-REC-${year}${String(donationSeqVal).padStart(4, '0')}` : undefined;

    const donation: Donation = {
      id: `don-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      donation_id: donationIdStr,
      donor_id: donor.id,
      campaign_id: data.campaign_id,
      amount: data.amount,
      purpose: data.purpose,
      plan: data.plan || 'One-Time Contribution',
      payment_method: data.payment_method,
      transaction_id: data.transaction_id,
      payment_status: data.status,
      receipt_number: receiptNum,
      is_anonymous: data.is_anonymous,
      message: data.message,
      created_at: new Date().toISOString()
    };
    
    // Prepend to donations list so it instantly shows as the newest transaction at the top of CRM
    this.db.donations.unshift(donation);
    this.save();

    // 3. Update Campaign if Successful
    if (data.status === 'successful' && data.campaign_id) {
      const campaign = this.db.campaigns.find(c => c.id === data.campaign_id);
      if (campaign) {
        campaign.raised_amount += data.amount;
        if (campaign.raised_amount >= campaign.target_amount) {
          campaign.status = 'completed';
          this.createNotification(`Campaign Target Reached!`, `Campaign "${campaign.title}" has reached its goal target.`, 'alert');
          this.logAudit('campaign_completed_goal', 'Campaigns', campaign.id);
        }
      }
    }

    // 4. Update Donor Segmentation
    if (data.status === 'successful') {
      const donorDonations = this.db.donations.filter(d => d.donor_id === donor.id && d.payment_status === 'successful');
      const totalAmount = donorDonations.reduce((sum, d) => sum + d.amount, 0);
      const totalCount = donorDonations.length;

      if (donor.donor_type !== 'Anonymous Donor') {
        if (totalAmount >= 50000) {
          donor.donor_type = 'Major Donor';
        } else if (totalCount >= 5) {
          donor.donor_type = 'Regular Donor';
        } else if (isMonthlyPlan || totalCount >= 2) {
          donor.donor_type = 'Monthly Donor';
        }
      }
    }

    // 5. Generate Receipt
    if (data.status === 'successful' && receiptNum) {
      const receipt: Receipt = {
        id: `rec-${donation.id}`,
        donation_id: donation.id,
        receipt_number: receiptNum,
        created_at: new Date().toISOString()
      };
      this.db.receipts.push(receipt);
    }

    // 6. Log Audit and Create Notification
    this.logAudit('processed_payment_webhook', 'Payments', donation.donation_id, null, donation);
    if (data.status === 'successful') {
      const planTag = donation.plan ? ` under [${donation.plan}]` : '';
      this.createNotification(
        'New Donation Received',
        `₹${data.amount.toLocaleString('en-IN')} received from ${data.is_anonymous ? 'Anonymous Donor' : data.name} for ${data.purpose}${planTag}.`,
        'donation'
      );
    } else if (data.status === 'failed') {
      this.createNotification(
        'Failed Payment Attempt',
        `₹${data.amount.toLocaleString('en-IN')} payment attempt failed for donor ${data.name}.`,
        'alert'
      );
    }

    this.save();
    return { donation, donor };
  }

  // ----------------------------------------------------
  // VOLUNTEER REGISTRATION
  // ----------------------------------------------------
  public registerVolunteer(data: Omit<Volunteer, 'id' | 'volunteer_id' | 'status' | 'created_at'>) {
    const volSeqVal = this.db.volunteers.length + 1;
    const volIdStr = `DVK-VOL-${String(volSeqVal).padStart(6, '0')}`;

    const vol: Volunteer = {
      ...data,
      id: `vol-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      volunteer_id: volIdStr,
      status: 'submitted',
      created_at: new Date().toISOString()
    };

    this.db.volunteers.push(vol);
    this.createNotification(
      'New Volunteer Application',
      `${vol.name} applied for volunteering (Interests: ${vol.interests.join(', ')}).`,
      'volunteer'
    );
    this.logAudit('volunteer_registered', 'Volunteers', vol.volunteer_id, null, vol);
    this.save();
    return vol;
  }

  public updateVolunteerStatus(id: string, status: Volunteer['status']) {
    const vol = this.db.volunteers.find(v => v.id === id);
    if (vol) {
      const old = vol.status;
      vol.status = status;
      this.logAudit('updated_volunteer_status', 'Volunteers', vol.volunteer_id, { status: old }, { status });
      this.save();
    }
  }

  // ----------------------------------------------------
  // BENEFICIARY / ASSISTANCE REQUEST
  // ----------------------------------------------------
  public submitBeneficiaryCase(data: Omit<Beneficiary, 'id' | 'case_id' | 'status' | 'created_at'>) {
    const caseSeqVal = this.db.beneficiaries.length + 1;
    const caseIdStr = `DVK-CASE-${String(caseSeqVal).padStart(6, '0')}`;

    const beneficiary: Beneficiary = {
      ...data,
      id: `ben-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      case_id: caseIdStr,
      status: 'submitted',
      created_at: new Date().toISOString()
    };

    this.db.beneficiaries.push(beneficiary);
    this.createNotification(
      'New Assistance Request',
      `New support request under Case ${caseIdStr} from ${beneficiary.name} for ${beneficiary.category} support.`,
      'case'
    );
    this.logAudit('submitted_beneficiary_case', 'Beneficiaries', caseIdStr, null, beneficiary);
    this.save();
    return beneficiary;
  }

  public updateBeneficiaryStatus(id: string, status: Beneficiary['status']) {
    const ben = this.db.beneficiaries.find(b => b.id === id);
    if (ben) {
      const old = ben.status;
      ben.status = status;
      this.logAudit('updated_beneficiary_case_status', 'Beneficiaries', ben.case_id, { status: old }, { status });
      this.save();
    }
  }

  // ----------------------------------------------------
  // CONTACT MESSAGES
  // ----------------------------------------------------
  public submitContactMessage(data: Omit<ContactMessage, 'id' | 'inquiry_id' | 'status' | 'created_at'>) {
    const inqSeqVal = this.db.contact_messages.length + 1;
    const inqIdStr = `DVK-INQ-${String(inqSeqVal).padStart(6, '0')}`;

    const msg: ContactMessage = {
      ...data,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      inquiry_id: inqIdStr,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    this.db.contact_messages.push(msg);
    this.createNotification(
      'New Contact Inquiry',
      `Inquiry "${msg.subject}" from ${msg.name} entered CRM.`,
      'message'
    );
    this.logAudit('contact_message_received', 'Messages', inqIdStr, null, msg);
    this.save();
    return msg;
  }

  public resolveContactMessage(id: string) {
    const msg = this.db.contact_messages.find(m => m.id === id);
    if (msg) {
      msg.status = 'resolved';
      this.logAudit('resolved_contact_inquiry', 'Messages', msg.inquiry_id);
      this.save();
    }
  }

  // ----------------------------------------------------
  // EVENT REGISTRATIONS & MANAGEMENT
  // ----------------------------------------------------

  public createEvent(event: Omit<Event, 'id' | 'created_at'>): Event {
    const newEvent: Event = {
      ...event,
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      registrations: event.registrations || [],
      created_at: new Date().toISOString()
    };
    if (!this.db.events) this.db.events = [];
    this.db.events.unshift(newEvent);
    this.logAudit('created_event', 'Events', newEvent.title, null, newEvent);
    this.save();
    return newEvent;
  }

  public updateEvent(id: string, updates: Partial<Event>): Event | null {
    const evt = (this.db.events || []).find(e => e.id === id);
    if (evt) {
      const old = { ...evt };
      Object.assign(evt, updates);
      this.logAudit('updated_event', 'Events', evt.title, old, evt);
      this.save();
      return evt;
    }
    return null;
  }

  public deleteEvent(id: string): boolean {
    const idx = (this.db.events || []).findIndex(e => e.id === id);
    if (idx !== -1) {
      const removed = this.db.events.splice(idx, 1)[0];
      this.logAudit('deleted_event', 'Events', removed.title, removed, null);
      this.save();
      return true;
    }
    return false;
  }

  public registerVolunteerForEvent(eventId: string, volunteerName: string) {
    const evt = this.db.events.find(e => e.id === eventId);
    if (evt) {
      if (!evt.registrations.includes(volunteerName)) {
        evt.registrations.push(volunteerName);
        this.logAudit('registered_event_volunteer', 'Events', evt.title);
        this.save();
      }
    }
  }

  // ----------------------------------------------------
  // NEWS & PRESS BULLETINS
  // ----------------------------------------------------
  public getNews(): NewsArticle[] {
    return [...(this.db.news || SEED_NEWS)];
  }

  public createNews(article: Omit<NewsArticle, 'id' | 'created_at'>): NewsArticle {
    const newArt: NewsArticle = {
      ...article,
      id: `news-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: article.status || 'published',
      created_at: new Date().toISOString()
    };
    if (!this.db.news) this.db.news = [];
    this.db.news.unshift(newArt);
    this.logAudit('published_news', 'News', newArt.title, null, newArt);
    this.save();
    return newArt;
  }

  public updateNews(id: string, updates: Partial<NewsArticle>): NewsArticle | null {
    const art = (this.db.news || []).find(n => n.id === id);
    if (art) {
      const old = { ...art };
      Object.assign(art, updates);
      this.logAudit('updated_news', 'News', art.title, old, art);
      this.save();
      return art;
    }
    return null;
  }

  public deleteNews(id: string): boolean {
    const idx = (this.db.news || []).findIndex(n => n.id === id);
    if (idx !== -1) {
      const removed = this.db.news.splice(idx, 1)[0];
      this.logAudit('deleted_news', 'News', removed.title, removed, null);
      this.save();
      return true;
    }
    return false;
  }

  // ----------------------------------------------------
  // CAMPAIGN CREATION/MODIFICATION (CMS)
  // ----------------------------------------------------
  public createCampaign(campaign: Omit<Campaign, 'id' | 'raised_amount' | 'created_at' | 'updates'>) {
    const cmp: Campaign = {
      ...campaign,
      id: `cmp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      raised_amount: 0,
      updates: [],
      created_at: new Date().toISOString()
    };
    this.db.campaigns.push(cmp);
    this.logAudit('created_campaign', 'Campaigns', cmp.title, null, cmp);
    this.save();
    return cmp;
  }

  public updateCampaign(id: string, campaign: Partial<Campaign>) {
    const cmp = this.db.campaigns.find(c => c.id === id);
    if (cmp) {
      const old = { ...cmp };
      Object.assign(cmp, campaign);
      this.logAudit('updated_campaign', 'Campaigns', cmp.title, old, cmp);
      this.save();
    }
  }

  public deleteCampaign(id: string) {
    const idx = this.db.campaigns.findIndex(c => c.id === id);
    if (idx !== -1) {
      const old = this.db.campaigns[idx];
      this.db.campaigns.splice(idx, 1);
      this.logAudit('deleted_campaign', 'Campaigns', old.title, old, null);
      this.save();
      return true;
    }
    return false;
  }

  // ----------------------------------------------------
  // USER & ADMIN USER MANAGEMENT (FULL ERROR-FREE CRUD)
  // ----------------------------------------------------
  public createUser(userData: {
    name: string;
    email: string;
    phone?: string;
    role?: 'donor' | 'sub_admin' | 'super_admin';
    status?: 'active' | 'suspended';
    permissions?: string[];
  }): User {
    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = this.db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      existing.name = userData.name.trim();
      if (userData.phone !== undefined) existing.phone = userData.phone;
      if (userData.role) existing.role = userData.role;
      if (userData.status) existing.status = userData.status;
      if (userData.permissions && this.db.admin_users[existing.id]) {
        this.db.admin_users[existing.id].permissions = userData.permissions;
      }
      this.save();
      return existing;
    }

    const uId = `usr-${Date.now()}`;
    const newUser: User = {
      id: uId,
      name: userData.name.trim(),
      email: cleanEmail,
      phone: userData.phone || undefined,
      role: userData.role || 'donor',
      status: userData.status || 'active',
      created_at: new Date().toISOString(),
      permissions: userData.permissions || (userData.role === 'super_admin' ? [
        'donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns', 'events', 'content', 'reports', 'settings', 'admins', 'logs'
      ] : undefined)
    };
    this.db.users.unshift(newUser);

    if (newUser.role === 'sub_admin' || newUser.role === 'super_admin') {
      this.db.admin_users[uId] = {
        id: uId,
        permissions: userData.permissions || (newUser.role === 'super_admin' ? [
          'donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns', 'events', 'content', 'reports', 'settings', 'admins', 'logs'
        ] : ['donations', 'donors', 'volunteers', 'events']),
        status: newUser.status
      };
    }

    if (newUser.role === 'donor') {
      const donorExists = this.db.donors.some(d => d.email.toLowerCase() === cleanEmail);
      if (!donorExists) {
        this.db.donors.unshift({
          id: `dn-${Date.now()}`,
          user_id: uId,
          name: newUser.name,
          email: cleanEmail,
          phone: newUser.phone,
          donor_type: 'New Donor',
          created_at: new Date().toISOString()
        });
      }
    }

    this.logAudit('created_user', 'Users', cleanEmail, null, newUser);
    this.save();
    return newUser;
  }

  public getUserById(uId: string): User | undefined {
    const user = this.db.users.find(u => u.id === uId);
    if (!user) return undefined;
    const admin = this.db.admin_users[uId];
    return {
      ...user,
      permissions: admin?.permissions || user.permissions || []
    };
  }

  public updateUser(uId: string, updates: Partial<User>): User | null {
    const user = this.db.users.find(u => u.id === uId);
    if (!user) return null;
    const oldUser = { ...user };

    if (updates.name) user.name = updates.name.trim();
    if (updates.email) user.email = updates.email.trim().toLowerCase();
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.role) user.role = updates.role;
    if (updates.status) user.status = updates.status;

    if (updates.permissions && this.db.admin_users[uId]) {
      this.db.admin_users[uId].permissions = updates.permissions;
      user.permissions = updates.permissions;
    }

    // Also sync donors list if user is a donor
    const matchingDonor = this.db.donors.find(d => d.user_id === uId || d.email.toLowerCase() === user.email.toLowerCase());
    if (matchingDonor) {
      if (updates.name) matchingDonor.name = updates.name.trim();
      if (updates.email) matchingDonor.email = updates.email.trim().toLowerCase();
      if (updates.phone !== undefined) matchingDonor.phone = updates.phone;
    }

    this.logAudit('updated_user', 'Users', user.email, oldUser, user);
    this.save();
    return user;
  }

  public deleteUser(uId: string): boolean {
    const user = this.db.users.find(u => u.id === uId);
    if (user && user.role !== 'super_admin') {
      this.db.users = this.db.users.filter(u => u.id !== uId);
      delete this.db.admin_users[uId];
      // Unlink donor user_id
      this.db.donors.forEach(d => {
        if (d.user_id === uId) d.user_id = undefined as any;
      });
      this.logAudit('deleted_user', 'Users', user.email, user, null);
      this.save();
      return true;
    }
    return false;
  }

  public createSubAdmin(name: string, email: string, phone: string, permissions: string[]) {
    return this.createUser({
      name,
      email,
      phone,
      role: 'sub_admin',
      status: 'active',
      permissions
    });
  }

  public updateSubAdminPermissions(uId: string, permissions: string[]) {
    const admin = this.db.admin_users[uId];
    if (admin) {
      const oldPerms = admin.permissions;
      admin.permissions = permissions;
      this.logAudit('updated_sub_admin_permissions', 'Admins', uId, { permissions: oldPerms }, { permissions });
      this.save();
    }
  }

  public toggleAdminStatus(uId: string) {
    const user = this.db.users.find(u => u.id === uId);
    if (user && (user.role === 'sub_admin' || user.role === 'super_admin')) {
      const old = user.status;
      user.status = old === 'active' ? 'suspended' : 'active';
      if (this.db.admin_users[uId]) {
        this.db.admin_users[uId].status = user.status;
      }
      this.logAudit('toggle_admin_active_state', 'Admins', user.email, { status: old }, { status: user.status });
      this.save();
      return user;
    }
    return null;
  }

  public updateSubAdmin(uId: string, data: { name?: string; email?: string; phone?: string; role?: 'sub_admin' | 'super_admin'; permissions?: string[]; status?: 'active' | 'suspended' }) {
    return this.updateUser(uId, data);
  }

  public deleteSubAdmin(uId: string) {
    return this.deleteUser(uId);
  }

  // GALLERY CRUD METHODS (GOOGLE DRIVE INTEGRATION)
  public getGalleryItems(): GalleryItem[] {
    return [...(this.db.gallery_items || [])];
  }

  public createGalleryItem(item: Omit<GalleryItem, 'id' | 'created_at'>): GalleryItem {
    const newItem: GalleryItem = {
      ...item,
      id: `gal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString()
    };
    if (!this.db.gallery_items) this.db.gallery_items = [];
    this.db.gallery_items.unshift(newItem);
    this.logAudit('uploaded_media_file', 'Gallery', newItem.file_name, null, {
      id: newItem.id,
      title: newItem.title,
      file_name: newItem.file_name,
      file_size: newItem.file_size,
      google_drive_file_id: newItem.google_drive_file_id
    });
    this.save();
    return newItem;
  }

  public deleteGalleryItem(id: string): boolean {
    if (!this.db.gallery_items) return false;
    const idx = this.db.gallery_items.findIndex(g => g.id === id);
    if (idx !== -1) {
      const removed = this.db.gallery_items.splice(idx, 1)[0];
      this.logAudit('deleted_media_file', 'Gallery', removed.file_name, removed, null);
      this.save();
      return true;
    }
    return false;
  }

  // ==========================================
  // CELEBRATION BOOKINGS CRUD METHODS
  // ==========================================
  public getCelebrationBookings(): CelebrationBooking[] {
    return (this.db.celebration_bookings || []).map(b => ({
      ...b,
      donor_name: b.donor_name || b.customer_name,
      customer_name: b.customer_name || b.donor_name || '',
      donor_phone: b.donor_phone || b.customer_phone,
      customer_phone: b.customer_phone || b.donor_phone || '',
      donor_email: b.donor_email || b.customer_email,
      customer_email: b.customer_email || b.donor_email || '',
      occasion: b.occasion || b.occasion_type || 'Birthday',
      occasion_type: b.occasion_type || b.occasion || 'Birthday',
      banner_photo_url: b.banner_photo_url || b.banner_image_url || '',
      banner_image_url: b.banner_image_url || b.banner_photo_url || '',
      is_virtual: b.is_virtual ?? b.virtual_celebration ?? false,
      virtual_celebration: b.virtual_celebration ?? b.is_virtual ?? false,
      total_amount: b.total_amount ?? b.amount ?? 0,
      amount: b.amount ?? b.total_amount ?? 0,
      razorpay_payment_id: b.razorpay_payment_id || b.payment_id,
      payment_id: b.payment_id || b.razorpay_payment_id,
      razorpay_order_id: b.razorpay_order_id || b.order_id,
      order_id: b.order_id || b.razorpay_order_id,
      booking_status: b.booking_status || b.status || 'confirmed',
      status: b.status || b.booking_status || 'confirmed',
      notes: b.notes || b.special_instructions,
      special_instructions: b.special_instructions || b.notes
    }));
  }

  public createCelebrationBooking(data: Omit<CelebrationBooking, 'id' | 'created_at'>): CelebrationBooking {
    const newBooking: CelebrationBooking = {
      ...data,
      id: `cel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      donor_name: data.donor_name || data.customer_name,
      customer_name: data.customer_name || data.donor_name || '',
      donor_phone: data.donor_phone || data.customer_phone,
      customer_phone: data.customer_phone || data.donor_phone || '',
      donor_email: data.donor_email || data.customer_email,
      customer_email: data.customer_email || data.donor_email || '',
      occasion: data.occasion || data.occasion_type || 'Birthday',
      occasion_type: data.occasion_type || data.occasion || 'Birthday',
      banner_photo_url: data.banner_photo_url || data.banner_image_url || '',
      banner_image_url: data.banner_image_url || data.banner_photo_url || '',
      is_virtual: data.is_virtual ?? data.virtual_celebration ?? false,
      virtual_celebration: data.virtual_celebration ?? data.is_virtual ?? false,
      total_amount: data.total_amount ?? data.amount ?? 0,
      amount: data.amount ?? data.total_amount ?? 0,
      razorpay_payment_id: data.razorpay_payment_id || data.payment_id,
      payment_id: data.payment_id || data.razorpay_payment_id,
      razorpay_order_id: data.razorpay_order_id || data.order_id,
      order_id: data.order_id || data.razorpay_order_id,
      booking_status: data.booking_status || data.status || 'confirmed',
      status: data.status || data.booking_status || 'confirmed',
      notes: data.notes || data.special_instructions,
      special_instructions: data.special_instructions || data.notes
    };
    if (!this.db.celebration_bookings) this.db.celebration_bookings = [];
    this.db.celebration_bookings.unshift(newBooking);
    this.logAudit('created_celebration_booking', 'Celebrations', newBooking.booking_id, null, {
      id: newBooking.id,
      booking_id: newBooking.booking_id,
      celebrant_name: newBooking.celebrant_name,
      occasion_date: newBooking.occasion_date,
      total_amount: newBooking.total_amount,
      razorpay_payment_id: newBooking.razorpay_payment_id
    });
    this.createNotification(
      'New Celebration Booking Confirmed',
      `${newBooking.customer_name} booked ${newBooking.package_name} for ${newBooking.celebrant_name} (${newBooking.food_count} meals).`,
      'donation'
    );
    this.save();
    return newBooking;
  }

  public updateCelebrationBooking(id: string, updates: Partial<CelebrationBooking>): CelebrationBooking | null {
    if (!this.db.celebration_bookings) return null;
    const idx = this.db.celebration_bookings.findIndex(b => b.id === id || b.booking_id === id);
    if (idx === -1) return null;
    const old = this.db.celebration_bookings[idx];
    const updated: CelebrationBooking = {
      ...old,
      ...updates,
      booking_status: updates.status || updates.booking_status || old.booking_status,
      status: updates.status || updates.booking_status || old.status,
      notes: updates.special_instructions || updates.notes || old.notes,
      special_instructions: updates.special_instructions || updates.notes || old.special_instructions
    };
    this.db.celebration_bookings[idx] = updated;
    this.logAudit('updated_celebration_booking', 'Celebrations', updated.booking_id, old, updates);
    this.save();
    return updated;
  }

  public deleteCelebrationBooking(id: string): boolean {
    if (!this.db.celebration_bookings) return false;
    const idx = this.db.celebration_bookings.findIndex(b => b.id === id || b.booking_id === id);
    if (idx === -1) return false;
    const removed = this.db.celebration_bookings.splice(idx, 1)[0];
    this.logAudit('deleted_celebration_booking', 'Celebrations', removed.booking_id, removed, null);
    this.save();
    return true;
  }

  // ==========================================
  // DYNAMIC PACKAGES CRUD METHODS
  // ==========================================
  public getDynamicPackages(): DynamicPackage[] {
    const list = this.db.packages || INITIAL_DATABASE.packages;
    return list.map(p => ({
      ...p,
      title: p.title || p.name,
      name: p.name || p.title || '',
      basePrice: p.basePrice ?? p.base_price ?? 0,
      base_price: p.base_price ?? p.basePrice ?? 0,
      minFoodCount: p.minFoodCount ?? p.min_meals ?? 25,
      min_meals: p.min_meals ?? p.minFoodCount ?? 25,
      tagline: p.tagline || p.description || '',
      description: p.description || p.tagline || '',
      is_popular: p.is_popular ?? (p.badge === 'Popular')
    }));
  }

  public updateDynamicPackage(id: string, updates: Partial<DynamicPackage>): DynamicPackage | null {
    if (!this.db.packages) this.db.packages = [...INITIAL_DATABASE.packages];
    const idx = this.db.packages.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const old = this.db.packages[idx];
    const updated: DynamicPackage = {
      ...old,
      ...updates,
      name: updates.title || updates.name || old.name,
      title: updates.title || updates.name || old.title,
      basePrice: updates.base_price ?? updates.basePrice ?? old.basePrice,
      base_price: updates.base_price ?? updates.basePrice ?? old.base_price,
      minFoodCount: updates.min_meals ?? updates.minFoodCount ?? old.minFoodCount,
      min_meals: updates.min_meals ?? updates.minFoodCount ?? old.min_meals,
      tagline: updates.description || updates.tagline || old.tagline,
      description: updates.description || updates.tagline || old.description,
      updated_at: new Date().toISOString()
    };
    this.db.packages[idx] = updated;
    this.logAudit('updated_package', 'Settings', updated.name, old, updates);
    this.save();
    return updated;
  }

  public createDynamicPackage(data: DynamicPackage): DynamicPackage {
    if (!this.db.packages) this.db.packages = [...INITIAL_DATABASE.packages];
    const newPkg: DynamicPackage = {
      ...data,
      name: data.title || data.name,
      title: data.title || data.name,
      basePrice: data.base_price ?? data.basePrice ?? 0,
      base_price: data.base_price ?? data.basePrice ?? 0,
      minFoodCount: data.min_meals ?? data.minFoodCount ?? 25,
      min_meals: data.min_meals ?? data.minFoodCount ?? 25,
      tagline: data.description || data.tagline || '',
      description: data.description || data.tagline || '',
      badge: data.badge || (data.is_popular ? 'Popular' : 'Standard'),
      icon: data.icon || 'cake',
      note: data.note || 'Full photography and live stream video included.',
      inclusions: data.inclusions || [],
      is_active: data.is_active !== undefined ? data.is_active : true,
      updated_at: new Date().toISOString()
    };
    this.db.packages.push(newPkg);
    this.logAudit('created_package', 'Settings', newPkg.name, null, newPkg);
    this.save();
    return newPkg;
  }

  public deleteDynamicPackage(id: string): boolean {
    if (!this.db.packages) return false;
    const idx = this.db.packages.findIndex(p => p.id === id);
    if (idx === -1) return false;
    const removed = this.db.packages.splice(idx, 1)[0];
    this.logAudit('deleted_package', 'Settings', removed.name, removed, null);
    this.save();
    return true;
  }

  // ==========================================
  // DYNAMIC ADDONS CRUD METHODS
  // ==========================================
  public getDynamicAddons(): DynamicAddon[] {
    const list = this.db.addons || INITIAL_DATABASE.addons;
    return list.map(a => ({
      ...a,
      desc: a.desc || a.description || '',
      description: a.description || a.desc || '',
      unit: a.unit || (a.isPerUnit ? 'per pack' : 'per item')
    }));
  }

  public updateDynamicAddon(id: string, updates: Partial<DynamicAddon>): DynamicAddon | null {
    if (!this.db.addons) this.db.addons = [...INITIAL_DATABASE.addons];
    const idx = this.db.addons.findIndex(a => a.id === id);
    if (idx === -1) return null;
    const old = this.db.addons[idx];
    const updated: DynamicAddon = {
      ...old,
      ...updates,
      desc: updates.description || updates.desc || old.desc,
      description: updates.description || updates.desc || old.description,
      updated_at: new Date().toISOString()
    };
    this.db.addons[idx] = updated;
    this.logAudit('updated_addon', 'Settings', updated.name, old, updates);
    this.save();
    return updated;
  }

  public createDynamicAddon(data: DynamicAddon): DynamicAddon {
    if (!this.db.addons) this.db.addons = [...INITIAL_DATABASE.addons];
    const newAddon: DynamicAddon = {
      ...data,
      desc: data.description || data.desc || '',
      description: data.description || data.desc || '',
      unit: data.unit || 'per item',
      isPerUnit: data.isPerUnit !== undefined ? data.isPerUnit : true,
      updated_at: new Date().toISOString()
    };
    this.db.addons.push(newAddon);
    this.logAudit('created_addon', 'Settings', newAddon.name, null, newAddon);
    this.save();
    return newAddon;
  }

  public deleteDynamicAddon(id: string): boolean {
    if (!this.db.addons) return false;
    const idx = this.db.addons.findIndex(a => a.id === id);
    if (idx === -1) return false;
    const removed = this.db.addons.splice(idx, 1)[0];
    this.logAudit('deleted_addon', 'Settings', removed.name, removed, null);
    this.save();
    return true;
  }
}

export const mockDb = new MockDbEngine();
export default mockDb;
