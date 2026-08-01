import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { useReceiptUrl } from '../hooks/useReceipts';
import { Download, ExternalLink } from 'lucide-react';

interface ReceiptPreviewProps {
  open: boolean;
  onClose: () => void;
  receiptId: string | null;
  fileName: string;
  mimeType: string;
}

export function ReceiptPreview({ open, onClose, receiptId, fileName, mimeType }: ReceiptPreviewProps) {
  const { t } = useTranslation();
  const { data: url, isLoading } = useReceiptUrl(receiptId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="truncate max-w-[300px]">{fileName}</DialogTitle>
          {url && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {t('receipts.preview.open')}
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={url} download={fileName}>
                  <Download className="h-4 w-4 mr-1" />
                  {t('receipts.preview.download')}
                </a>
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-[300px] flex items-center justify-center">
          {isLoading ? (
            <Skeleton className="w-full h-[400px]" />
          ) : !url ? (
            <p className="text-muted-foreground">{t('receipts.preview.loadFailed')}</p>
          ) : mimeType.startsWith('image/') ? (
            <img src={url} alt={fileName} className="max-w-full max-h-[60vh] object-contain rounded" />
          ) : mimeType === 'application/pdf' ? (
            <iframe src={url} className="w-full h-[60vh] rounded border" title={fileName} />
          ) : (
            <p className="text-muted-foreground">{t('receipts.preview.notAvailable')}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
