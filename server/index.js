import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS and JSON body parsing with rawBody capture for webhooks
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Supabase Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ggjuvgyleograndnjrob.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_e8lprXB0lR4ZCMBe19lTDQ_Ijyc3hPG';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Razorpay Credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_ThjuUUhraxOPtf';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'XbfEsqjOEUuL7LcnBa60GiHi';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'XbfEsqjOEUuL7LcnBa60GiHi';

console.log(`[Deivakaram Backend]: Initialized with Supabase URL: ${SUPABASE_URL}`);
console.log(`[Deivakaram Backend]: Razorpay Key ID: ${RAZORPAY_KEY_ID}`);

// Audit and notification helper
const logAudit = async (action, module, recordId = null, oldData = null, newData = null, userId = null) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      module,
      record_id: recordId ? String(recordId) : null,
      old_data: oldData ? JSON.stringify(oldData) : null,
      new_data: newData ? JSON.stringify(newData) : null
    });
  } catch (err) {
    console.warn('[Audit Log Error]:', err.message);
  }
};

const notifyAdmins = async (title, message, type = 'alert', userId = null) => {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      read_status: false
    });
  } catch (err) {
    console.warn('[Notification Error]:', err.message);
  }
};

// =============================================================================
// 1. HEALTH CHECK & SYSTEM DIAGNOSTICS
// =============================================================================
app.get('/api/health', async (req, res) => {
  try {
    const tableChecks = await Promise.allSettled([
      supabase.from('users').select('count').limit(1),
      supabase.from('donations').select('count').limit(1),
      supabase.from('campaigns').select('count').limit(1),
      supabase.from('volunteers').select('count').limit(1),
      supabase.from('beneficiaries').select('count').limit(1),
      supabase.from('events').select('count').limit(1),
      supabase.from('celebration_bookings').select('count').limit(1),
      supabase.from('packages').select('count').limit(1),
      supabase.from('addons').select('count').limit(1),
      supabase.from('news').select('count').limit(1),
      supabase.from('gallery_items').select('count').limit(1),
      supabase.from('settings').select('count').limit(1)
    ]);

    const formatCheck = (result) => {
      if (result.status === 'fulfilled' && !result.value.error) return 'available';
      if (result.value?.error?.message?.includes('schema cache')) return 'migration pending (run migration script)';
      return result.value?.error?.message || 'offline';
    };

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: tableChecks[0].status === 'fulfilled' && !tableChecks[0].value.error,
        users: formatCheck(tableChecks[0]),
        donations: formatCheck(tableChecks[1]),
        campaigns: formatCheck(tableChecks[2]),
        volunteers: formatCheck(tableChecks[3]),
        beneficiaries: formatCheck(tableChecks[4]),
        events: formatCheck(tableChecks[5]),
        celebration_bookings: formatCheck(tableChecks[6]),
        packages: formatCheck(tableChecks[7]),
        addons: formatCheck(tableChecks[8]),
        news: formatCheck(tableChecks[9]),
        gallery_items: formatCheck(tableChecks[10]),
        settings: formatCheck(tableChecks[11])
      },
      paymentGateway: {
        provider: 'Razorpay',
        keyId: RAZORPAY_KEY_ID,
        isConfigured: Boolean(RAZORPAY_KEY_ID)
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Overall stats overview for CRM dashboard
app.get('/api/stats', async (req, res) => {
  try {
    const [donationsRes, donorsRes, campaignsRes, volunteersRes, beneficiariesRes, eventsRes, celebrationsRes] = await Promise.allSettled([
      supabase.from('donations').select('amount, payment_status'),
      supabase.from('donors').select('id'),
      supabase.from('campaigns').select('id, status'),
      supabase.from('volunteers').select('id, status'),
      supabase.from('beneficiaries').select('id, status'),
      supabase.from('events').select('id, status'),
      supabase.from('celebration_bookings').select('total_amount, payment_status')
    ]);

    const donations = donationsRes.status === 'fulfilled' && donationsRes.value.data ? donationsRes.value.data : [];
    const successfulDonations = donations.filter(d => d.payment_status === 'successful');
    const totalDonationsAmount = successfulDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const celebrations = celebrationsRes.status === 'fulfilled' && celebrationsRes.value.data ? celebrationsRes.value.data : [];
    const successfulCelebrations = celebrations.filter(c => c.payment_status === 'successful');
    const totalCelebrationsAmount = successfulCelebrations.reduce((sum, c) => sum + Number(c.total_amount || 0), 0);

    const donorsCount = donorsRes.status === 'fulfilled' && donorsRes.value.data ? donorsRes.value.data.length : 0;
    const campaignsCount = campaignsRes.status === 'fulfilled' && campaignsRes.value.data ? campaignsRes.value.data.length : 0;
    const volunteersCount = volunteersRes.status === 'fulfilled' && volunteersRes.value.data ? volunteersRes.value.data.length : 0;
    const beneficiariesCount = beneficiariesRes.status === 'fulfilled' && beneficiariesRes.value.data ? beneficiariesRes.value.data.length : 0;
    const eventsCount = eventsRes.status === 'fulfilled' && eventsRes.value.data ? eventsRes.value.data.length : 0;

    res.json({
      totalRaised: totalDonationsAmount + totalCelebrationsAmount,
      totalDonationsAmount,
      totalCelebrationsAmount,
      totalTransactions: successfulDonations.length + successfulCelebrations.length,
      donorsCount,
      campaignsCount,
      volunteersCount,
      beneficiariesCount,
      eventsCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 2. RAZORPAY PAYMENT GATEWAY LOGIC
// =============================================================================
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const orderReceipt = receipt || `rcpt_${Date.now()}`;
    const isLiveSecret = RAZORPAY_KEY_SECRET && !RAZORPAY_KEY_SECRET.includes('placeholder');

    if (isLiveSecret) {
      const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: orderReceipt,
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
      console.log(`[Razorpay Backend Sandbox]: Generated order ID ${simulatedOrderId} for ₹${amount}`);
      
      return res.status(200).json({
        id: simulatedOrderId,
        entity: 'order',
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency,
        receipt: orderReceipt,
        status: 'created',
        attempts: 0,
        notes,
        created_at: Math.floor(Date.now() / 1000)
      });
    }
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment order.' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_data,
      donation_data
    } = req.body;

    if (!razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing razorpay_payment_id.' });
    }

    const isLiveSecret = RAZORPAY_KEY_SECRET && !RAZORPAY_KEY_SECRET.includes('placeholder');
    if (isLiveSecret && razorpay_order_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          verified: false,
          error: 'Invalid payment signature. Transaction verification failed.'
        });
      }
    }

    let createdDonation = null;
    let createdBooking = null;

    // 1. Record Donation in Supabase
    if (donation_data) {
      const seq = Math.floor(100000 + Math.random() * 900000);
      const donationId = `DVK-DON-${new Date().getFullYear()}-${seq}`;
      const receiptNumber = `DVK-REC-${seq}`;

      const baseDonation = {
        donation_id: donationId,
        donor_id: donation_data.donor_id || null,
        campaign_id: donation_data.campaign_id || null,
        amount: Number(donation_data.amount),
        purpose: donation_data.purpose || 'Celebration / General Donation',
        payment_method: 'Razorpay',
        transaction_id: razorpay_payment_id,
        payment_status: 'successful',
        receipt_number: receiptNumber,
        is_anonymous: Boolean(donation_data.is_anonymous),
        message: donation_data.message || null
      };

      const { data: don, error: donErr } = await supabase
        .from('donations')
        .insert({
          ...baseDonation,
          plan: donation_data.plan || 'One-Time Contribution'
        })
        .select('*')
        .maybeSingle();

      if (!donErr && don) {
        createdDonation = don;
      } else {
        const { data: donFallback } = await supabase
          .from('donations')
          .insert(baseDonation)
          .select('*')
          .maybeSingle();
        createdDonation = donFallback;
      }

      // If campaign linked, increment raised_amount
      if (donation_data.campaign_id) {
        const { data: cmp } = await supabase
          .from('campaigns')
          .select('raised_amount')
          .eq('id', donation_data.campaign_id)
          .single();
        if (cmp) {
          await supabase
            .from('campaigns')
            .update({ raised_amount: Number(cmp.raised_amount || 0) + Number(donation_data.amount) })
            .eq('id', donation_data.campaign_id);
        }
      }
    }

    // 2. Record Celebration Booking in Supabase
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
        is_virtual: Boolean(booking_data.is_virtual),
        virtual_time_slot: booking_data.virtual_time_slot || null,
        food_count: Number(booking_data.food_count || 25),
        package_id: booking_data.package_id,
        package_name: booking_data.package_name,
        cake_details: booking_data.cake_details || null,
        selected_addons: booking_data.selected_addons || [],
        total_amount: Number(booking_data.total_amount),
        razorpay_payment_id,
        razorpay_order_id: razorpay_order_id || null,
        payment_status: 'successful',
        booking_status: 'confirmed',
        notes: booking_data.notes || null
      };

      const { data: bData, error: bErr } = await supabase
        .from('celebration_bookings')
        .insert(bookingPayload)
        .select('*')
        .maybeSingle();

      if (!bErr && bData) {
        createdBooking = bData;
      } else {
        console.warn('Could not insert to celebration_bookings:', bErr?.message);
        createdBooking = { ...bookingPayload, id: `temp-${Date.now()}` };
      }
    }

    // Notifications & Audit Log
    await notifyAdmins(
      'Payment Received & Verified',
      `Payment ${razorpay_payment_id} verified for ₹${donation_data?.amount || booking_data?.total_amount || 0} (${booking_data?.celebrant_name || donation_data?.purpose || 'Trust Fund'}).`,
      'donation'
    );

    await logAudit(
      'verify_payment',
      'Payments',
      razorpay_payment_id,
      null,
      { amount: donation_data?.amount || booking_data?.total_amount, razorpay_payment_id }
    );

    return res.status(200).json({
      success: true,
      verified: true,
      razorpay_payment_id,
      razorpay_order_id,
      donation: createdDonation,
      booking: createdBooking
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: err.message || 'Payment verification failed.' });
  }
});

app.post('/api/razorpay-webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = RAZORPAY_WEBHOOK_SECRET;

    if (signature && webhookSecret && req.rawBody) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.warn('[Razorpay Webhook]: Signature mismatch.');
        return res.status(400).json({ error: 'Invalid webhook signature.' });
      }
    }

    const event = req.body;
    const eventType = event.event;
    console.log(`[Razorpay Webhook]: Received event: ${eventType}`);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payment = event.payload.payment.entity;
      const paymentId = payment.id;
      const orderId = payment.order_id;

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

      await supabase
        .from('donations')
        .update({ payment_status: 'failed' })
        .eq('transaction_id', paymentId);

      await supabase
        .from('celebration_bookings')
        .update({ payment_status: 'failed' })
        .eq('razorpay_payment_id', paymentId);
    }

    return res.status(200).json({ status: 'ok', received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Internal webhook handling error.' });
  }
});

// =============================================================================
// 3. DONATIONS REST API
// =============================================================================
app.get('/api/donations', async (req, res) => {
  try {
    const { status, purpose, limit = 100, offset = 0 } = req.query;
    let query = supabase
      .from('donations')
      .select('*, donors(name, email, phone, pan)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) query = query.eq('payment_status', status);
    if (purpose) query = query.eq('purpose', purpose);

    const { data, count, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map(d => ({
      id: d.id,
      donation_id: d.donation_id,
      donor_id: d.donor_id,
      campaign_id: d.campaign_id,
      amount: Number(d.amount),
      purpose: d.purpose,
      plan: d.plan,
      payment_method: d.payment_method,
      transaction_id: d.transaction_id,
      payment_status: d.payment_status,
      receipt_number: d.receipt_number,
      is_anonymous: d.is_anonymous,
      message: d.message,
      created_at: d.created_at,
      donor_name: d.donors?.name || 'Anonymous',
      donor_email: d.donors?.email || 'anonymous@deivakaram.org',
      donor_phone: d.donors?.phone || null,
      donor_pan: d.donors?.pan || null
    }));

    res.json({ data: formatted, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/donations', async (req, res) => {
  try {
    const {
      amount,
      purpose = 'General Fund',
      plan = 'One-Time Contribution',
      payment_method = 'Manual / Bank',
      transaction_id,
      payment_status = 'successful',
      donor_name,
      donor_email,
      donor_phone,
      donor_pan,
      donor_address,
      campaign_id,
      is_anonymous = false,
      message
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    let donorId = null;
    if (donor_email) {
      const { data: existingDonor } = await supabase
        .from('donors')
        .select('id')
        .eq('email', donor_email.toLowerCase().trim())
        .maybeSingle();

      if (existingDonor) {
        donorId = existingDonor.id;
      } else {
        const { data: newD } = await supabase
          .from('donors')
          .insert({
            name: donor_name || 'Anonymous Donor',
            email: donor_email.toLowerCase().trim(),
            phone: donor_phone || null,
            address: donor_address || null,
            pan: donor_pan ? donor_pan.toUpperCase() : null,
            donor_type: 'New Donor'
          })
          .select('id')
          .single();
        if (newD) donorId = newD.id;
      }
    }

    const seq = Math.floor(100000 + Math.random() * 900000).toString();
    const donationId = `DVK-DON-${new Date().getFullYear()}-${seq}`;
    const receiptNumber = `DVK-REC-${seq}`;
    const txId = transaction_id || `TXN-MAN-${Date.now()}`;

    const { data: newDonation, error } = await supabase
      .from('donations')
      .insert({
        donation_id: donationId,
        donor_id: donorId,
        campaign_id: campaign_id || null,
        amount: Number(amount),
        purpose,
        plan,
        payment_method,
        transaction_id: txId,
        payment_status,
        receipt_number: receiptNumber,
        is_anonymous: Boolean(is_anonymous),
        message: message || null
      })
      .select('*')
      .single();

    if (error) throw error;

    await notifyAdmins(
      'New Donation Recorded',
      `₹${amount} recorded for ${purpose} by ${donor_name || 'Anonymous'}.`,
      'donation'
    );
    await logAudit('create_donation', 'Donations', newDonation.id, null, newDonation);

    res.status(201).json(newDonation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 4. DONORS REST API
// =============================================================================
app.get('/api/donors', async (req, res) => {
  try {
    const { data: donors, error: dErr } = await supabase
      .from('donors')
      .select('*')
      .order('created_at', { ascending: false });

    if (dErr) throw dErr;

    const { data: donations } = await supabase
      .from('donations')
      .select('donor_id, amount, payment_status, created_at');

    const enriched = (donors || []).map(donor => {
      const donorDonations = (donations || []).filter(
        d => d.donor_id === donor.id && d.payment_status === 'successful'
      );
      const totalAmount = donorDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
      const lastDonation = donorDonations.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        ...donor,
        total_donations: totalAmount,
        donation_count: donorDonations.length,
        last_donation_date: lastDonation ? lastDonation.created_at : null
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/donors', async (req, res) => {
  try {
    const { name, email, phone, address, pan, donor_type = 'New Donor' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const { data, error } = await supabase
      .from('donors')
      .insert({
        name,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        address: address || null,
        pan: pan ? pan.toUpperCase() : null,
        donor_type
      })
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('create_donor', 'Donors', data.id, null, data);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/donors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('donors')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('update_donor', 'Donors', id, null, updates);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 5. CAMPAIGNS REST API
// =============================================================================
app.get('/api/campaigns', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const campaign = req.body;
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaign,
        raised_amount: 0.00,
        status: campaign.status || 'active'
      })
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('create_campaign', 'Campaigns', data.id, null, data);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('update_campaign', 'Campaigns', id, null, updates);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) throw error;
    await logAudit('delete_campaign', 'Campaigns', id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 6. VOLUNTEERS REST API
// =============================================================================
app.get('/api/volunteers', async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from('volunteers').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/volunteers', async (req, res) => {
  try {
    const volData = req.body;
    const seq = Math.floor(100000 + Math.random() * 900000).toString();
    const volunteerId = `DVK-VOL-${seq}`;

    const { data, error } = await supabase
      .from('volunteers')
      .insert({
        ...volData,
        volunteer_id: volunteerId,
        status: 'submitted'
      })
      .select('*')
      .single();

    if (error) throw error;

    await notifyAdmins(
      'New Volunteer Application',
      `${data.name} submitted a volunteer application.`,
      'volunteer'
    );
    await logAudit('submit_volunteer', 'Volunteers', data.id, null, data);

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/volunteers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('volunteers')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('update_volunteer_status', 'Volunteers', id, null, updates);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 7. BENEFICIARIES & ASSISTANCE REST API
// =============================================================================
app.get('/api/beneficiaries', async (req, res) => {
  try {
    const { status, category } = req.query;
    let query = supabase.from('beneficiaries').select('*, assistance_records(*)').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/beneficiaries', async (req, res) => {
  try {
    const caseData = req.body;
    const seq = Math.floor(100000 + Math.random() * 900000).toString();
    const caseId = `DVK-CASE-${seq}`;

    const { data, error } = await supabase
      .from('beneficiaries')
      .insert({
        ...caseData,
        case_id: caseId,
        status: 'submitted',
        priority: caseData.priority || 'Medium'
      })
      .select('*')
      .single();

    if (error) throw error;

    await notifyAdmins(
      'New Beneficiary Assistance Request',
      `Case ${caseId} submitted for ${data.name} (${data.category}).`,
      'case'
    );
    await logAudit('submit_case', 'Beneficiaries', data.id, null, data);

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/beneficiaries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('beneficiaries')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('update_case_status', 'Beneficiaries', id, null, updates);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assistance-records', async (req, res) => {
  try {
    const { beneficiary_id, amount, assistance_type, date, notes } = req.body;
    const { data, error } = await supabase
      .from('assistance_records')
      .insert({
        beneficiary_id,
        amount: Number(amount),
        assistance_type,
        date: date || new Date().toISOString().split('T')[0],
        notes: notes || null
      })
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('grant_assistance', 'Beneficiaries', beneficiary_id, null, data);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 8. EVENTS REST API
// =============================================================================
app.get('/api/events', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const event = req.body;
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...event,
        registrations: event.registrations || [],
        status: event.status || 'upcoming'
      })
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('create_event', 'Events', data.id, null, data);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('update_event', 'Events', id, null, updates);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    await logAudit('delete_event', 'Events', id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register volunteer for an event
app.post('/api/events/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Volunteer name is required.' });

    const { data: event, error: fErr } = await supabase
      .from('events')
      .select('registrations, title')
      .eq('id', id)
      .single();

    if (fErr) throw fErr;

    const regs = Array.isArray(event.registrations) ? event.registrations : [];
    if (!regs.includes(name)) {
      regs.push(name);
      const { data: updated, error: uErr } = await supabase
        .from('events')
        .update({ registrations: regs })
        .eq('id', id)
        .select('*')
        .single();

      if (uErr) throw uErr;

      await notifyAdmins(
        'Volunteer Registered for Event',
        `${name} registered for "${event.title}".`,
        'volunteer'
      );
      return res.json(updated);
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 9. NEWS & PRESS BULLETINS REST API
// =============================================================================
app.get('/api/news', async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = supabase.from('news').select('*').order('date', { ascending: false });
    if (category && category !== 'All') query = query.eq('category', category);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      // Fallback if table not yet created
      console.warn('[News API]: Falling back to seed articles:', error.message);
      return res.json([
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
      ]);
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/news', async (req, res) => {
  try {
    const article = req.body;
    const { data, error } = await supabase
      .from('news')
      .insert({
        ...article,
        status: article.status || 'published',
        date: article.date || new Date().toISOString().split('T')[0]
      })
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('publish_news', 'News', data.id, null, data);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('news')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('update_news', 'News', id, null, updates);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) throw error;
    await logAudit('delete_news', 'News', id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 10. GALLERY ITEMS REST API
// =============================================================================
app.get('/api/gallery', async (req, res) => {
  try {
    const { category } = req.query;
    let query = supabase.from('gallery_items').select('*').order('created_at', { ascending: false });
    if (category && category !== 'All') query = query.eq('category', category);

    const { data, error } = await query;
    if (error) {
      // Fallback if table pending migration
      return res.json([
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
        }
      ]);
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gallery', async (req, res) => {
  try {
    const item = req.body;
    const { data, error } = await supabase
      .from('gallery_items')
      .insert(item)
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('add_gallery_item', 'Gallery', data.id, null, data);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/gallery/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('gallery_items').delete().eq('id', id);
    if (error) throw error;
    await logAudit('delete_gallery_item', 'Gallery', id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 11. CONTACT INQUIRIES REST API
// =============================================================================
app.get('/api/contact', async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required.' });
    }

    const seq = Math.floor(100000 + Math.random() * 900000).toString();
    const inquiryId = `DVK-INQ-${seq}`;

    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        inquiry_id: inquiryId,
        name,
        email,
        phone: phone || null,
        subject,
        message,
        status: 'pending'
      })
      .select('*')
      .single();

    if (error) throw error;

    await notifyAdmins(
      'New Public Inquiry Received',
      `Inquiry "${subject}" received from ${name} (${email}).`,
      'message'
    );

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/contact/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('resolve_inquiry', 'Messages', id, null, { status });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 12. CELEBRATION BOOKINGS REST API
// =============================================================================
app.get('/api/celebrations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('celebration_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/celebrations', async (req, res) => {
  try {
    const booking = req.body;
    const { data, error } = await supabase
      .from('celebration_bookings')
      .insert(booking)
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/celebrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('celebration_bookings')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('update_celebration_booking', 'Celebrations', id, null, updates);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/celebrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('celebration_bookings').delete().eq('id', id);
    if (error) throw error;
    await logAudit('delete_celebration_booking', 'Celebrations', id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 13. PACKAGES & ADDONS API
// =============================================================================
app.get('/api/packages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('base_price', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/packages', async (req, res) => {
  try {
    const pkg = req.body;
    const { data, error } = await supabase
      .from('packages')
      .insert(pkg)
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('create_package', 'Packages', data.id, null, data);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('update_package', 'Packages', id, null, updates);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('packages').delete().eq('id', id);
    if (error) throw error;
    await logAudit('delete_package', 'Packages', id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/addons', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('addons')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/addons', async (req, res) => {
  try {
    const addon = req.body;
    const { data, error } = await supabase
      .from('addons')
      .insert(addon)
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('create_addon', 'Packages', data.id, null, data);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/addons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('addons')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    await logAudit('update_addon', 'Packages', id, null, updates);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/addons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('addons').delete().eq('id', id);
    if (error) throw error;
    await logAudit('delete_addon', 'Packages', id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 14. SETTINGS REST API
// =============================================================================
app.get('/api/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) {
      return res.json({
        id: 'default',
        orgName: 'Deivakaram Charitable Trust',
        orgAddress: '14 Gandhipuram, Coimbatore, Tamil Nadu - 641012',
        orgEmail: 'contact@deivakaram.org',
        orgPhone: '+91 98765 43210',
        trustUpiId: process.env.VITE_TRUST_UPI_ID || 'ashwinop58@okicici',
        paymentGateway: 'Razorpay',
        googleDriveFolderId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
        googleDriveFolderName: 'Deivakaram Official Trust Media Drive'
      });
    }

    res.json({
      id: data.id,
      orgName: data.org_name,
      orgAddress: data.org_address,
      orgEmail: data.org_email,
      orgPhone: data.org_phone,
      trustUpiId: data.trust_upi_id,
      socialFacebook: data.social_facebook,
      socialTwitter: data.social_twitter,
      socialInstagram: data.social_instagram,
      socialLinkedin: data.social_linkedin,
      paymentGateway: data.payment_gateway,
      paymentApiKey: data.payment_api_key,
      paymentSecretKey: data.payment_secret_key,
      paymentWebhookUrl: data.payment_webhook_url,
      smtpHost: data.smtp_host,
      smtpPort: data.smtp_port,
      smtpUser: data.smtp_user,
      smtpPass: data.smtp_pass,
      smtpSenderName: data.smtp_sender_name,
      smtpSenderEmail: data.smtp_sender_email,
      twoFactorEnabled: data.two_factor_enabled,
      googleDriveFolderId: data.google_drive_folder_id,
      googleDriveFolderName: data.google_drive_folder_name,
      googleDriveWebhookUrl: data.google_drive_webhook_url
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const s = req.body;
    const dbPayload = {
      id: 'default',
      org_name: s.orgName || s.org_name,
      org_address: s.orgAddress || s.org_address,
      org_email: s.orgEmail || s.org_email,
      org_phone: s.orgPhone || s.org_phone,
      trust_upi_id: s.trustUpiId || s.trust_upi_id,
      social_facebook: s.socialFacebook || s.social_facebook,
      social_twitter: s.socialTwitter || s.social_twitter,
      social_instagram: s.socialInstagram || s.social_instagram,
      social_linkedin: s.socialLinkedin || s.social_linkedin,
      payment_gateway: s.paymentGateway || s.payment_gateway,
      payment_api_key: s.paymentApiKey || s.payment_api_key,
      payment_secret_key: s.paymentSecretKey || s.payment_secret_key,
      payment_webhook_url: s.paymentWebhookUrl || s.payment_webhook_url,
      smtp_host: s.smtpHost || s.smtp_host,
      smtp_port: s.smtpPort || s.smtp_port,
      smtp_user: s.smtpUser || s.smtp_user,
      smtp_pass: s.smtpPass || s.smtp_pass,
      smtp_sender_name: s.smtpSenderName || s.smtp_sender_name,
      smtp_sender_email: s.smtpSenderEmail || s.smtp_sender_email,
      two_factor_enabled: s.twoFactorEnabled ?? s.two_factor_enabled,
      google_drive_folder_id: s.googleDriveFolderId || s.google_drive_folder_id,
      google_drive_folder_name: s.googleDriveFolderName || s.google_drive_folder_name,
      google_drive_webhook_url: s.googleDriveWebhookUrl || s.google_drive_webhook_url,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('settings')
      .upsert(dbPayload)
      .select('*')
      .single();

    if (error) {
      console.warn('Supabase settings update error, returning formatted payload:', error.message);
      return res.json(s);
    }

    await logAudit('update_settings', 'Settings', 'default', null, dbPayload);
    res.json(s);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 15. NOTIFICATIONS & AUDIT LOGS REST API
// =============================================================================
app.get('/api/notifications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notifications/read', async (req, res) => {
  try {
    const { id } = req.body || {};
    let query = supabase.from('notifications').update({ read_status: true });
    if (id) query = query.eq('id', id);
    else query = query.eq('read_status', false);

    const { error } = await query;
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/audit-logs', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, users(name, role)')
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    const formatted = (data || []).map(l => ({
      id: l.id,
      user_id: l.user_id,
      user_name: l.users?.name || 'System Admin',
      role: l.users?.role || 'super_admin',
      action: l.action,
      module: l.module,
      record_id: l.record_id,
      old_data: l.old_data,
      new_data: l.new_data,
      created_at: l.created_at
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 16. ADMIN USERS & RBAC API
// =============================================================================
app.get('/api/admin/users', async (req, res) => {
  try {
    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('*, admin_users(permissions, status)')
      .in('role', ['sub_admin', 'super_admin'])
      .order('created_at', { ascending: true });

    if (uErr) throw uErr;

    const formatted = (users || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      permissions: u.admin_users?.permissions || [],
      created_at: u.created_at
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users', async (req, res) => {
  try {
    const { name, email, phone, permissions = [] } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const { data: user, error: uErr } = await supabase
      .from('users')
      .insert({
        name,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        role: 'sub_admin',
        status: 'active'
      })
      .select('*')
      .single();

    if (uErr) throw uErr;

    await supabase.from('admin_users').insert({
      id: user.id,
      permissions,
      status: 'active'
    });

    await logAudit('create_sub_admin', 'Admins', user.id, null, { name, email, permissions });
    res.status(201).json({ ...user, permissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, permissions, status } = req.body;

    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (email) userUpdates.email = email.toLowerCase().trim();
    if (phone !== undefined) userUpdates.phone = phone;
    if (role) userUpdates.role = role;
    if (status) userUpdates.status = status;

    if (Object.keys(userUpdates).length > 0) {
      await supabase.from('users').update(userUpdates).eq('id', id);
    }

    if (permissions !== undefined || status !== undefined) {
      const adminUpdates = {};
      if (permissions !== undefined) adminUpdates.permissions = permissions;
      if (status !== undefined) adminUpdates.status = status;
      await supabase.from('admin_users').update(adminUpdates).eq('id', id);
    }

    await logAudit('update_admin_user', 'Admins', id, null, req.body);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('admin_users').delete().eq('id', id);
    await supabase.from('users').delete().eq('id', id);
    await logAudit('delete_admin_user', 'Admins', id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static assets if built
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.resolve(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Deivakaram Backend</title></head>
        <body style="font-family: system-ui, -apple-system, sans-serif; padding: 40px; text-align: center; background: #f8fafc; color: #1e293b;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <h1 style="color: #0A4A9C; margin-bottom: 8px;">🚀 Deivakaram Enterprise API Server</h1>
            <p style="color: #64748b;">The backend server is active and running on port ${PORT}.</p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0; text-align: left;">
              <p style="margin: 0 0 8px 0; font-weight: 600;">How to view the full application:</p>
              <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
                <li><strong>Development Mode:</strong> Run <code>npm run dev</code> and open <a href="http://localhost:5173" style="color: #0A4A9C;">http://localhost:5173</a></li>
                <li><strong>Production Bundle:</strong> Run <code>npm run build</code>, then refresh this page.</li>
              </ul>
            </div>
            <p><a href="/api/health" style="display: inline-block; background: #0A4A9C; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">Check API Health</a></p>
          </div>
        </body>
        </html>
      `);
    }
  });
});

export default app;

// If started directly with node
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`🚀 Deivakaram Enterprise Server listening on http://localhost:${PORT}`);
  });
}
