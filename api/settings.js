import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ggjuvgyleograndnjrob.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_e8lprXB0lR4ZCMBe19lTDQ_Ijyc3hPG';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 'default').maybeSingle();
      if (error || !data) {
        return res.status(200).json({
          id: 'default',
          orgName: 'Deivakaram Charitable Trust',
          orgAddress: '14 Gandhipuram, Coimbatore, Tamil Nadu - 641012',
          orgEmail: 'contact@deivakaram.org',
          orgPhone: '+91 98765 43210',
          trustUpiId: process.env.VITE_TRUST_UPI_ID || 'ashwinop58@okicici',
          paymentGateway: 'Razorpay',
          googleDriveFolderId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
          googleDriveFolderName: 'Deivakaram Official Trust Media Drive'
        });
      }
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      const s = req.body;
      const { data, error } = await supabase.from('settings').upsert({
        id: 'default',
        ...s,
        updated_at: new Date().toISOString()
      }).select('*').single();

      if (error) {
        return res.status(200).json(s);
      }
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
