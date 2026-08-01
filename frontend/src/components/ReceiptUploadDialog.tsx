import { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Upload, X, FileText, Zap } from 'lucide-react';
import { useUploadReceipt } from '../hooks/useReceipts';
import { useExpenses } from '../hooks/useExpenses';
import { compressImage, type CompressionResult } from '../lib/compress-image';
import i18n from '../i18n';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import type { Expense, PaginatedResponse } from '../services/expenses.service';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
const ALLOWED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.heic,.pdf';

interface ReceiptUploadDialogProps {
  open: boolean;
  onClose: () => void;
  entityType?: string;
  entityId?: string;
}

export function ReceiptUploadDialog({ open, onClose, entityType = 'receipt', entityId }: ReceiptUploadDialogProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compression, setCompression] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>(entityId || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadReceipt();
  const { data: expenses = [] } = useExpenses();
  const expenseList = useMemo(() => {
    const raw: Expense[] | PaginatedResponse<Expense> | undefined = expenses;
    return Array.isArray(raw) ? raw : raw?.data || [];
  }, [expenses]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t('receipts.uploadDialog.invalidFileType'));
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error(t('receipts.uploadDialog.fileTooLarge'));
      return;
    }

    setSelectedFile(file);
    setCompression(null);

    if (file.type.startsWith('image/') && file.type !== 'image/heic') {
      setIsCompressing(true);
      try {
        const result = await compressImage(file);
        setCompression(result);
        setSelectedFile(result.file);
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(result.file);
      } catch {
        toast.error(t('receipts.uploadDialog.compressionFailed'));
      } finally {
        setIsCompressing(false);
      }
    } else {
      setCompression(null);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const uploadFile = compression?.file ?? selectedFile;
      await uploadMutation.mutateAsync({
        file: uploadFile,
        entityType,
        entityId: selectedExpenseId || entityId,
      });
      toast.success(t('receipts.uploadDialog.uploadSuccess'));
      handleClose();
    } catch {
      toast.error(t('receipts.uploadDialog.uploadFailed'));
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setCompression(null);
    setIsCompressing(false);
    setSelectedExpenseId(entityId || '');
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const savedBytes = compression ? compression.originalSize - compression.compressedSize : 0;
  const savedPercent = compression ? Math.round((savedBytes / compression.originalSize) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('receipts.uploadDialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">{t('receipts.uploadDialog.dragDrop')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('receipts.uploadDialog.formats')}
              </p>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {preview ? (
                    <img src={preview} alt={t('receipts.uploadDialog.previewAlt')} className="h-10 w-10 object-cover rounded" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setSelectedFile(null); setPreview(null); setCompression(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isCompressing && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  <Zap className="h-3 w-3 animate-pulse" />
                  {t('receipts.uploadDialog.compressing')}
                </div>
              )}

              {compression && !isCompressing && savedBytes > 0 && (
                <div className="flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg px-3 py-2">
                  <Zap className="h-3 w-3" />
                  <span>
                    {t('receipts.uploadDialog.compressed', { from: formatFileSize(compression.originalSize), to: formatFileSize(compression.compressedSize) })}
                    ({t('receipts.uploadDialog.savings', { percent: savedPercent })})
                  </span>
                </div>
              )}

              {preview && (
                <div className="rounded-lg overflow-hidden border">
                  <img src={preview} alt={t('receipts.uploadDialog.previewAlt')} className="w-full max-h-[300px] object-contain" />
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Link to expense */}
          <div className="space-y-2">
            <Label className="text-sm">{t('receipts.uploadDialog.linkToExpense')}</Label>
            <Select value={selectedExpenseId} onValueChange={setSelectedExpenseId}>
              <SelectTrigger>
                <SelectValue placeholder={t('receipts.uploadDialog.skipLink')} />
              </SelectTrigger>
              <SelectContent>
                {expenseList.map((expense: Expense) => (
                  <SelectItem key={expense.id} value={expense.id}>
                    {expense.description} — {formatCurrency(expense.amount, i18n.language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              {t('cancel')}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending || isCompressing}
              className="flex-1"
            >
              {uploadMutation.isPending ? t('receipts.uploadDialog.uploading') : t('receipts.uploadDialog.upload')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
