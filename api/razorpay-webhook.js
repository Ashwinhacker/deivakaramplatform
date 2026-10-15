import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false, // For raw body buffer verification
  },
};

// Helper to buffer request stream
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

    if (!signature || !webhookSecret) {
      return res.status(400).json({ error: 'Missing webhook signature or secret.' });
    }

    // 1. Authoritative Signature Verification
    const isSignatureValid = Razorpay.validateWebhookSignature(rawBody, signature, webhookSecret);
    if (!isSignatureValid) {
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const eventId = req.headers['x-razorpay-event-id'] || event.event_id || `${eventType}_${event.payload?.payment?.entity?.id || Date.now()}`;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    if (supabase) {
      // 2. Idempotency Check
      try {
        const { data: existingEvent } = await supabase
          .from('webhook_events')
          .select('id')
          .eq('event_id', eventId)
          .maybeSingle();

        if (existingEvent) {
          return res.status(200).json({ status: 'ok', message: 'Event already processed' });
        }
      } catch (e) {}

      // 3. Process Events
      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        const payment = event.payload.payment.entity;
        const paymentId = payment.id;
        const orderId = payment.order_id;

        if (orderId) {
          await supabase
            .from('payment_orders')
            .update({ status: 'paid', razorpay_payment_id: paymentId, updated_at: new Date().toISOString() })
            .eq('order_id', orderId);
        }

        await supabase
          .from('donations')
          .update({ payment_status: 'successful' })
          .eq('transaction_id', paymentId);

        await supabase
          .from('celebration_bookings')
          .update({ payment_status: 'successful', booking_status: 'confirmed' })
          .or(`razorpay_payment_id.eq.${paymentId},razorpay_order_id.eq.${orderId}`);

      } else if (eventType === 'payment.failed') {
        const payment = event.payload.payment.entity;
        const paymentId = payment.id;
        const orderId = payment.order_id;

        if (orderId) {
          await supabase
            .from('payment_orders')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('order_id', orderId);
        }

        await supabase
          .from('donations')
          .update({ payment_status: 'failed' })
          .eq('transaction_id', paymentId);

        await supabase
          .from('celebration_bookings')
          .update({ payment_status: 'failed' })
          .eq('razorpay_payment_id', paymentId);

      } else if (eventType === 'refund.processed' || eventType === 'payment.refunded') {
        const payment = event.payload.payment.entity;
        const paymentId = payment.id;
        const orderId = payment.order_id;

        if (orderId) {
          await supabase
            .from('payment_orders')
            .update({ status: 'refunded', updated_at: new Date().toISOString() })
            .eq('order_id', orderId);
        }

        await supabase
          .from('donations')
          .update({ payment_status: 'refunded' })
          .eq('transaction_id', paymentId);
      }

      // 4. Record Event for idempotency
      try {
        await supabase.from('webhook_events').insert({
          event_id: eventId,
          event_type: eventType,
          processed_at: new Date().toISOString(),
          payload: event
        });
      } catch (e) {}
    }

    return res.status(200).json({ status: 'ok', received: true, event_id: eventId });
  } catch (err) {
    console.error('Serverless webhook error:', err);
    return res.status(500).json({ error: 'Internal webhook handling error.' });
  }
}
