import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ggjuvgyleograndnjrob.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_e8lprXB0lR4ZCMBe19lTDQ_Ijyc3hPG';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      // Check if registration action
      const { action, eventId, volunteerName } = req.body || {};
      if (action === 'register' && eventId && volunteerName) {
        const { data: ev, error: evErr } = await supabase.from('events').select('registrations').eq('id', eventId).single();
        if (evErr) throw evErr;
        const regs = Array.isArray(ev.registrations) ? ev.registrations : [];
        if (!regs.includes(volunteerName)) {
          regs.push(volunteerName);
          const { data: updated, error: uErr } = await supabase.from('events').update({ registrations: regs }).eq('id', eventId).select('*').single();
          if (uErr) throw uErr;
          return res.status(200).json(updated);
        }
        return res.status(200).json(ev);
      }

      const event = req.body;
      const { data, error } = await supabase.from('events').insert({
        ...event,
        registrations: event.registrations || [],
        status: event.status || 'upcoming'
      }).select('*').single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
