import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

import { toast } from '@/components/custom-toast';
import axios from 'axios';
import '../../../css/cashfree-modal-fix.css';

interface CashfreePaymentFormProps {
  planId: number;
  planPrice: number;
  couponCode: string;
  billingCycle: 'monthly' | 'yearly';
  cashfreeAppId: string;
  mode?: 'sandbox' | 'production';
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CashfreePaymentForm({
  planId,
  planPrice,
  couponCode,
  billingCycle,
  cashfreeAppId,
  mode = 'sandbox',
  currency = 'INR',
  onSuccess,
  onCancel
}: CashfreePaymentFormProps) {
  
  
  useEffect(() => {
    // Check if Cashfree SDK is already loaded
    if (window && (window as any).Cashfree) {
      return;
    }
    
    // Load Cashfree SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onerror = () => {
      toast.error('Failed to load Cashfree SDK. Please try again.');
    };
    document.body.appendChild(script);
    
    return () => {
      // Only remove if we added it
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [mode]);
  
  const handlePayment = async () => {
    try {
      // Create payment session on the server
      const response = await axios.post(route('cashfree.create-session'), {
        plan_id: planId,
        billing_cycle: billingCycle,
        coupon_code: couponCode,
        _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      });
      
      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }
      
      const { payment_session_id, order_id, amount, mode: serverMode } = response.data;
      
      if (!payment_session_id || !order_id) {
        toast.error('Invalid response from server');
        return;
      }
      
      if (!serverMode) {
        toast.error('Payment mode not configured');
        return;
      }
      
      if (!(window as any).Cashfree) {
        toast.error('Cashfree SDK not loaded');
        return;
      }
      
      // Initialize Cashfree with mode
      const cashfreeMode = serverMode === 'production' ? 'PROD' : 'SANDBOX';
      try {
        const cashfree = (window as any).Cashfree({
          mode: cashfreeMode
        });
      } catch (error) {
        toast.error('Failed to initialize Cashfree: ' + error.message);
        return;
      }
      
      const cashfree = (window as any).Cashfree({
        mode: cashfreeMode
      });
      
      const checkoutOptions = {
        paymentSessionId: payment_session_id,
        returnUrl: window.location.origin + route('dashboard'),
        redirectTarget: '_modal',
        mode: cashfreeMode,
        style: {
          zIndex: 99999
        }
      };
      
      // Open Cashfree checkout
      cashfree.checkout(checkoutOptions).then((result: any) => {
        if (result.error) {
          toast.error(result.error.message || 'Payment failed');
          return;
        }
        
        if (result.paymentDetails) {
          // Payment completed, verify on server
          axios.post(route('cashfree.verify-payment'), {
            order_id: order_id,
            cf_payment_id: result.paymentDetails?.paymentId,
            plan_id: planId,
            billing_cycle: billingCycle,
            coupon_code: couponCode,
            _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
          })
          .then((response) => {
            onSuccess();
          })
          .catch((error) => {
            const errorMsg = error.response?.data?.error || 'Payment verification failed';
            toast.error(errorMsg);
          });
        } else {
          toast.error('Payment status unclear');
        }
      }).catch((error: any) => {
        toast.error(error.message || 'Payment initialization failed');
      });
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to initialize payment';
      toast.error(errorMsg);
    }
  };
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {'You will be redirected to Cashfree to complete your payment.'}
      </p>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          {'Cancel'}
        </Button>
        <Button onClick={handlePayment} className="flex-1">
          {'Pay with Cashfree'}
        </Button>
      </div>
    </div>
  );
}