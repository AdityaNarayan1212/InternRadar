import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-xl ring-1 ring-[#E4E7EC] shadow-lg max-w-sm w-full p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-fit-red/10 text-fit-red flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-semibold text-[#111317]">{title}</h2>
            <p className="text-sm text-[#5B6270] mt-1">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[#5B6270] hover:text-[#111317]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-fit-red text-white hover:bg-fit-red/90 disabled:opacity-50"
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
