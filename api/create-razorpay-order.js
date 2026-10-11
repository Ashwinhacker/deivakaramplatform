import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body || {};

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_ThjuUUhraxOPtf';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'XbfEsqjOEUuL7LcnBa60GiHi';

    const isLiveSecret = keySecret && !keySecret.includes('placeholder');

    if (isLiveSecret) {
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
          notes
        })
      });

      const orderData = await rzpResponse.json();
      if (!rzpResponse.ok) {
        throw new Error(orderData.error?.description || 'Razorpay order creation failed.');
      }
      return res.status(200).json(orderData);
    } else {
      const simulatedOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
      return res.status(200).json({
        id: simulatedOrderId,
        entity: 'order',
        amount: amountInPaise,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        status: 'created',
        notes,
        created_at: Math.floor(Date.now() / 1000)
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create order' });
  }
}
