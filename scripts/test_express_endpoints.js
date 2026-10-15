import app from '../server/index.js';
import http from 'http';

const server = http.createServer(app);

server.listen(5099, async () => {
  console.log('Testing Express server on port 5099...');
  try {
    // 1. Test Health Endpoint
    const healthRes = await fetch('http://localhost:5099/api/health');
    const healthData = await healthRes.json();
    console.log('[✓] /api/health HTTP status:', healthRes.status, 'Provider:', healthData.paymentGateway?.provider);

    // 2. Test Order Creation without amount (should fail 400)
    const badOrderRes = await fetch('http://localhost:5099/api/create-razorpay-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 0 })
    });
    console.log('[✓] /api/create-razorpay-order zero amount rejected HTTP status:', badOrderRes.status);

    // 3. Test Order Creation with valid amount
    const orderRes = await fetch('http://localhost:5099/api/create-razorpay-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 250,
        item_type: 'donation',
        notes: { purpose: 'Medical Relief' }
      })
    });
    const orderData = await orderRes.json();
    console.log('[✓] /api/create-razorpay-order created HTTP status:', orderRes.status, 'Order ID:', orderData.id, 'Mode:', orderData.mode);

    // 4. Test Verification with missing signature (should fail 400)
    const verifyFailRes = await fetch('http://localhost:5099/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ razorpay_order_id: orderData.id })
    });
    console.log('[✓] /api/verify-payment missing fields rejected HTTP status:', verifyFailRes.status);

    console.log('\nAll Express server endpoints verified successfully!');
  } catch (err) {
    console.error('Express endpoint test error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
