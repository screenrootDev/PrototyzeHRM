import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import axios from 'axios';

interface PayTabsPaymentFormProps {
  planId: number;
  couponCode: string;
  billingCycle: 'monthly' | 'yearly';
  planPrice: number;
  paytabsClientKey: string;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PayTabsPaymentForm({
  planId,
  couponCode,
  billingCycle,
  planPrice,
  paytabsClientKey,
  currency,
  onSuccess,
  onCancel
}: PayTabsPaymentFormProps) {
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const paymentData = {
        plan_id: planId,
        billing_cycle: billingCycle,
        coupon_code: couponCode || null,
        payment_id: `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      };

      const response = await axios.post(route('paytabs.payment'), paymentData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 30000
      });

      if (response.data.success && response.data.redirect_url) {
        toast.success('Redirecting to PayTabs payment page...');
        setTimeout(() => {
          window.location.href = response.data.redirect_url;
        }, 1000);
      } else {
        throw new Error(response.data.message || 'Payment initialization failed');
      }
    } catch (error: any) {
      console.error('PayTabs payment error:', error);
      
      let errorMessage = 'Payment failed. Please try again.';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid payment request. Please check your details.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      }
      
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {'PayTabs Payment'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  {'Secure Payment with PayTabs'}
                </h4>
                <p className="text-sm text-blue-700">
                  {'You will be redirected to PayTabs secure payment page to complete your transaction.'}
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">{'Plan'}:</span>
              <span className="text-sm text-gray-900">{'Subscription Plan'}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">{'Billing Cycle'}:</span>
              <span className="text-sm text-gray-900 capitalize">{billingCycle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">{'Amount'}:</span>
              <span className="text-lg font-bold text-gray-900">{currency} {planPrice}</span>
            </div>
            {couponCode && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <span className="text-sm font-medium text-green-600">{'Coupon Applied'}:</span>
                <span className="text-sm text-green-700 font-medium">{couponCode}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1"
              disabled={isProcessing}
            >
              {'Cancel'}
            </Button>
            <Button 
              type="button" 
              onClick={handlePayment} 
              disabled={isProcessing} 
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {'Redirecting...'}
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {`Pay ${currency} ${planPrice}`}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}