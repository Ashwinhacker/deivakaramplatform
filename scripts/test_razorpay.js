import dotenv from 'dotenv';
dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

console.log('Testing Razorpay Credentials:');
console.log('Key ID present:', Boolean(keyId), keyId ? keyId.substring(0, 8) + '...' : 'None');
console.log('Key Secret present:', Boolean(keySecret));
console.log('Mode:', keyId?.startsWith('rzp_live_') ? 'LIVE' : keyId?.startsWith('rzp_test_') ? 'TEST' : 'UNKNOWN');

if (!keyId || !keySecret) {
  console.log('Missing Razorpay credentials.');
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

async function testRazorpay() {
  try {
    const res = await fetch('https://api.razorpay.com/v1/payments?count=1', {
      headers: {
        'Authorization': authHeader
      }
    });
    const data = await res.json();
    console.log('Razorpay API HTTP status:', res.status);
    if (!res.ok) {
      console.log('Razorpay API error response:', data);
    } else {
      console.log('Razorpay API credentials verified successfully! Items returned:', data.items?.length);
    }
  } catch (err) {
    console.log('Razorpay API network/fetch error:', err.message);
  }
}

testRazorpay();
