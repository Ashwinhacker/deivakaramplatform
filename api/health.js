import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ggjuvgyleograndnjrob.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_e8lprXB0lR4ZCMBe19lTDQ_Ijyc3hPG';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: uErr } = await supabase.from('users').select('count').limit(1);
    const { error: bErr } = await supabase.from('celebration_bookings').select('count').limit(1);

    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: !uErr,
        usersTable: !uErr ? 'available' : uErr.message,
        celebrationBookingsTable: !bErr ? 'available' : 'needs migration'
      },
      paymentGateway: {
        provider: 'Razorpay',
        configured: !!(process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID)
      }
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
