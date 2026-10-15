import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('Testing Supabase Auth with:', SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const testPhone = '9840999888';
  const testEmail = `donor${testPhone}@gmail.com`;
  const testPassword = 'Password@123';

  console.log(`Testing SignUp for ${testEmail}...`);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        name: 'Test Donor Kumar',
        phone: testPhone,
        role: 'donor'
      }
    }
  });

  if (signUpErr) {
    console.log('SignUp result:', signUpErr.message);
  } else {
    console.log('SignUp successful! User ID:', signUpData?.user?.id);
  }

  console.log(`Testing SignIn with ${testEmail}...`);
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (signInErr) {
    console.log('SignIn result:', signInErr.message);
  } else {
    console.log('SignIn successful! Session access_token exists:', Boolean(signInData?.session?.access_token));
    console.log('User metadata:', signInData?.user?.user_metadata);
  }
}

run().catch(console.error);
