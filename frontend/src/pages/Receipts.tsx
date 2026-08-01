import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useReceipts, useDeleteReceipt, useLinkReceipt, useUnlinkReceipt } from '../hooks/useReceipts';
import { type Attachment } from '../services/uploads.service';
import { useExpenses } from '../hooks/useExpenses';
import { useAllCategories } from '../hooks/useCategories';
import i18n from '../i18n';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Expense, PaginatedResponse } from '../services/expenses.service';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Label } from '../components/ui/label';
import { EmptyState } from '../components/ui/EmptyState';
import { ReceiptUploadDialog } from '../components/ReceiptUploadDialog';
import { ReceiptPreview } from '../components/ReceiptPreview';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, AlertCircle, Link2, Unlink, Trash2, Eye, Search, Image, File } from 'lucide-react';

export function Receipts() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<Attachment | null>(null);
  const [linkTarget, setLinkTarget] = useState<Attachment | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fileType, setFileType] = useState<'all' | 'image' | 'pdf'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: receipts = [], isLoading } = useReceipts();
  const deleteMutation = useDeleteReceipt();
  const linkMutation = useLinkReceipt();
  const unlinkMutation = useUnlinkReceipt();
  const { data: expenses = [] } = useExpenses();
  const expenseList = useMemo(() => {
    const raw: Expense[] | PaginatedResponse<Expense> | undefined = expenses;
    return Array.isArray(raw) ? raw : raw?.data || [];
  }, [expenses]);
  const { data: categories = [] } = useAllCategories();

  const expenseCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of expenseList) {
      if (e.categoryId) map.set(e.id, e.categoryId);
    }
    return map;
  }, [expenseList]);

  // Linked = has entityId set, Unlinked = entityId is null
  const isLinked = (r: Attachment) => !!r.entityId;

  const filteredReceipts = useMemo(() => {
    let result = receipts;

    // Tab filter
    if (activeTab === 'linked') {
      result = result.filter(isLinked);
    } else if (activeTab === 'unlinked') {
      result = result.filter((r) => !isLinked(r));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => r.originalName.toLowerCase().includes(query));
    }

    // Date range filter
    if (startDate) {
      result = result.filter((r) => new Date(r.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((r) => new Date(r.createdAt) <= end);
    }

    // File type filter
    if (fileType === 'image') {
      result = result.filter((r) => r.mimeType.startsWith('image/'));
    } else if (fileType === 'pdf') {
      result = result.filter((r) => r.mimeType === 'application/pdf');
    }

    // Category filter (only applies to linked receipts)
    if (categoryFilter !== 'all') {
      result = result.filter((r) => {
        if (!r.entityId) return false;
        return expenseCategoryMap.get(r.entityId) === categoryFilter;
      });
    }

    return result;
  }, [receipts, activeTab, searchQuery, startDate, endDate, fileType, categoryFilter, expenseCategoryMap]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t('receipts.toast.deleted'));
    } catch {
      toast.error(t('receipts.toast.deleteFailed'));
    }
  };

  const handleLink = async () => {
    if (!linkTarget || !selectedExpenseId) return;
    try {
      await linkMutation.mutateAsync({
        id: linkTarget.id,
        entityType: 'expense',
        entityId: selectedExpenseId,
      });
      toast.success(t('receipts.toast.linked'));
      setLinkTarget(null);
      setSelectedExpenseId('');
    } catch {
      toast.error(t('receipts.toast.linkFailed'));
    }
  };

  const handleUnlink = async () => {
    if (!linkTarget) return;
    try {
      await unlinkMutation.mutateAsync(linkTarget.id);
      toast.success(t('receipts.toast.unlinked'));
      setLinkTarget(null);
    } catch {
      toast.error(t('receipts.toast.unlinkFailed'));
    }
  };

  const getExpenseLabel = (expenseId: string) => {
    const expense = expenseList.find((e: Expense) => e.id === expenseId);
    if (!expense) return t('receipts.unknownExpense');
    return `${expense.description} — ${formatCurrency(expense.amount, i18n.language)}`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-muted-foreground" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const hasActiveFilters = searchQuery || startDate || endDate || fileType !== 'all' || categoryFilter !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('receipts.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('receipts.description')}</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          {t('receipts.uploadReceipt')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('receipts.stats.total')}</p>
                <p className="text-lg font-bold">{receipts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('receipts.stats.linked')}</p>
                <p className="text-lg font-bold">{receipts.filter(isLinked).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('receipts.stats.awaitingReview')}</p>
                <p className="text-lg font-bold">{receipts.filter((r) => !isLinked(r)).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground">{t('receipts.filters.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('receipts.filters.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('from')}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('to')}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('receipts.filters.fileType')}</Label>
              <Select value={fileType} onValueChange={(v) => setFileType(v as typeof fileType)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('receipts.filters.allTypes')}</SelectItem>
                  <SelectItem value="image">{t('receipts.filters.images')}</SelectItem>
                  <SelectItem value="pdf">{t('receipts.filters.pdfs')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('receipts.filters.category')}</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('receipts.filters.allCategories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearchQuery(''); setStartDate(''); setEndDate(''); setFileType('all'); setCategoryFilter('all'); }}
              >
                {t('clearFilters')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs + List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t('receipts.tabs.all')}</TabsTrigger>
          <TabsTrigger value="linked">{t('receipts.tabs.linked')}</TabsTrigger>
          <TabsTrigger value="unlinked">{t('receipts.tabs.awaitingReview')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredReceipts.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-12 w-12" />}
                  title={hasActiveFilters ? t('receipts.emptyState.noMatch') : t('receipts.emptyState.noReceipts')}
                  description={hasActiveFilters ? t('receipts.emptyState.noMatchDesc') : activeTab === 'unlinked' ? t('receipts.emptyState.allLinked') : t('receipts.emptyState.addFirst')}
                  action={
                    !hasActiveFilters && activeTab !== 'unlinked' ? (
                      <Button onClick={() => setIsUploadOpen(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        {t('receipts.uploadReceipt')}
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="space-y-2">
                  {filteredReceipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex items-center justify-between py-3 px-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getFileIcon(receipt.mimeType)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{receipt.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(receipt.createdAt, i18n.language)} · {formatFileSize(receipt.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLinked(receipt) && receipt.entityId && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {getExpenseLabel(receipt.entityId)}
                          </span>
                        )}
                        {isLinked(receipt) ? (
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t('receipts.badge.linked')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {t('receipts.badge.review')}
                          </Badge>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setPreviewReceipt(receipt)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!isLinked(receipt) ? (
                          <Button variant="ghost" size="icon" onClick={() => setLinkTarget(receipt)}>
                            <Link2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => setLinkTarget(receipt)}>
                            <Unlink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(receipt.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <ReceiptUploadDialog open={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      {/* Preview Dialog */}
      {previewReceipt && (
        <ReceiptPreview
          open={!!previewReceipt}
          onClose={() => setPreviewReceipt(null)}
          receiptId={previewReceipt.id}
          fileName={previewReceipt.originalName}
          mimeType={previewReceipt.mimeType}
        />
      )}

      {/* Link/Unlink Dialog */}
      {linkTarget && (
        <Dialog open onOpenChange={(v) => { if (!v) { setLinkTarget(null); setSelectedExpenseId(''); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isLinked(linkTarget) ? t('receipts.unlinkDialog.title') : t('receipts.linkDialog.title')}
              </DialogTitle>
            </DialogHeader>

            {isLinked(linkTarget) ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('receipts.unlinkDialog.description')}
                </p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setLinkTarget(null)}>{t('cancel')}</Button>
                  <Button onClick={handleUnlink} variant="destructive" disabled={linkMutation.isPending}>
                    {linkMutation.isPending ? t('receipts.unlinkDialog.unlinking') : t('receipts.unlinkDialog.confirm')}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('receipts.linkDialog.selectExpense')}</Label>
                  <Select value={selectedExpenseId} onValueChange={setSelectedExpenseId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('receipts.linkDialog.chooseExpense')} />
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
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setLinkTarget(null); setSelectedExpenseId(''); }}>{t('cancel')}</Button>
                  <Button onClick={handleLink} disabled={!selectedExpenseId || linkMutation.isPending}>
                    {linkMutation.isPending ? t('receipts.linkDialog.linking') : t('receipts.linkDialog.confirm')}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
