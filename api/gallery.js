import { createClient } from '@supabase/supabase-js';

const SEED_GALLERY = [
  {
    id: 'gal-1',
    title: 'Scholarship Presentation Chennai',
    category: 'Education',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600',
    thumbnail_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=300',
    google_drive_file_id: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ01',
    file_name: 'scholarship_presentation_2026.jpg'
  },
  {
    id: 'gal-2',
    title: 'Eye Diagnostics Jawadhu Hills',
    category: 'Medical Camps',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600',
    thumbnail_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=300',
    google_drive_file_id: '1bBcDeFgHiJkLmNoPqRsTuVwXyZ02',
    file_name: 'eye_diagnostics_camp.jpg'
  },
  {
    id: 'gal-3',
    title: 'Annadanam Feeding Koyambedu',
    category: 'Food Distribution',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600',
    thumbnail_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=300',
    google_drive_file_id: '1cBcDeFgHiJkLmNoPqRsTuVwXyZ03',
    file_name: 'annadanam_koyambedu_feeding.jpg'
  }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ggjuvgyleograndnjrob.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_e8lprXB0lR4ZCMBe19lTDQ_Ijyc3hPG';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('gallery_items').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        return res.status(200).json(SEED_GALLERY);
      }
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const item = req.body;
      const { data, error } = await supabase.from('gallery_items').insert(item).select('*').single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
