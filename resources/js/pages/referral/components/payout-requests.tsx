import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';

interface PayoutRequestsProps {
  userType: string;
  payoutRequests: any;
  settings: any;
  stats: any;
  currencySymbol?: string;
}

export default function PayoutRequests({ userType, payoutRequests, settings, stats,currencySymbol }: PayoutRequestsProps) {
  

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    amount: '',
  });

  const { data: rejectData, setData: setRejectData, post: postReject, processing: rejectProcessing } = useForm({
    notes: '',
  });

  const handleCreatePayout = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('referral.payout-request.create'), {
      onSuccess: (page) => {
        setShowCreateDialog(false);
        reset();
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        if (typeof errors === 'string') {
          toast.error(errors);        }
      }
    });
  };

  const handleApprove = (request: any) => {
    post(route('referral.payout-request.approve', request.id), {
      onSuccess: (page) => {
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);        }
      },
      onError: (errors) => {
        if (typeof errors === 'string') {
          toast.error(errors);        }
      }
    });
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRequest) {
      postReject(route('referral.payout-request.reject', selectedRequest.id), {
        onSuccess: (page) => {
          setShowRejectDialog(false);
          setSelectedRequest(null);
          setRejectData('notes', '');
          if (page.props.flash.success) {
            toast.success(page.props.flash.success);          } else if (page.props.flash.error) {
            toast.error(page.props.flash.error);          }
        },
        onError: (errors) => {
          if (typeof errors === 'string') {
            toast.error(errors);          }
        }
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    } as const;

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    } as const;

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {userType === 'company' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{'Create Payout Request'}</CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button disabled={stats.availableBalance < settings.threshold_amount}>
                  <Plus className="h-4 w-4 mr-2" />
                  {'Request Payout'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{'Create Payout Request'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePayout} className="space-y-4">
                  <div>
                    <Label htmlFor="amount">{'Amount'}</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min={settings.threshold_amount}
                      max={stats.availableBalance}
                      value={data.amount}
                      onChange={(e) => setData('amount', e.target.value)}
                      placeholder={`Min: $${settings.threshold_amount}`}
                    />
                    {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{'Available Balance'}: {currencySymbol}{stats.availableBalance}</p>
                    <p>{'Minimum Amount'}: {currencySymbol}{settings.threshold_amount}</p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      {'Cancel'}
                    </Button>
                    <Button type="submit" disabled={processing}>
                      Submit Request
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.availableBalance < settings.threshold_amount
                ? `You need at least ${currencySymbol}${settings.threshold_amount} to request a payout`
                : `You can request up to ${currencySymbol}${stats.availableBalance} for payout`}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {userType === 'superadmin' ? 'All Payout Requests' : 'Your Payout Requests'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="dark:bg-gray-800 dark:border-gray-700">
                {userType === 'superadmin' && <TableHead>{'Company'}</TableHead>}
                <TableHead>{'Amount'}</TableHead>
                <TableHead>{'Status'}</TableHead>
                <TableHead>{'Date'}</TableHead>
                {userType === 'superadmin' && <TableHead>{'Actions'}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutRequests.data?.map((request: any) => (
                <TableRow key={request.id} className="dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800">
                  {userType === 'superadmin' && (
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.company?.name}</p>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">{request.company?.email}</p>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>{currencySymbol}{request.amount}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                  {userType === 'superadmin' && request.status === 'pending' && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(request)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectDialog(true);
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          {'Reject'}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{'Reject Payout Request'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4">
            <div>
              <Label htmlFor="notes">{'Rejection Reason'}</Label>
              <Textarea
                id="notes"
                value={rejectData.notes}
                onChange={(e) => setRejectData('notes', e.target.value)}
                placeholder={'Enter reason for rejection...'}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowRejectDialog(false)}>
                {'Cancel'}
              </Button>
              <Button type="submit" variant="destructive" disabled={rejectProcessing}>
                {'Reject Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}