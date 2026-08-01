import { useQuery } from "@tanstack/react-query";
import { ArrowRight, TrendingUp, TrendingDown, DollarSign, Receipt, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CashFlowChart } from "../components/dashboard/CashFlowChart";
import { CategoryBarChart } from "../components/dashboard/CategoryBarChart";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useBusiness } from "../context/business-context";
import { useAuth } from "../context/useAuth";
import { useMonthlySummary, useActionItems } from "../hooks/useReports";
import { api } from "../lib/api";
import { formatCurrency, formatDate, hslVar } from "../lib/utils";
import { useTranslation } from "react-i18next";
import type { Expense, PaginatedResponse } from "../services/expenses.service";
import type { Income } from "../services/income.service";
import i18n from "../i18n";

interface RecentTransaction {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  date: string;
  category?: string | null;
  clientName?: string | null;
}

type DatePreset = "this_month" | "last_month" | "this_quarter" | "ytd" | "custom";

const NOW = new Date();
const Y = NOW.getFullYear();
const M = NOW.getMonth();

function getDateRange(preset: DatePreset): { startDate: string; endDate: string } {
  switch (preset) {
    case "this_month":
      return {
        startDate: `${Y}-${String(M + 1).padStart(2, "0")}-01`,
        endDate: new Date(Y, M + 1, 0).toISOString().split("T")[0],
      };
    case "last_month":
      return {
        startDate: new Date(Y, M - 1, 1).toISOString().split("T")[0],
        endDate: new Date(Y, M, 0).toISOString().split("T")[0],
      };
    case "this_quarter": {
      const qs = Math.floor(M / 3) * 3;
      return {
        startDate: new Date(Y, qs, 1).toISOString().split("T")[0],
        endDate: new Date(Y, qs + 3, 0).toISOString().split("T")[0],
      };
    }
    case "ytd":
      return {
        startDate: `${Y}-01-01`,
        endDate: NOW.toISOString().split("T")[0],
      };
    default:
      return {
        startDate: `${Y}-${String(M + 1).padStart(2, "0")}-01`,
        endDate: NOW.toISOString().split("T")[0],
      };
  }
}

function getPreviousPeriod(startDate: string, endDate: string): { startDate: string; endDate: string } {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  const prevEnd = new Date(s.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - days * 86400000 + 86400000);
  return {
    startDate: prevStart.toISOString().split("T")[0],
    endDate: prevEnd.toISOString().split("T")[0],
  };
}

export function Dashboard() {
  const { user } = useAuth();
  const { profile } = useBusiness();
  const { t } = useTranslation();
  const [activePreset, setActivePreset] = useState<DatePreset>("this_month");
  const { startDate, endDate } = getDateRange(activePreset);

  const { data: summary, isLoading } = useMonthlySummary(startDate, endDate);
  const { data: actionItems } = useActionItems();

  // Previous period for comparison
  const prev = getPreviousPeriod(startDate, endDate);
  const { data: prevSummary } = useMonthlySummary(prev.startDate, prev.endDate);

  // Recent transactions
  const { data: recentTransactions = [] } = useQuery<RecentTransaction[]>({
    queryKey: ["dashboard", "recent-transactions"],
    queryFn: async () => {
      const [expensesRes, incomeRes] = await Promise.all([
        api.get("/expenses?limit=5"),
        api.get("/income?limit=5"),
      ]);
      const es = Array.isArray(expensesRes.data) ? expensesRes.data : (expensesRes.data as PaginatedResponse<Expense>)?.data || [];
      const is = Array.isArray(incomeRes.data) ? incomeRes.data : (incomeRes.data as PaginatedResponse<Income>)?.data || [];

      const transactions: RecentTransaction[] = [
        ...es.map((e: Expense) => ({
          id: e.id,
          type: "expense" as const,
          description: e.description,
          amount: e.amount,
          date: e.date,
          category: e.category?.name,
        })),
        ...is.map((i: Income) => ({
          id: i.id,
          type: "income" as const,
          description: i.description,
          amount: i.amount,
          date: i.date,
          clientName: i.clientName,
        })),
      ];

      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return transactions.slice(0, 8);
    },
  });

  const totals = summary?.totals;
  const prevTotals = prevSummary?.totals;
  const netIncome = totals ? totals.totalIncome - totals.totalExpenses : 0;
  const prevNetIncome = prevTotals ? prevTotals.totalIncome - prevTotals.totalExpenses : 0;
  const delta = prevNetIncome !== 0 ? ((netIncome - prevNetIncome) / Math.abs(prevNetIncome)) * 100 : 0;

  const presets: { value: DatePreset; label: string }[] = [
    { value: "this_month", label: t("dashboard.datePresets.thisMonth") },
    { value: "last_month", label: t("dashboard.datePresets.lastMonth") },
    { value: "this_quarter", label: t("dashboard.datePresets.thisQuarter") },
    { value: "ytd", label: t("dashboard.datePresets.ytd") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {t("dashboard.greeting", { name: user?.firstName })}
          </h1>
          <p className="text-muted-foreground text-sm">
            {profile.businessName ? `${profile.businessName} — ` : ""}
            {t("dashboard.overview", {
              period: NOW.toLocaleDateString("en-CA", { month: "long", year: "numeric" }),
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.value}
              variant={activePreset === preset.value ? "default" : "outline"}
              size="sm"
              onClick={() => setActivePreset(preset.value)}
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-8">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-12 w-48 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Hero Section — Net Income */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-gradient-to-br from-card to-muted/30 border-financial-positive/20">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {t("dashboard.netProfit")}
                    </p>
                    <p className="text-4xl font-bold tracking-tight" style={{ color: hslVar("--financial-positive") }}>
                      {formatCurrency(netIncome, i18n.language)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${delta >= 0 ? "text-financial-positive" : "text-financial-negative"}`}>
                        {delta >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground">{t("dashboard.vsPreviousPeriod")}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-financial-positive/10">
                    <TrendingUp className="h-6 w-6" style={{ color: hslVar("--financial-positive") }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-financial-warning" />
                  {t("dashboard.needsAttention")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("dashboard.uncategorized")}</span>
                    <span className="text-sm font-semibold">{actionItems?.uncategorizedCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("dashboard.budgetAlerts")}</span>
                    <span className="text-sm font-semibold">{actionItems?.budgetAlerts || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("dashboard.pendingReceipts")}</span>
                    <span className="text-sm font-semibold">{actionItems?.pendingReceipts || 0}</span>
                  </div>
                </div>
                {(actionItems && (actionItems.uncategorizedCount > 0 || actionItems.budgetAlerts > 0 || actionItems.pendingReceipts > 0)) && (
                  <Link to="/transactions">
                    <Button variant="link" size="sm" className="mt-3 h-auto p-0 text-xs">
                      {t("dashboard.viewAll")} <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Supporting stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("dashboard.revenue")}</p>
                    <p className="text-xl font-bold mt-1" style={{ color: hslVar("--financial-positive") }}>
                      {formatCurrency(totals?.totalIncome || 0, i18n.language)}
                    </p>
                    {prevTotals && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {prevTotals.totalIncome <= (totals?.totalIncome || 0) ? "+" : ""}
                        {prevTotals.totalIncome > 0 ? ((((totals?.totalIncome || 0) - prevTotals.totalIncome) / prevTotals.totalIncome) * 100).toFixed(1) : "0"}%
                        {" "}{t("dashboard.vsPrev")}
                      </p>
                    )}
                  </div>
                  <div className="p-2.5 rounded-full bg-financial-positive/10">
                    <DollarSign className="h-5 w-5" style={{ color: hslVar("--financial-positive") }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("dashboard.expenses")}</p>
                    <p className="text-xl font-bold mt-1" style={{ color: hslVar("--financial-negative") }}>
                      {formatCurrency(totals?.totalExpenses || 0, i18n.language)}
                    </p>
                    {prevTotals && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {prevTotals.totalExpenses <= (totals?.totalExpenses || 0) ? "+" : "-"}
                        {prevTotals.totalExpenses > 0 ? ((((totals?.totalExpenses || 0) - prevTotals.totalExpenses) / prevTotals.totalExpenses) * 100).toFixed(1) : "0"}%
                        {" "}{t("dashboard.vsPrev")}
                      </p>
                    )}
                  </div>
                  <div className="p-2.5 rounded-full bg-financial-negative/10">
                    <Receipt className="h-5 w-5" style={{ color: hslVar("--financial-negative") }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("dashboard.profitMargin")}</p>
                    <p className={`text-xl font-bold mt-1 ${totals && totals.totalIncome > 0 && netIncome / totals.totalIncome >= 0 ? "text-financial-positive" : "text-financial-negative"}`}>
                      {totals && totals.totalIncome > 0 ? `${((netIncome / totals.totalIncome) * 100).toFixed(1)}%` : "0%"}
                    </p>
                    {totals?.ownerDistributions ? (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("dashboard.ownerDistributions")}: {formatCurrency(totals.ownerDistributions, i18n.language)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">&nbsp;</p>
                    )}
                  </div>
                  <div className="p-2.5 rounded-full bg-financial-audit/10">
                    <TrendingUp className="h-5 w-5" style={{ color: hslVar("--financial-audit") }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.cashFlow")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={summary?.monthlyData || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.spendingByCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBarChart data={(summary?.categoryBreakdown || []).filter((c) => c.name !== "Owner Distribution")} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{t("dashboard.recentTransactions")}</CardTitle>
            <Link to="/transactions">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                {t("dashboard.viewAll")} <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t("dashboard.noTransactions")}</div>
          ) : (
            <div className="space-y-1">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${tx.type === "income" ? "bg-financial-positive" : "bg-financial-negative"}`}
                    />
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.date, i18n.language)}
                        {tx.category && ` · ${tx.category}`}
                        {tx.clientName && ` · ${tx.clientName}`}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${tx.type === "income" ? "text-financial-positive" : "text-financial-negative"}`}>
                    {tx.type === "expense" ? "-" : "+"}{formatCurrency(tx.amount, i18n.language)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
