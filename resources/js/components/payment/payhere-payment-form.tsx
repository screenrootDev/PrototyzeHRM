import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from '@/components/custom-toast';

interface PayHerePaymentFormProps {
  planId: number;
  planPrice: number;
  couponCode?: string;
  billingCycle: 'monthly' | 'yearly';
  payhereMerchantId: string;
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PayHerePaymentForm({
  planId,
  planPrice,
  couponCode,
  billingCycle,
  payhereMerchantId,
  currency = 'LKR',
  onSuccess,
  onCancel,
}: PayHerePaymentFormProps) {
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!payhereMerchantId) {
      setError('PayHere not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(route('payhere.create-payment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          plan_id: planId,
          billing_cycle: billingCycle,
          coupon_code: couponCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Create form and submit
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.payment_url;

        Object.keys(data.payment_data).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = data.payment_data[key];
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error(data.error || 'Payment creation failed');
      }
    } catch (err) {
      console.error('PayHere payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK').format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {'PayHere Payment'}
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

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {'You will be redirected to PayHere to complete your payment securely.'}
          </AlertDescription>
        </Alert>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h4 className="font-medium text-orange-900 mb-2">{'Supported Payment Methods'}</h4>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Visa/Mastercard</li>
            <li>• Lanka QR</li>
            <li>• eZ Cash</li>
            <li>• mCash</li>
            <li>• Bank Transfers</li>
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
            disabled={isLoading || !payhereMerchantId}
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
                {'Pay with PayHere'}
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          {'Powered by PayHere - Sri Lanka\'s payment gateway'}
        </div>
      </CardContent>
    </Card>
  );
}