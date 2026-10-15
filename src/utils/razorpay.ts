// DEIVAKARAM RAZORPAY GATEWAY INTEGRATION UTILITY
// Handles dynamic script loading, real order initiation, checkout dialog launch,
// and authoritative server-side signature verification.

export interface RazorpayOptions {
  keyId?: string;
  amount: number; // in Rupees
  name?: string;
  description: string;
  orderId?: string;
  item_type?: 'donation' | 'celebration_package' | 'campaign' | 'general';
  item_id?: string;
  selected_addons?: Record<string, boolean>;
  food_count?: number;
  donation_data?: any;
  booking_data?: any;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes?: Record<string, string>;
  simulateFailure?: boolean; // For testing UI failure states
}

export interface RazorpaySuccessResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  verified: boolean;
  donation?: any;
  booking?: any;
}

export interface RazorpayFailureResult {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.getElementById('razorpay-checkout-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[Razorpay Gateway]: checkout.js script failed to load from Razorpay CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const initiateRazorpayPayment = async (
  options: RazorpayOptions
): Promise<RazorpaySuccessResult> => {
  // Ensure Razorpay SDK is loaded
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !(window as any).Razorpay) {
    throw {
      code: 'GATEWAY_UNAVAILABLE',
      description: 'Unable to connect to Razorpay secure checkout service. Please check your internet connection or try again later.',
      source: 'network',
      step: 'checkout_load',
      reason: 'cdn_unreachable'
    } as RazorpayFailureResult;
  }

  // Optional UI testing parameter
  if (options.simulateFailure) {
    throw {
      code: 'BAD_REQUEST_ERROR',
      description: 'Payment authorization declined by issuing bank.',
      source: 'gateway',
      step: 'payment_authorization',
      reason: 'payment_failed'
    } as RazorpayFailureResult;
  }

  // 1. Authoritative Order Creation on Backend
  let orderData: any = null;
  let activeKey = options.keyId;

  try {
    const orderRes = await fetch('/api/create-razorpay-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: options.amount,
        currency: 'INR',
        receipt: `dvk_rcpt_${Date.now()}`,
        item_type: options.item_type || 'donation',
        item_id: options.item_id,
        selected_addons: options.selected_addons,
        food_count: options.food_count,
        notes: options.notes || {}
      })
    });

    if (!orderRes.ok) {
      const errBody = await orderRes.json().catch(() => ({}));
      throw new Error(errBody.error || `Server order creation failed with status ${orderRes.status}`);
    }

    orderData = await orderRes.json();
    if (orderData.key_id) {
      activeKey = orderData.key_id;
    }
  } catch (err: any) {
    console.error('[Razorpay Order Creation Error]:', err);
    throw {
      code: 'ORDER_CREATION_FAILED',
      description: err.message || 'Unable to initiate secure payment order with Razorpay.',
      source: 'backend',
      step: 'order_creation',
      reason: 'api_error'
    } as RazorpayFailureResult;
  }

  const finalOrderId = orderData?.id || options.orderId;
  if (!finalOrderId || !finalOrderId.startsWith('order_')) {
    throw {
      code: 'INVALID_ORDER',
      description: 'Invalid order returned by payment gateway. Transaction aborted.',
      source: 'gateway',
      step: 'order_validation',
      reason: 'malformed_order_id'
    } as RazorpayFailureResult;
  }

  const envKey = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
  const keyToUse = activeKey || envKey;
  if (!keyToUse) {
    throw {
      code: 'MISSING_KEY',
      description: 'Razorpay Public Key ID is not configured.',
      source: 'client',
      step: 'config',
      reason: 'unconfigured_key'
    } as RazorpayFailureResult;
  }

  // 2. Launch Razorpay Checkout Modal
  return new Promise<RazorpaySuccessResult>((resolve, reject) => {
    let isSettled = false;

    const rzpOptions = {
      key: keyToUse,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: options.name || 'DEIVAKARAM CHARITABLE TRUST',
      description: options.description,
      image: '/logo.png',
      order_id: finalOrderId,
      prefill: {
        name: options.prefill.name,
        email: options.prefill.email,
        contact: options.prefill.contact
      },
      notes: options.notes || {},
      theme: {
        color: '#0A4A9C'
      },
      modal: {
        ondismiss: () => {
          if (!isSettled) {
            isSettled = true;
            reject({
              code: 'PAYMENT_CANCELLED',
              description: 'Payment window was closed by the donor before completion.',
              source: 'customer',
              step: 'checkout_modal',
              reason: 'user_dismissed'
            } as RazorpayFailureResult);
          }
        }
      },
      handler: async (response: any) => {
        if (isSettled) return;
        isSettled = true;

        if (!response.razorpay_payment_id || !response.razorpay_signature) {
          reject({
            code: 'INCOMPLETE_PAYMENT',
            description: 'Payment response from gateway was incomplete.',
            source: 'gateway',
            step: 'response_handler',
            reason: 'missing_payment_details'
          } as RazorpayFailureResult);
          return;
        }

        // 3. Authoritative Server-side Verification
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id || finalOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              donation_data: options.donation_data,
              booking_data: options.booking_data
            })
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.verified) {
            reject({
              code: 'VERIFICATION_FAILED',
              description: verifyData.error || 'Server signature verification rejected the payment transaction.',
              source: 'backend',
              step: 'verification',
              reason: 'signature_or_amount_mismatch'
            } as RazorpayFailureResult);
            return;
          }

          resolve({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id || finalOrderId,
            razorpay_signature: response.razorpay_signature,
            verified: true,
            donation: verifyData.donation,
            booking: verifyData.booking
          });
        } catch (vErr: any) {
          console.error('[Verification Network Error]:', vErr);
          reject({
            code: 'VERIFICATION_NETWORK_ERROR',
            description: 'Payment succeeded at gateway, but server verification could not be confirmed. Webhook reconciliation will complete your transaction.',
            source: 'network',
            step: 'verification',
            reason: vErr.message || 'network_error'
          } as RazorpayFailureResult);
        }
      }
    };

    try {
      const rzpInstance = new (window as any).Razorpay(rzpOptions);

      rzpInstance.on('payment.failed', (resp: any) => {
        if (!isSettled) {
          isSettled = true;
          reject({
            code: resp.error?.code || 'PAYMENT_FAILED',
            description: resp.error?.description || 'Payment authorization was declined.',
            source: resp.error?.source || 'gateway',
            step: resp.error?.step || 'payment',
            reason: resp.error?.reason || 'declined'
          } as RazorpayFailureResult);
        }
      });

      rzpInstance.open();
    } catch (err: any) {
      if (!isSettled) {
        isSettled = true;
        reject({
          code: 'CHECKOUT_OPEN_ERROR',
          description: err.message || 'Could not launch Razorpay Checkout modal.',
          source: 'client',
          step: 'open',
          reason: 'exception'
        } as RazorpayFailureResult);
      }
    }
  });
};
