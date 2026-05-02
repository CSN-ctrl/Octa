import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AdminRejectAffiliateDialogProps = {
  open: boolean;
  rejectionReason: string;
  onOpenChange: (open: boolean) => void;
  onRejectionReasonChange: (value: string) => void;
  onCancel: () => void;
  onReject: () => void;
};

export function AdminRejectAffiliateDialog({
  open,
  rejectionReason,
  onOpenChange,
  onRejectionReasonChange,
  onCancel,
  onReject,
}: AdminRejectAffiliateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Affiliate Application</DialogTitle>
          <DialogDescription>Provide a reason for rejecting this application (optional)</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button variant="destructive" onClick={onReject} className="flex-1">
              Reject Application
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
