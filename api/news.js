import { createClient } from '@supabase/supabase-js';

const SEED_NEWS = [
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
      const { data, error } = await supabase.from('news').select('*').order('date', { ascending: false });
      if (error) {
        return res.status(200).json(SEED_NEWS);
      }
      return res.status(200).json(data && data.length > 0 ? data : SEED_NEWS);
    }

    if (req.method === 'POST') {
      const article = req.body;
      const { data, error } = await supabase.from('news').insert({
        ...article,
        status: article.status || 'published',
        date: article.date || new Date().toISOString().split('T')[0]
      }).select('*').single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
