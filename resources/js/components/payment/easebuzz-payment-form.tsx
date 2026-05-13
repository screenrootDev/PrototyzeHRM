import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from '@/components/custom-toast';

interface EasebuzzPaymentFormProps {
  planId: number;
  planPrice: number;
  couponCode?: string;
  billingCycle: 'monthly' | 'yearly';
  easebuzzMerchantKey: string;
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EasebuzzPaymentForm({
  planId,
  planPrice,
  couponCode,
  billingCycle,
  easebuzzMerchantKey,
  currency = 'INR',
  onSuccess,
  onCancel,
}: EasebuzzPaymentFormProps) {
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!easebuzzMerchantKey) {
      setError('Easebuzz not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(route('easebuzz.create-payment'), {
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
        // Direct redirect to Easebuzz payment URL
        window.location.href = data.payment_url;
      } else {
        throw new Error(data.error || 'Payment creation failed');
      }
    } catch (err) {
      console.error('Easebuzz payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN').format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {'Easebuzz Payment'}
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
            {'You will be redirected to Easebuzz to complete your payment securely.'}
          </AlertDescription>
        </Alert>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">{'Supported Payment Methods'}</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Credit/Debit Cards</li>
            <li>• Net Banking</li>
            <li>• UPI</li>
            <li>• Wallets</li>
            <li>• EMI Options</li>
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
            disabled={isLoading || !easebuzzMerchantKey}
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
                {'Pay with Easebuzz'}
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          {'Powered by Easebuzz - Secure payment processing'}
        </div>
      </CardContent>
    </Card>
  );
}