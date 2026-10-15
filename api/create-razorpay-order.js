import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keySecret.includes('placeholder')) {
      return res.status(503).json({
        error: 'Razorpay payment gateway is not configured. Please supply valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
        code: 'GATEWAY_UNCONFIGURED'
      });
    }

    const {
      amount,
      currency = 'INR',
      receipt,
      item_type = 'donation',
      item_id,
      selected_addons,
      food_count,
      donor_id,
      user_id,
      notes = {}
    } = req.body || {};

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    // 1. Authoritative server-side price calculation
    let authoritativeAmount = Number(amount);
    if (item_type === 'celebration_package' || item_id === 'birthday_anniversary' || item_id === 'virtual_birthday') {
      const defaultPackagePrices = {
        'birthday_anniversary': { base: 2500, minFood: 25, extraFoodRate: 70 },
        'virtual_birthday': { base: 3500, minFood: 20, extraFoodRate: 70 },
        'old_age_home': { base: 10000, minFood: 50, extraFoodRate: 70 },
        'orphanage_home': { base: 7500, minFood: 35, extraFoodRate: 70 },
        'feed_stray_animals': { base: 750, minFood: 25, extraFoodRate: 30 },
        'general_custom': { base: 1000, minFood: 1, extraFoodRate: 0 }
      };

      const pkgId = item_id || 'birthday_anniversary';
      let basePrice = defaultPackagePrices[pkgId]?.base || 2500;
      let minFood = defaultPackagePrices[pkgId]?.minFood || 25;
      let extraRate = defaultPackagePrices[pkgId]?.extraFoodRate || 70;

      if (supabase) {
        try {
          const { data: dbPkg } = await supabase.from('packages').select('*').eq('id', pkgId).maybeSingle();
          if (dbPkg?.base_price) {
            basePrice = Number(dbPkg.base_price);
            minFood = dbPkg.min_food_count || minFood;
          }
        } catch {}
      }

      authoritativeAmount = basePrice;
      if (food_count && food_count > minFood && extraRate > 0) {
        authoritativeAmount += (food_count - minFood) * extraRate;
      }

      const defaultAddonPrices = {
        'photo_cake': 800,
        'rose_milk': 150,
        'grocery_kit': 500,
        'stationery_kit': 25
      };

      if (selected_addons && typeof selected_addons === 'object') {
        for (const [addonKey, isSelected] of Object.entries(selected_addons)) {
          if (isSelected) {
            let addonPrice = defaultAddonPrices[addonKey] || 0;
            if (supabase) {
              try {
                const { data: dbAddon } = await supabase.from('addons').select('price').eq('id', addonKey).maybeSingle();
                if (dbAddon?.price) addonPrice = Number(dbAddon.price);
              } catch {}
            }
            authoritativeAmount += addonPrice;
          }
        }
      }
    }

    if (!authoritativeAmount || isNaN(authoritativeAmount) || authoritativeAmount <= 0) {
      return res.status(400).json({ error: 'Valid amount greater than ₹0 is required.' });
    }

    const isLive = keyId.startsWith('rzp_live_');
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const amountInPaise = Math.round(authoritativeAmount * 100);
    const orderReceipt = receipt || `dvk_rcpt_${Date.now()}`;

    // 2. Create official order using Razorpay SDK
    const orderPayload = {
      amount: amountInPaise,
      currency,
      receipt: orderReceipt,
      notes: {
        ...notes,
        item_type,
        item_id: item_id || '',
        verified_amount: String(authoritativeAmount),
        gateway_mode: isLive ? 'live' : 'test'
      }
    };

    const orderData = await razorpay.orders.create(orderPayload);

    // 3. Persist order in Supabase payment_orders
    if (supabase) {
      try {
        await supabase.from('payment_orders').insert({
          order_id: orderData.id,
          user_id: user_id || null,
          donor_id: donor_id || null,
          amount: authoritativeAmount,
          currency,
          status: 'pending',
          item_type,
          item_id: item_id ? String(item_id) : null,
          receipt: orderReceipt,
          notes: orderPayload.notes
        });
      } catch (err) {
        console.warn('Order persistence warning in serverless handler:', err.message);
      }
    }

    return res.status(200).json({
      id: orderData.id,
      entity: orderData.entity,
      amount: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.receipt,
      status: orderData.status,
      key_id: keyId,
      mode: isLive ? 'live' : 'test'
    });
  } catch (err) {
    console.error('Serverless order creation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create payment order.' });
  }
}
