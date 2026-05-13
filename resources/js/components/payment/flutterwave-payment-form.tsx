import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

import { toast } from '@/components/custom-toast';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';

interface FlutterwavePaymentFormProps {
  planId: number;
  planPrice: number;
  couponCode: string;
  billingCycle: string;
  flutterwaveKey: string;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FlutterwavePaymentForm({ 
  planId, 
  planPrice,
  couponCode, 
  billingCycle, 
  flutterwaveKey,
  currency,
  onSuccess, 
  onCancel 
}: FlutterwavePaymentFormProps) {
  
  const { auth } = usePage().props as any;
  const user = auth?.user;
  
  const initialized = useRef(false);

  const { processPayment } = usePaymentProcessor({
    onSuccess,
    onError: (error) => toast.error(error)
  });

  useEffect(() => {
    if (!flutterwaveKey || initialized.current) return;

    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    
    script.onload = () => {
      initialized.current = true;
      
      window.FlutterwaveCheckout({
        public_key: flutterwaveKey,
        tx_ref: `plan_${planId}_${Date.now()}`,
        amount: planPrice,
        currency: currency.toUpperCase(),
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: user?.email || 'user@example.com',
          phone_number: user?.phone || '',
          name: user?.name || 'Customer',
        },
        customizations: {
          title: 'Plan Subscription',
          description: 'Payment for subscription plan',
          logo: '',
        },
        callback: function (data: any) {
          if (data.status === 'successful') {
            processPayment('flutterwave');
          } else {
            toast.error('Payment was not completed');
            onCancel();
          }
        },
        onclose: function () {
          onCancel();
        },
      });
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [flutterwaveKey, planId, billingCycle, couponCode, currency]);

  if (!flutterwaveKey) {
    return <div className="p-4 text-center text-red-500">{'Flutterwave not configured'}</div>;
  }

  return (
    <div className="p-4 text-center">
      <p>{'Redirecting to Flutterwave...'}</p>
    </div>
  );
}

declare global {
  interface Window {
    FlutterwaveCheckout?: any;
  }
}