// components/CrudDeleteModal.tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';


interface CrudDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  entityName: string;
}

export function CrudDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  entityName
}: CrudDeleteModalProps) {
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{"Delete"} {entityName}</DialogTitle>
          <DialogDescription>
            {"Are you sure you want to delete"} {itemName || `this ${entityName}`}? {"This action cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {"Cancel"}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {"Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
