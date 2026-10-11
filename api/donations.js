import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ggjuvgyleograndnjrob.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_e8lprXB0lR4ZCMBe19lTDQ_Ijyc3hPG';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('donations')
        .select('*, donors(name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const formatted = (data || []).map(d => ({
        ...d,
        donor_name: d.donors?.name || 'Anonymous',
        donor_email: d.donors?.email || 'anonymous@deivakaram.org'
      }));
      return res.status(200).json(formatted);
    }

    if (req.method === 'POST') {
      const {
        amount, purpose = 'General Fund', plan = 'One-Time Contribution',
        payment_method = 'Manual / Bank', transaction_id, donor_name, donor_email,
        donor_phone, donor_pan, is_anonymous = false, message
      } = req.body || {};

      let donorId = null;
      if (donor_email) {
        const { data: dData } = await supabase.from('donors').select('id').eq('email', donor_email.toLowerCase().trim()).maybeSingle();
        if (dData) donorId = dData.id;
        else {
          const { data: newD } = await supabase.from('donors').insert({
            name: donor_name || 'Anonymous Donor',
            email: donor_email.toLowerCase().trim(),
            phone: donor_phone || null,
            pan: donor_pan || null,
            donor_type: 'New Donor'
          }).select('id').single();
          if (newD) donorId = newD.id;
        }
      }

      const seq = Math.floor(100000 + Math.random() * 900000).toString();
      const donationId = `DVK-DON-${new Date().getFullYear()}-${seq}`;
      const receiptNumber = `DVK-REC-${seq}`;

      const { data: don, error: donErr } = await supabase.from('donations').insert({
        donation_id: donationId,
        donor_id: donorId,
        amount: Number(amount),
        purpose,
        plan,
        payment_method,
        transaction_id: transaction_id || `TXN-MAN-${Date.now()}`,
        payment_status: 'successful',
        receipt_number: receiptNumber,
        is_anonymous: Boolean(is_anonymous),
        message: message || null
      }).select('*').single();

      if (donErr) throw donErr;
      return res.status(201).json(don);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
