import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wallet } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { router } from '@inertiajs/react';

interface SkrillPaymentFormProps {
  planId: number;
  couponCode: string;
  billingCycle: 'monthly' | 'yearly';
  planPrice: number;
  skrillMerchantId: string;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SkrillPaymentForm({
  planId,
  couponCode,
  billingCycle,
  planPrice,
  skrillMerchantId,
  currency,
  onSuccess,
  onCancel
}: SkrillPaymentFormProps) {
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate Skrill payment processing
      const paymentData = {
        plan_id: planId,
        billing_cycle: billingCycle,
        coupon_code: couponCode || null,
        payment_id: `skrill_${Date.now()}`,
        transaction_id: `txn_${Date.now()}`,
        email: email
      };

      router.post(route('skrill.payment'), paymentData, {
        onSuccess: () => {
          toast.success('Payment successful!');
          onSuccess();
        },
        onError: (errors) => {
          console.error('Skrill payment error:', errors);
          toast.error('Payment failed. Please try again.');
        },
        onFinish: () => {
          setIsProcessing(false);
        }
      });
    } catch (error) {
      console.error('Skrill payment error:', error);
      toast.error('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          {'Skrill Payment'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{'Email Address'}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={'Enter your email address'}
              required
            />
            <p className="text-xs text-muted-foreground">
              {'You will be redirected to Skrill to complete the payment'}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              {'Cancel'}
            </Button>
            <Button type="submit" disabled={isProcessing} className="flex-1">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {'Processing...'}
                </>
              ) : (
                `Pay ${currency} ${planPrice}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}