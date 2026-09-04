import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/custom-toast';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  importRoute: string;
  parseRoute: string;
  sampleRoute?: string;
  importNotes: string;
  databaseFields: { key: string; required?: boolean }[];
  modalSize?: 'sm' | 'md' | 'lg' | 'xl';
}

/** A small CSV importer compatible with the employee page's shared import API. */
export function ImportModal({ isOpen, onClose, title, importRoute, importNotes, modalSize = 'lg' }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const submit = () => {
    if (!file) {
      toast.error('Please select a CSV file.');
      return;
    }
    setIsImporting(true);
    router.post(route(importRoute), { file }, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => { setFile(null); onClose(); },
      onFinish: () => setIsImporting(false),
    });
  };

  const sizes = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg', xl: 'sm:max-w-xl' };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isImporting && onClose()}>
      <DialogContent className={sizes[modalSize]}>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee-import">CSV file</Label>
            <Input id="employee-import" type="file" accept=".csv,text/csv" disabled={isImporting} onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </div>
          <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{importNotes}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>Cancel</Button>
          <Button onClick={submit} disabled={!file || isImporting}>{isImporting ? 'Importing...' : 'Import'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
