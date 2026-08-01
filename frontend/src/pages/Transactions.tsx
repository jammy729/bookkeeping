import {
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ReceiptPreview } from "../components/ReceiptPreview";
import { CsvImportDialog } from "../components/CsvImportDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { EmptyState } from "../components/ui/EmptyState";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "../components/ui/alert-dialog";
import { FormField } from "../components/ui/FormField";
import { CurrencyInput } from "../components/ui/CurrencyInput";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useExpenseCategories } from "../hooks/useCategories";
import { useClients } from "../hooks/useClients";
import { useExpenseMutations, useExpenses } from "../hooks/useExpenses";
import { useIncome, useIncomeMutations } from "../hooks/useIncome";
import {
  useDeleteReceipt,
  useExpenseAttachments,
  useUploadReceipt,
} from "../hooks/useReceipts";
import i18n from "../i18n";
import { expenseSchema, incomeSchema, type ExpenseFormData, type IncomeFormData } from "../lib/form-schemas";
import { formatCurrency, formatDate } from "../lib/utils";
import { type Category } from "../services/categories.service";
import { type Client } from "../services/clients.service";
import {
  type Expense,
  type PaginatedResponse,
} from "../services/expenses.service";
import {
  type Income as IncomeType,
} from "../services/income.service";

const ITEMS_PER_PAGE = 25;

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category?: { name: string } | null;
  categoryName?: string;
  notes?: string | null;
  isRecurring?: boolean;
  isPaid?: boolean;
  includesHst?: boolean;
  hstAmount?: number | null;
  clientName?: string | null;
  categoryId?: string | null;
  attachments?: { id: string; originalName: string; mimeType: string; size: number }[];
}

export function Transactions() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("type") || "all";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  // Form state
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<"expense" | "income">("expense");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "expense" | "income" } | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<"expense" | "income">("expense");

  // Data fetching
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses({
    startDate,
    endDate,
  });
  const { data: incomes = [], isLoading: loadingIncome } = useIncome({
    startDate,
    endDate,
  });
  const { data: categories = [] } = useExpenseCategories();
  const { data: clients = [] } = useClients(true);
  const { remove: removeExpense, generateRecurring } = useExpenseMutations();
  const { remove: removeIncome } = useIncomeMutations();

  const loading = loadingExpenses || loadingIncome;

  // Auto-generate recurring expenses on mount
  useEffect(() => {
    generateRecurring.mutate(undefined, {
      onSuccess: (result) => {
        if (result && result.created > 0) {
          toast.success(t("transactions.toast.recurringGenerated", { count: result.created }));
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cmd+/ to focus search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[placeholder="' + t("transactions.searchPlaceholder") + '"]')?.focus();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [t]);

  // Merge and transform data
  const transactions: Transaction[] = useMemo(() => {
    const expenseList: Expense[] = Array.isArray(expenses) ? expenses : (expenses as PaginatedResponse<Expense>)?.data || [];
    const incomeList: IncomeType[] = Array.isArray(incomes) ? incomes : (incomes as PaginatedResponse<IncomeType>)?.data || [];

    const expenseTransactions: Transaction[] = expenseList.map(
      (e: Expense) => ({
        ...e,
        type: "expense" as const,
        categoryName: e.category?.name,
      }),
    );

    const incomeTransactions: Transaction[] = incomeList.map(
      (i: IncomeType) => ({
        ...i,
        type: "income" as const,
        categoryName: undefined,
      }),
    );

    return [...expenseTransactions, ...incomeTransactions];
  }, [expenses, incomes]);

  // Filter and sort
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // Tab filter
    if (activeTab !== "all") {
      result = result.filter((t) => t.type === activeTab);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.categoryName?.toLowerCase().includes(query) ||
          t.clientName?.toLowerCase().includes(query) ||
          t.notes?.toLowerCase().includes(query),
      );
    }

    // Sort
    result.sort((a, b) => {
      const aVal = sortField === "date" ? new Date(a.date).getTime() : a.amount;
      const bVal = sortField === "date" ? new Date(b.date).getTime() : b.amount;
      return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [transactions, activeTab, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleSort = (field: "date" | "amount") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleDelete = (id: string, type: "expense" | "income") => {
    setDeleteTarget({ id, type });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "expense") {
        await removeExpense.mutateAsync(deleteTarget.id);
      } else {
        await removeIncome.mutateAsync(deleteTarget.id);
      }
      toast.success(t("transactions.toast.deleted"));
      setDeleteTarget(null);
    } catch {
      toast.error(t("transactions.toast.deleteFailed"));
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFormType(transaction.type);
    setIsFormOpen(true);
  };

  const handleAddNew = (type: "expense" | "income") => {
    setSelectedTransaction(null);
    setFormType(type);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedTransaction(null);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    setSearchParams(value === "all" ? {} : { type: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{t("transactions.title")}</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setImportType("expense"); setImportDialogOpen(true); }}
          >
            <Upload className="w-4 h-4 mr-1" />
            {t("import.titleExpenses")}
          </Button>
          <Button size="sm" onClick={() => handleAddNew("expense")}>
            <Plus className="w-4 h-4 mr-1" />
            {t("transactions.addExpense")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddNew("income")}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t("transactions.addIncome")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground">{t("search")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("transactions.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("from")}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("to")}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs + Table */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">{t("transactions.tabs.all")}</TabsTrigger>
          <TabsTrigger value="expense">{t("transactions.tabs.expenses")}</TabsTrigger>
          <TabsTrigger value="income">{t("transactions.tabs.income")}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : paginatedTransactions.length === 0 ? (
                <EmptyState
                  title={t("transactions.noTransactions")}
                  description={
                    searchQuery
                      ? t("transactions.adjustFilters")
                      : t("transactions.noTransactionsDesc")
                  }
                  action={
                    !searchQuery ? (
                      <Button onClick={() => handleAddNew("expense")}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t("transactions.addTransaction")}
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th
                            className="text-left py-3 px-4 font-semibold cursor-pointer hover:text-foreground"
                            onClick={() => handleSort("date")}
                          >
                            {t("transactions.table.date")}{" "}
                            {sortField === "date" &&
                              (sortDirection === "desc" ? "↓" : "↑")}
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            {t("transactions.table.description")}
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            {t("transactions.table.category")}
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            {t("transactions.table.type")}
                          </th>
                          <th
                            className="text-right py-3 px-4 font-semibold cursor-pointer hover:text-foreground"
                            onClick={() => handleSort("amount")}
                          >
                            {t("transactions.table.amount")}{" "}
                            {sortField === "amount" &&
                              (sortDirection === "desc" ? "↓" : "↑")}
                          </th>
                          <th className="text-right py-3 px-4 font-semibold">
                            {t("transactions.table.actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTransactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b hover:bg-accent/50"
                          >
                            <td className="py-3 px-4 text-sm">
                              {formatDate(transaction.date, i18n.language)}
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-sm flex items-center gap-1.5">
                                  {transaction.description}
                                  {transaction.type === "expense" &&
                                    transaction.isRecurring && (
                                      <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                        {t("transactions.recurringBadge")}
                                      </Badge>
                                    )}
                                  {transaction.type === "expense" &&
                                    transaction.attachments &&
                                    transaction.attachments.length >
                                      0 && (
                                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                                    )}
                                </div>
                                {transaction.notes && (
                                  <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                    {transaction.notes}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {transaction.categoryName ? (
                                <Badge variant="secondary" className="text-xs">
                                  {transaction.categoryName}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {t("uncategorized")}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  transaction.type === "income"
                                    ? "default"
                                    : "outline"
                                }
                                className={`text-xs ${
                                  transaction.type === "income"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                                }`}
                              >
                                {transaction.type}
                              </Badge>
                            </td>
                            <td
                              className={`py-3 px-4 text-right font-semibold text-sm ${
                                transaction.type === "income"
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "expense" ? "-" : "+"}
                              {formatCurrency(transaction.amount, i18n.language)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(transaction)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete(
                                      transaction.id,
                                      transaction.type,
                                    )
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {t("transactions.pagination.showing", {
                          from: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                          to: Math.min(
                            currentPage * ITEMS_PER_PAGE,
                            filteredTransactions.length,
                          ),
                          total: filteredTransactions.length,
                        })}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm">
                          {currentPage} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      {isFormOpen && formType === "expense" ? (
        <ExpenseDialog
          expense={selectedTransaction as unknown as Expense}
          categories={categories}
          onClose={handleFormClose}
          onSave={handleFormClose}
        />
      ) : isFormOpen && formType === "income" ? (
        <IncomeDialog
          income={selectedTransaction as unknown as IncomeType}
          clients={clients as Client[]}
          onClose={handleFormClose}
          onSave={handleFormClose}
        />
      ) : null}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.deleteTitle', { entity: 'transaction' })}</AlertDialogTitle>
            <AlertDialogDescription>{t('transactions.confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CsvImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        type={importType}
      />
    </div>
  );
}

// Expense Form Dialog
function ExpenseDialog({
  expense,
  categories,
  onClose,
  onSave,
}: {
  expense: Expense | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  const { create, update } = useExpenseMutations();
  const uploadMutation = useUploadReceipt();
  const deleteMutation = useDeleteReceipt();
  const { data: existingAttachments = [] } = useExpenseAttachments(expense?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: expense?.amount || 0,
      description: expense?.description || "",
      date: expense?.date || new Date().toISOString().split("T")[0],
      categoryId: expense?.categoryId || undefined,
      notes: expense?.notes || "",
      isRecurring: expense?.isRecurring || false,
      recurrenceFrequency: expense?.recurrenceFrequency || undefined,
      nextOccurrence: expense?.nextOccurrence || "",
    },
  });

  const isRecurring = watch("isRecurring");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<{
    id: string;
    name: string;
    mime: string;
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("transactions.toast.invalidFileType"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("transactions.toast.fileTooLarge"));
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      const payload = {
        amount: data.amount,
        description: data.description,
        date: data.date,
        categoryId: data.categoryId || undefined,
        notes: data.notes || undefined,
        isRecurring: data.isRecurring || false,
        recurrenceFrequency: data.isRecurring ? data.recurrenceFrequency : undefined,
        nextOccurrence: data.isRecurring && data.nextOccurrence ? data.nextOccurrence : undefined,
      };

      let savedExpense: Expense;
      if (expense) {
        savedExpense = await update.mutateAsync({
          id: expense.id,
          data: payload,
        });
        toast.success(t("transactions.toast.expenseUpdated"));
      } else {
        savedExpense = await create.mutateAsync(payload);
        toast.success(t("transactions.toast.expenseCreated"));
      }

      if (selectedFile && savedExpense?.id) {
        try {
          await uploadMutation.mutateAsync({
            file: selectedFile,
            entityType: "receipt",
            entityId: savedExpense.id,
          });
        } catch {
          toast.warning(t("transactions.toast.expenseSavedWarning"));
        }
      }

      onSave();
    } catch {
      toast.error(
        expense ? t("transactions.toast.expenseUpdateFailed") : t("transactions.toast.expenseCreateFailed"),
      );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? t("transactions.expenseForm.titleEdit") : t("transactions.expenseForm.titleCreate")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <CurrencyInput
            label={t("transactions.expenseForm.amount")}
            name="amount"
            control={control}
            errors={errors}
            required
          />
          <FormField
            label={t("transactions.expenseForm.description")}
            name="description"
            control={control}
            errors={errors}
            required
          />
          <FormField
            label={t("transactions.expenseForm.date")}
            name="date"
            control={control}
            errors={errors}
            type="date"
            required
          />
          <div>
            <Label>{t("transactions.expenseForm.category")}</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("transactions.expenseForm.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>{t("transactions.expenseForm.notes")}</Label>
            <textarea
              {...register("notes")}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              rows={3}
            />
          </div>

          {/* Recurring Section */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                {...register("isRecurring")}
              />
              <Label htmlFor="isRecurring" className="text-sm font-medium">
                {t("transactions.expenseForm.recurring")}
              </Label>
            </div>
            {isRecurring && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t("transactions.expenseForm.frequency")}</Label>
                  <Controller
                    name="recurrenceFrequency"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("transactions.expenseForm.selectFrequency")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">{t("transactions.recurrence.weekly")}</SelectItem>
                          <SelectItem value="biweekly">{t("transactions.recurrence.biweekly")}</SelectItem>
                          <SelectItem value="monthly">{t("transactions.recurrence.monthly")}</SelectItem>
                          <SelectItem value="quarterly">{t("transactions.recurrence.quarterly")}</SelectItem>
                          <SelectItem value="yearly">{t("transactions.recurrence.yearly")}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label>{t("transactions.expenseForm.nextOccurrence")}</Label>
                  <Input type="date" {...register("nextOccurrence")} />
                </div>
              </div>
            )}
          </div>

          {/* Receipt Section */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                {t("transactions.expenseForm.receipt")}
              </Label>
              {(existingAttachments.length > 0 || selectedFile) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {t("transactions.expenseForm.change")}
                </Button>
              )}
            </div>

            {/* Existing attachment */}
            {!selectedFile && existingAttachments.length > 0 && (
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewReceipt({
                      id: existingAttachments[0].id,
                      name: existingAttachments[0].originalName,
                      mime: existingAttachments[0].mimeType,
                    })
                  }
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate max-w-[180px]">
                    {existingAttachments[0].originalName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(existingAttachments[0].size)}
                  </span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={async () => {
                    try {
                      await deleteMutation.mutateAsync(
                        existingAttachments[0].id,
                      );
                      toast.success(t("transactions.toast.receiptRemoved"));
                    } catch {
                      toast.error(t("transactions.toast.receiptRemoveFailed"));
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* New file selected */}
            {selectedFile && (
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-8 w-8 object-cover rounded"
                    />
                  ) : (
                    <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm truncate max-w-[180px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Upload button when no file */}
            {!selectedFile && existingAttachments.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed rounded-lg p-3 text-center hover:bg-accent/50 transition-colors"
              >
                <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {t("transactions.expenseForm.receiptOptional")}
                </p>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.heic,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="flex-1"
            >
              {create.isPending || update.isPending
                ? t("saving")
                : expense
                  ? t("update")
                  : t("create")}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Receipt Preview */}
      {previewReceipt && (
        <ReceiptPreview
          open={!!previewReceipt}
          onClose={() => setPreviewReceipt(null)}
          receiptId={previewReceipt.id}
          fileName={previewReceipt.name}
          mimeType={previewReceipt.mime}
        />
      )}
    </Dialog>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

// Income Form Dialog
function IncomeDialog({
  income,
  clients,
  onClose,
  onSave,
}: {
  income: IncomeType | null;
  clients: Client[];
  onClose: () => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  const { create, update } = useIncomeMutations();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: income?.amount || 0,
      description: income?.description || "",
      type: income?.type || "contractor_payment",
      date: income?.date || new Date().toISOString().split("T")[0],
      clientName: income?.clientName || "",
      invoiceNumber: income?.invoiceNumber || "",
      isPaid: income?.isPaid ?? false,
      paidDate: income?.paidDate || "",
      notes: income?.notes || "",
      hstAmount: income?.hstAmount || 0,
      includesHst: income?.includesHst ?? false,
    },
  });

  const includesHst = watch("includesHst");
  const amount = watch("amount");

  const handleHstToggle = (checked: boolean) => {
    setValue("includesHst", checked, { shouldValidate: true });
    if (checked) {
      const baseAmount = amount / 1.13;
      const hst = amount - baseAmount;
      setValue("hstAmount", Math.round(hst * 100) / 100, { shouldValidate: true });
    } else {
      setValue("hstAmount", 0, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: IncomeFormData) => {
    try {
      if (income) {
        await update.mutateAsync({ id: income.id, data });
        toast.success(t("transactions.toast.incomeUpdated"));
      } else {
        await create.mutateAsync(data);
        toast.success(t("transactions.toast.incomeCreated"));
      }
      onSave();
    } catch {
      toast.error(
        income ? t("transactions.toast.incomeUpdateFailed") : t("transactions.toast.incomeCreateFailed"),
      );
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{income ? t("transactions.incomeForm.titleEdit") : t("transactions.incomeForm.titleCreate")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <CurrencyInput
            label={t("transactions.incomeForm.amount")}
            name="amount"
            control={control}
            errors={errors}
            required
          />
          <FormField
            label={t("transactions.incomeForm.description")}
            name="description"
            control={control}
            errors={errors}
            required
            placeholder={t("transactions.incomeForm.descriptionPlaceholder")}
          />
          <FormField
            label={t("transactions.incomeForm.date")}
            name="date"
            control={control}
            errors={errors}
            type="date"
            required
          />
          <div>
            <Label>{t("transactions.incomeForm.type")}</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contractor_payment">{t("transactions.incomeTypes.contractorPayment")}</SelectItem>
                    <SelectItem value="freelance">{t("transactions.incomeTypes.freelance")}</SelectItem>
                    <SelectItem value="consulting">{t("transactions.incomeTypes.consulting")}</SelectItem>
                    <SelectItem value="other">{t("transactions.incomeTypes.other")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
            )}
          </div>
          <div>
            <Label>{t("transactions.incomeForm.clientName")}</Label>
            <Controller
              name="clientName"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("transactions.incomeForm.selectClient")} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.name}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <FormField
            label={t("transactions.incomeForm.invoiceNumber")}
            name="invoiceNumber"
            control={control}
            errors={errors}
            placeholder={t("transactions.incomeForm.invoicePlaceholder")}
          />
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="includesHst"
                checked={includesHst}
                onChange={(e) => handleHstToggle(e.target.checked)}
              />
              <Label htmlFor="includesHst" className="text-sm font-medium">
                {t("transactions.incomeForm.includesHst")}
              </Label>
            </div>
            {includesHst && (
              <CurrencyInput
                label={t("transactions.incomeForm.hstAmount")}
                name="hstAmount"
                control={control}
                errors={errors}
                placeholder={t("transactions.incomeForm.autoCalculated")}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPaid"
              {...register("isPaid")}
            />
            <Label htmlFor="isPaid" className="text-sm">
              {t("transactions.incomeForm.markAsPaid")}
            </Label>
          </div>
          <div>
            <Label>{t("transactions.incomeForm.notes")}</Label>
            <textarea
              {...register("notes")}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="flex-1"
            >
              {create.isPending || update.isPending
                ? t("saving")
                : income
                  ? t("update")
                  : t("create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
