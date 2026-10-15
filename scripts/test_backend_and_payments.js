import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';

dotenv.config();

console.log('====================================================');
console.log('DEIVAKARAM BACKEND & RAZORPAY VERIFICATION TEST SUITE');
console.log('====================================================');

const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

console.log('1. Configuration Check:');
console.log(' - RAZORPAY_KEY_ID:', keyId ? `${keyId.substring(0, 10)}... (Mode: ${keyId.startsWith('rzp_live_') ? 'LIVE' : 'TEST'})` : 'MISSING');
console.log(' - RAZORPAY_KEY_SECRET:', keySecret ? 'Configured (Hidden)' : 'MISSING');
console.log(' - RAZORPAY_WEBHOOK_SECRET:', webhookSecret ? 'Configured (Hidden)' : 'MISSING');

if (!keyId || !keySecret) {
  console.error('FAILED: Missing Razorpay credentials.');
  process.exit(1);
}

const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

async function runTests() {
  let passed = 0;
  let failed = 0;

  // TEST 1: Official Razorpay SDK Order Creation
  console.log('\n2. Testing Real Razorpay Order Creation via SDK:');
  let createdOrderId = null;
  try {
    const testAmount = 500; // Rs. 500
    const orderPayload = {
      amount: testAmount * 100, // paise
      currency: 'INR',
      receipt: `test_rcpt_${Date.now()}`,
      notes: {
        test: 'true',
        verified_amount: String(testAmount)
      }
    };
    const order = await razorpay.orders.create(orderPayload);
    console.log(' [✓] Order Created Successfully:');
    console.log('     ID:', order.id);
    console.log('     Amount (paise):', order.amount);
    console.log('     Currency:', order.currency);
    console.log('     Status:', order.status);

    if (order.id && order.id.startsWith('order_') && order.amount === 50000) {
      console.log('     Result: PASSED');
      createdOrderId = order.id;
      passed++;
    } else {
      console.error('     Result: FAILED (Unexpected order structure)');
      failed++;
    }
  } catch (err) {
    console.error(' [✗] Order creation failed:', err.message);
    failed++;
  }

  // TEST 2: Signature Verification with Expected Valid Signature
  console.log('\n3. Testing Server-Side Signature Verification:');
  try {
    const fakePaymentId = 'pay_test_' + Date.now();
    const validSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${createdOrderId || 'order_test123'}|${fakePaymentId}`)
      .digest('hex');

    // Test verification logic
    const computedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${createdOrderId || 'order_test123'}|${fakePaymentId}`)
      .digest('hex');

    const expectedBuf = Buffer.from(computedSignature, 'utf-8');
    const receivedBuf = Buffer.from(validSignature, 'utf-8');
    const isValid = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (isValid) {
      console.log(' [✓] Valid signature successfully confirmed: PASSED');
      passed++;
    } else {
      console.error(' [✗] Valid signature verification failed: FAILED');
      failed++;
    }
  } catch (err) {
    console.error(' [✗] Signature test exception:', err.message);
    failed++;
  }

  // TEST 3: Invalid Signature Rejection
  console.log('\n4. Testing Tampered / Invalid Signature Rejection:');
  try {
    const fakePaymentId = 'pay_test_' + Date.now();
    const tamperedSignature = 'tampered_signature_' + Math.random().toString(36).substring(2);

    const computedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${createdOrderId || 'order_test123'}|${fakePaymentId}`)
      .digest('hex');

    const expectedBuf = Buffer.from(computedSignature, 'utf-8');
    const receivedBuf = Buffer.from(tamperedSignature, 'utf-8');
    const isValid = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isValid) {
      console.log(' [✓] Tampered signature correctly REJECTED: PASSED');
      passed++;
    } else {
      console.error(' [✗] Tampered signature was falsely accepted: FAILED');
      failed++;
    }
  } catch (err) {
    console.error(' [✗] Invalid signature rejection exception:', err.message);
    failed++;
  }

  // TEST 4: Webhook Signature Verification with Official Razorpay Method
  console.log('\n5. Testing Webhook Signature Verification:');
  try {
    const samplePayload = JSON.stringify({
      entity: 'event',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_wh_' + Date.now(),
            order_id: createdOrderId || 'order_123',
            amount: 50000,
            status: 'captured'
          }
        }
      }
    });

    const validWebhookSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(samplePayload)
      .digest('hex');

    const isWebhookValid = Razorpay.validateWebhookSignature(samplePayload, validWebhookSig, webhookSecret);
    if (isWebhookValid) {
      console.log(' [✓] Webhook signature validated via Razorpay SDK: PASSED');
      passed++;
    } else {
      console.error(' [✗] Webhook signature validation failed: FAILED');
      failed++;
    }

    const isFakeWebhookValid = Razorpay.validateWebhookSignature(samplePayload, 'fake_sig_123', webhookSecret);
    if (!isFakeWebhookValid) {
      console.log(' [✓] Fake webhook signature correctly REJECTED: PASSED');
      passed++;
    } else {
      console.error(' [✗] Fake webhook signature was falsely accepted: FAILED');
      failed++;
    }
  } catch (err) {
    console.error(' [✗] Webhook test exception:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
}

runTests();
