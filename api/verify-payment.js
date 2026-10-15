import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_data,
      donation_data
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        verified: false,
        error: 'Missing required payment verification parameters (order_id, payment_id, signature).'
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret || keySecret.includes('placeholder')) {
      return res.status(503).json({
        verified: false,
        error: 'Payment verification secret is not configured on the server.'
      });
    }

    // 1. Authoritative Signature Verification using timing-safe comparison
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const receivedBuf = Buffer.from(razorpay_signature, 'utf-8');

    const isSignatureValid = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isSignatureValid) {
      return res.status(400).json({
        verified: false,
        error: 'Invalid payment signature. Transaction verification failed.'
      });
    }

    // 2. Authoritative check with Razorpay API
    let paymentRecord = null;
    if (keyId) {
      try {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        paymentRecord = await razorpay.payments.fetch(razorpay_payment_id);
        if (paymentRecord && paymentRecord.order_id !== razorpay_order_id) {
          return res.status(400).json({
            verified: false,
            error: 'Payment does not match the expected order ID.'
          });
        }
        if (paymentRecord && paymentRecord.status !== 'captured' && paymentRecord.status !== 'authorized') {
          return res.status(400).json({
            verified: false,
            error: `Payment status is not verified. Current state: ${paymentRecord.status}`
          });
        }
      } catch (rzpErr) {
        console.warn('Razorpay payment fetch warning:', rzpErr.message);
      }
    }

    const verifiedAmount = paymentRecord 
      ? Number(paymentRecord.amount) / 100 
      : Number(donation_data?.amount || booking_data?.total_amount || 0);

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    let createdDonation = null;
    let createdBooking = null;

    if (supabase) {
      // 3. Mark payment_order as paid
      try {
        await supabase
          .from('payment_orders')
          .update({
            status: 'paid',
            razorpay_payment_id,
            razorpay_signature,
            updated_at: new Date().toISOString()
          })
          .eq('order_id', razorpay_order_id);
      } catch (e) {}

      // 4. Record Donation
      if (donation_data) {
        const seq = Math.floor(100000 + Math.random() * 900000);
        const donationId = `DVK-DON-${new Date().getFullYear()}-${seq}`;
        const receiptNumber = `DVK-REC-${seq}`;

        const baseDonation = {
          donation_id: donationId,
          donor_id: donation_data.donor_id || null,
          campaign_id: donation_data.campaign_id || null,
          amount: verifiedAmount || Number(donation_data.amount),
          purpose: donation_data.purpose || 'Celebration / General Donation',
          payment_method: 'Razorpay',
          transaction_id: razorpay_payment_id,
          razorpay_order_id,
          payment_status: 'successful',
          receipt_number: receiptNumber,
          is_anonymous: !!donation_data.is_anonymous,
          message: donation_data.message || null
        };

        const { data: don, error: donErr } = await supabase
          .from('donations')
          .insert({ ...baseDonation, plan: donation_data.plan || 'One-Time Contribution' })
          .select('*')
          .maybeSingle();

        if (!donErr && don) {
          createdDonation = don;
        } else {
          const { data: fallbackDon } = await supabase
            .from('donations')
            .insert(baseDonation)
            .select('*')
            .maybeSingle();
          createdDonation = fallbackDon;
        }

        if (donation_data.campaign_id) {
          const { data: cmp } = await supabase.from('campaigns').select('raised_amount').eq('id', donation_data.campaign_id).single();
          if (cmp) {
            await supabase.from('campaigns').update({ raised_amount: Number(cmp.raised_amount || 0) + verifiedAmount }).eq('id', donation_data.campaign_id);
          }
        }
      }

      // 5. Record Celebration Booking
      if (booking_data) {
        const seq = Math.floor(100000 + Math.random() * 900000);
        const bookingId = booking_data.booking_id || `DVK-CEL-${new Date().getFullYear()}-${seq}`;

        const bookingPayload = {
          booking_id: bookingId,
          donor_id: booking_data.donor_id || null,
          donation_id: createdDonation ? createdDonation.id : null,
          customer_name: booking_data.customer_name,
          customer_phone: booking_data.customer_phone,
          customer_email: booking_data.customer_email,
          celebrant_name: booking_data.celebrant_name,
          occasion_type: booking_data.occasion_type || 'Birthday',
          occasion_date: booking_data.occasion_date,
          banner_photo_url: booking_data.banner_photo_url,
          banner_photo_name: booking_data.banner_photo_name || null,
          is_virtual: !!booking_data.is_virtual,
          virtual_time_slot: booking_data.virtual_time_slot || null,
          food_count: Number(booking_data.food_count || 25),
          package_id: booking_data.package_id,
          package_name: booking_data.package_name,
          cake_details: booking_data.cake_details || null,
          selected_addons: booking_data.selected_addons || [],
          total_amount: verifiedAmount || Number(booking_data.total_amount),
          razorpay_payment_id,
          razorpay_order_id,
          payment_status: 'successful',
          booking_status: 'confirmed',
          notes: booking_data.notes || null
        };

        const { data: bData } = await supabase
          .from('celebration_bookings')
          .insert(bookingPayload)
          .select('*')
          .maybeSingle();

        createdBooking = bData || { ...bookingPayload, id: `temp-${Date.now()}` };
      }
    }

    return res.status(200).json({
      success: true,
      verified: true,
      razorpay_payment_id,
      razorpay_order_id,
      mode: keyId?.startsWith('rzp_live_') ? 'live' : 'test',
      donation: createdDonation,
      booking: createdBooking
    });
  } catch (err) {
    console.error('Payment verification error in serverless handler:', err);
    return res.status(500).json({ error: err.message || 'Verification failed.' });
  }
}
