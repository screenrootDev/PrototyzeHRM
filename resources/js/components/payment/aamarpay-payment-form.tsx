import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, AlertCircle, ExternalLink } from 'lucide-react';

interface AamarpayPaymentFormProps {
  planId: number;
  planPrice: number;
  couponCode?: string;
  billingCycle: 'monthly' | 'yearly';
  aamarpayStoreId: string;
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AamarpayPaymentForm({
  planId,
  planPrice,
  couponCode,
  billingCycle,
  aamarpayStoreId,
  currency = 'BDT',
  onSuccess,
  onCancel,
}: AamarpayPaymentFormProps) {
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!aamarpayStoreId) {
      setError('Aamarpay not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create form and submit directly to avoid CORS/redirect issues
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = route('aamarpay.create-payment');
      
      // Add CSRF token
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = '_token';
      csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      form.appendChild(csrfInput);
      
      // Add form data
      const planIdInput = document.createElement('input');
      planIdInput.type = 'hidden';
      planIdInput.name = 'plan_id';
      planIdInput.value = planId.toString();
      form.appendChild(planIdInput);
      
      const billingCycleInput = document.createElement('input');
      billingCycleInput.type = 'hidden';
      billingCycleInput.name = 'billing_cycle';
      billingCycleInput.value = billingCycle;
      form.appendChild(billingCycleInput);
      
      if (couponCode) {
        const couponInput = document.createElement('input');
        couponInput.type = 'hidden';
        couponInput.name = 'coupon_code';
        couponInput.value = couponCode;
        form.appendChild(couponInput);
      }
      
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error('Aamarpay payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('bn-BD').format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {'Aamarpay Payment'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">{'Total Amount'}</span>
            <span className="text-lg font-bold">{formatPrice(planPrice)}</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {'Billing Cycle'}: {billingCycle}
          </div>
          {couponCode && (
            <div className="text-sm text-green-600 mt-1">
              {'Coupon Applied'}: {couponCode}
            </div>
          )}
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-900 mb-2">{'Supported Payment Methods'}</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• bKash</li>
            <li>• Nagad</li>
            <li>• Rocket</li>
            <li>• Bank Cards</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            {'Cancel'}
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isLoading || !aamarpayStoreId}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {'Redirecting...'}
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                {'Pay with Aamarpay'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}