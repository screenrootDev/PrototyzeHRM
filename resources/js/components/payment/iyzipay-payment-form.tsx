import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { router } from '@inertiajs/react';

interface IyzipayPaymentFormProps {
  planId: number;
  planPrice: number;
  couponCode?: string;
  billingCycle: 'monthly' | 'yearly';
  iyzipayPublicKey: string;
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function IyzipayPaymentForm({
  planId,
  planPrice,
  couponCode,
  billingCycle,
  iyzipayPublicKey,
  currency = 'USD',
  onSuccess,
  onCancel,
}: IyzipayPaymentFormProps) {
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!iyzipayPublicKey) {
      setError('Iyzipay configuration is missing');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create payment form
      const response = await fetch(route('iyzipay.create-form'), {
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
        // Redirect to Iyzipay payment page
        window.location.href = data.redirect_url;
      } else {
        throw new Error(data.error || 'Failed to create payment form');
      }
    } catch (err) {
      console.error('Iyzipay payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
    } finally {
      setIsLoading(false);
    }
  };



  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {'Iyzipay Payment'}
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

        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>{'Redirecting to payment page...'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {'You will be redirected to Iyzipay secure payment page to complete your payment.'}
              </AlertDescription>
            </Alert>

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
                disabled={isLoading || !iyzipayPublicKey}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {'Processing...'}
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {'Pay with Iyzipay'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          {'Powered by Iyzipay - Secure payment processing'}
        </div>
      </CardContent>
    </Card>
  );
}