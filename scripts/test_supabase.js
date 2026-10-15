import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Connection:');
console.log('URL provided:', Boolean(supabaseUrl), supabaseUrl ? new URL(supabaseUrl).hostname : 'None');
console.log('Anon key provided:', Boolean(anonKey));
console.log('Service role key provided:', Boolean(serviceKey));

if (!supabaseUrl || (!anonKey && !serviceKey)) {
  console.log('Missing Supabase credentials in .env');
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceKey || anonKey);

async function testTables() {
  console.log('\nChecking connectivity to Supabase host...');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const healthCheck = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: anonKey || serviceKey },
      signal: controller.signal
    });
    clearTimeout(timeout);
    console.log(`[✓] Auth endpoint reachable (HTTP ${healthCheck.status})`);
  } catch (err) {
    console.log(`[✗] Network/DNS connection failed: ${err.message}`);
    console.log('    Notice: The current Supabase URL host could not be reached.');
    console.log('    Please verify your Supabase Project URL in .env is active and correct.\n');
    return;
  }

  const tables = [
    'users', 'admin_users', 'donors', 'donations', 'campaigns',
    'volunteers', 'beneficiaries', 'assistance_records', 'events',
    'contact_messages', 'receipts', 'notifications', 'audit_logs',
    'celebration_bookings', 'packages', 'addons', 'news', 'gallery_items',
    'settings', 'success_stories', 'payment_orders', 'webhook_events'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await client.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`[-] ${table}: ERROR -> ${error.message} (${error.code})`);
      } else {
        console.log(`[+] ${table}: OK (count: ${count})`);
      }
    } catch (e) {
      console.log(`[!] ${table}: EXCEPTION -> ${e.message}`);
      break;
    }
  }
}

testTables();
