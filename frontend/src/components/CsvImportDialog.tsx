import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { expensesService, type CreateExpenseDto } from '../services/expenses.service';
import { incomeService, type CreateIncomeDto } from '../services/income.service';

type ImportType = 'expense' | 'income';

interface CsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  type: ImportType;
}

interface ParsedRow {
  [key: string]: string;
}

interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
}

interface ImportResult {
  imported: number;
  errors: string[];
}

export function CsvImportDialog({ open, onClose, type }: CsvImportDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: '', description: '', amount: '' });
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setParsedRows([]);
    setHeaders([]);
    setMapping({ date: '', description: '', amount: '' });
    setResult(null);
    setImporting(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error(t('import.toast.invalidFileType'));
      return;
    }

    setFile(selectedFile);
    setResult(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as ParsedRow[];
        if (data.length === 0) {
          toast.error(t('import.toast.emptyFile'));
          setFile(null);
          return;
        }

        setParsedRows(data);
        setHeaders(results.meta.fields || []);

        // Auto-detect column mapping
        const fields = (results.meta.fields || []).map((f) => f.toLowerCase());
        const autoMapping: ColumnMapping = { date: '', description: '', amount: '' };

        // Date detection
        const dateIdx = fields.findIndex((f) => f.includes('date'));
        if (dateIdx >= 0) autoMapping.date = results.meta.fields![dateIdx];

        // Description detection
        const descIdx = fields.findIndex((f) => f.includes('description') || f.includes('memo') || f.includes('name') || f.includes('payee'));
        if (descIdx >= 0) autoMapping.description = results.meta.fields![descIdx];

        // Amount detection
        const amtIdx = fields.findIndex((f) => f.includes('amount') || f.includes('sum') || f.includes('total'));
        if (amtIdx >= 0) autoMapping.amount = results.meta.fields![amtIdx];

        setMapping(autoMapping);
      },
      error: () => {
        toast.error(t('import.toast.parseError'));
        setFile(null);
      },
    });
  };

  const handleImport = async () => {
    if (!mapping.date || !mapping.description || !mapping.amount) {
      toast.error(t('import.toast.mappingRequired'));
      return;
    }

    setImporting(true);
    try {
      if (type === 'expense') {
        const rows: CreateExpenseDto[] = parsedRows
          .filter((row) => row[mapping.amount] && parseFloat(row[mapping.amount].replace(/[$,]/g, '')))
          .map((row) => ({
            date: normalizeDate(row[mapping.date]),
            description: row[mapping.description] || 'Imported transaction',
            amount: Math.abs(parseFloat(row[mapping.amount].replace(/[$,]/g, ''))),
          }));

        const importResult = await expensesService.bulkImport(rows);
        setResult(importResult);
        if (importResult.errors.length === 0) {
          toast.success(t('import.toast.success', { count: importResult.imported }));
        } else {
          toast.warning(t('import.toast.partialSuccess', { imported: importResult.imported, failed: importResult.errors.length }));
        }
      } else {
        const rows: CreateIncomeDto[] = parsedRows
          .filter((row) => row[mapping.amount] && parseFloat(row[mapping.amount].replace(/[$,]/g, '')))
          .map((row) => ({
            date: normalizeDate(row[mapping.date]),
            description: row[mapping.description] || 'Imported transaction',
            amount: Math.abs(parseFloat(row[mapping.amount].replace(/[$,]/g, ''))),
            type: 'other' as const,
          }));

        const importResult = await incomeService.bulkImport(rows);
        setResult(importResult);
        if (importResult.errors.length === 0) {
          toast.success(t('import.toast.success', { count: importResult.imported }));
        } else {
          toast.warning(t('import.toast.partialSuccess', { imported: importResult.imported, failed: importResult.errors.length }));
        }
      }
    } catch {
      toast.error(t('import.toast.importFailed'));
    } finally {
      setImporting(false);
    }
  };

  const mappingComplete = mapping.date && mapping.description && mapping.amount;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === 'expense' ? t('import.titleExpenses') : t('import.titleIncome')}
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            {/* File upload */}
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-primary" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {parsedRows.length} {t('import.rowsDetected')}
                  </p>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); reset(); }}>
                    <X className="h-3 w-3 mr-1" /> {t('import.changeFile')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">{t('import.dropOrClick')}</p>
                  <p className="text-xs text-muted-foreground">{t('import.csvOnly')}</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Column mapping */}
            {parsedRows.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('import.mapColumns')}</Label>

                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('import.dateColumn')} *</Label>
                    <Select value={mapping.date} onValueChange={(v) => setMapping({ ...mapping, date: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('import.selectColumn')} />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">{t('import.descriptionColumn')} *</Label>
                    <Select value={mapping.description} onValueChange={(v) => setMapping({ ...mapping, description: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('import.selectColumn')} />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">{t('import.amountColumn')} *</Label>
                    <Select value={mapping.amount} onValueChange={(v) => setMapping({ ...mapping, amount: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('import.selectColumn')} />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview */}
                {mappingComplete && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2 text-xs font-medium">{t('import.preview')}</div>
                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left px-3 py-1.5">{t('import.dateColumn')}</th>
                            <th className="text-left px-3 py-1.5">{t('import.descriptionColumn')}</th>
                            <th className="text-right px-3 py-1.5">{t('import.amountColumn')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRows.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="px-3 py-1.5">{row[mapping.date]}</td>
                              <td className="px-3 py-1.5 truncate max-w-[200px]">{row[mapping.description]}</td>
                              <td className="px-3 py-1.5 text-right">{row[mapping.amount]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedRows.length > 5 && (
                      <div className="px-3 py-1.5 text-xs text-muted-foreground text-center border-t">
                        {t('import.andMore', { count: parsedRows.length - 5 })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Result */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium">{t('import.result.success', { count: result.imported })}</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  {t('import.result.errors', { count: result.errors.length })}
                </div>
                <div className="max-h-32 overflow-y-auto border rounded-lg p-2 text-xs text-muted-foreground space-y-1">
                  {result.errors.map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? t('import.close') : t('cancel')}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={!mappingComplete || importing || parsedRows.length === 0}>
              {importing ? t('import.importing') : t('import.import', { count: parsedRows.length })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // MM/DD/YYYY or M/D/YYYY
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // DD/MM/YYYY
  const slashMatch2 = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch2) {
    const [, d, m, y] = slashMatch2;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Try Date parse as fallback
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}
