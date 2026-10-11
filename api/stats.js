import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ggjuvgyleograndnjrob.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_e8lprXB0lR4ZCMBe19lTDQ_Ijyc3hPG';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const [donationsRes, donorsRes, campaignsRes, volunteersRes, beneficiariesRes, eventsRes, celebrationsRes] = await Promise.allSettled([
      supabase.from('donations').select('amount, payment_status'),
      supabase.from('donors').select('id'),
      supabase.from('campaigns').select('id, status'),
      supabase.from('volunteers').select('id, status'),
      supabase.from('beneficiaries').select('id, status'),
      supabase.from('events').select('id, status'),
      supabase.from('celebration_bookings').select('total_amount, payment_status')
    ]);

    const donations = donationsRes.status === 'fulfilled' && donationsRes.value.data ? donationsRes.value.data : [];
    const successfulDonations = donations.filter(d => d.payment_status === 'successful');
    const totalDonationsAmount = successfulDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const celebrations = celebrationsRes.status === 'fulfilled' && celebrationsRes.value.data ? celebrationsRes.value.data : [];
    const successfulCelebrations = celebrations.filter(c => c.payment_status === 'successful');
    const totalCelebrationsAmount = successfulCelebrations.reduce((sum, c) => sum + Number(c.total_amount || 0), 0);

    const donorsCount = donorsRes.status === 'fulfilled' && donorsRes.value.data ? donorsRes.value.data.length : 0;
    const campaignsCount = campaignsRes.status === 'fulfilled' && campaignsRes.value.data ? campaignsRes.value.data.length : 0;
    const volunteersCount = volunteersRes.status === 'fulfilled' && volunteersRes.value.data ? volunteersRes.value.data.length : 0;
    const beneficiariesCount = beneficiariesRes.status === 'fulfilled' && beneficiariesRes.value.data ? beneficiariesRes.value.data.length : 0;
    const eventsCount = eventsRes.status === 'fulfilled' && eventsRes.value.data ? eventsRes.value.data.length : 0;

    return res.status(200).json({
      totalRaised: totalDonationsAmount + totalCelebrationsAmount,
      totalDonationsAmount,
      totalCelebrationsAmount,
      totalTransactions: successfulDonations.length + successfulCelebrations.length,
      donorsCount,
      campaignsCount,
      volunteersCount,
      beneficiariesCount,
      eventsCount
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
