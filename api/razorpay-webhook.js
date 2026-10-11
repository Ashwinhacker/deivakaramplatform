import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false, // For raw body verification
  },
};

// Helper to buffer request body
async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const rawBodyBuffer = await getRawBody(req);
    const rawBody = rawBodyBuffer.toString('utf8');
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (signature && webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).json({ error: 'Invalid webhook signature.' });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ggjuvgyleograndnjrob.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_e8lprXB0lR4ZCMBe19lTDQ_Ijyc3hPG';
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payment = event.payload.payment.entity;
      await supabase
        .from('donations')
        .update({ payment_status: 'successful' })
        .eq('transaction_id', payment.id);

      await supabase
        .from('celebration_bookings')
        .update({ payment_status: 'successful', booking_status: 'confirmed' })
        .or(`razorpay_payment_id.eq.${payment.id},razorpay_order_id.eq.${payment.order_id}`);
    } else if (eventType === 'payment.failed') {
      const payment = event.payload.payment.entity;
      await supabase
        .from('donations')
        .update({ payment_status: 'failed' })
        .eq('transaction_id', payment.id);

      await supabase
        .from('celebration_bookings')
        .update({ payment_status: 'failed' })
        .eq('razorpay_payment_id', payment.id);
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
