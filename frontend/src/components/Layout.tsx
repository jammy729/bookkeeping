import {
  ArrowLeftRight,
  BarChart3,
  Calculator,
  ChevronRight,
  Command,
  FileText,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Receipt,
  Settings,
  Sun,
  Tag,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useBusiness } from "../context/business-context";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../hooks/useTheme";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "./ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Separator } from "./ui/separator";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { cn } from "../lib/utils";
import { useTranslation } from "react-i18next";
import { getLoginUrl } from "../lib/routes";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
}

const navItems: NavItem[] = [
  { path: "/", label: "nav.items.dashboard", icon: LayoutDashboard, group: "nav.groups.main" },
  { path: "/transactions", label: "nav.items.transactions", icon: ArrowLeftRight, group: "nav.groups.main" },
  { path: "/receipts", label: "nav.items.receipts", icon: Receipt, group: "nav.groups.main" },
  { path: "/clients", label: "nav.items.clients", icon: Users, group: "nav.groups.manage" },
  { path: "/categories", label: "nav.items.categories", icon: Tag, group: "nav.groups.manage" },
  { path: "/invoices", label: "nav.items.invoices", icon: FileText, group: "nav.groups.manage" },
  { path: "/budgets", label: "nav.items.budgets", icon: BarChart3, group: "nav.groups.manage" },
  { path: "/reports", label: "nav.items.reports", icon: Calculator, group: "nav.groups.insights" },
  { path: "/tax-summary", label: "nav.items.taxSummary", icon: Calculator, group: "nav.groups.insights" },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "nav.items.dashboard",
  "/transactions": "nav.items.transactions",
  "/receipts": "nav.items.receipts",
  "/clients": "nav.items.clients",
  "/categories": "nav.items.categories",
  "/invoices": "nav.items.invoices",
  "/budgets": "nav.items.budgets",
  "/reports": "nav.items.reports",
  "/tax-summary": "nav.items.taxSummary",
  "/settings": "nav.items.settings",
};

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { setTheme, resolvedTheme } = useTheme();
  const { profile } = useBusiness();
  const { t } = useTranslation();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    // Login lives on the apex zone — a full page load clears admin-zone state.
    window.location.href = getLoginUrl();
  };

  const userInitial =
    user?.firstName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    "U";

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+K — Command palette
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((open) => !open);
      }
      // Cmd+N — New transaction
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        navigate("/transactions");
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [navigate]);

  const mainItems = navItems.filter((i) => i.group === "nav.groups.main");
  const manageItems = navItems.filter((i) => i.group === "nav.groups.manage");
  const insightsItems = navItems.filter((i) => i.group === "nav.groups.insights");

  const isActiveItem = (path: string) => {
    if (path === "/transactions") {
      return (
        location.pathname === "/transactions" ||
        location.pathname === "/expenses" ||
        location.pathname === "/income"
      );
    }
    return isActive(path);
  };

  const sidebarWidth = collapsed ? "w-16" : "w-64";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <aside className={cn("border-r bg-sidebar text-sidebar-foreground flex flex-col h-full shrink-0 transition-all duration-200", sidebarWidth)}>
          {/* Logo + collapse toggle */}
          <div className="flex items-center justify-between p-4 shrink-0">
            {!collapsed && (
              <div className="flex items-center gap-2.5 min-w-0">
                <Logo className="h-8 w-8 shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-base font-bold tracking-tight truncate">Bookkeeping</h1>
                  {profile.businessName && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {profile.businessName}
                    </p>
                  )}
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7 shrink-0", collapsed && "mx-auto")}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-4 overflow-y-auto overflow-x-hidden">
            <NavGroup items={mainItems} label="nav.groups.main" isActiveItem={isActiveItem} collapsed={collapsed} t={t} />
            <Separator className="bg-sidebar-border" />
            <NavGroup items={manageItems} label="nav.groups.manage" isActiveItem={isActiveItem} collapsed={collapsed} t={t} />
            <Separator className="bg-sidebar-border" />
            <NavGroup items={insightsItems} label="nav.groups.insights" isActiveItem={isActiveItem} collapsed={collapsed} t={t} />
          </nav>

          {/* Bottom */}
          <div className="border-t border-sidebar-border p-2 space-y-1 shrink-0">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/settings"
                    className={`flex items-center justify-center w-full p-2 text-sm rounded-md transition-colors ${
                      isActive("/settings")
                        ? "bg-sidebar-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{t("nav.items.settings")}</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                to="/settings"
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive("/settings")
                    ? "bg-sidebar-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-accent-foreground"
                }`}
              >
                <Settings className="h-4 w-4 shrink-0" />
                {t("nav.items.settings")}
              </Link>
            )}

            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-full p-2 text-sm rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-accent-foreground transition-colors"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{t("nav.user.logout")}</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 text-sm rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-accent-foreground w-full transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {t("nav.user.logout")}
              </button>
            )}
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top header */}
          <header className="border-b bg-card px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {collapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 mr-1"
                  onClick={() => setCollapsed(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              <h2 className="text-sm font-medium text-muted-foreground">
                {t(PAGE_TITLES[location.pathname] || "nav.items.dashboard")}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCmdOpen(true)}
                className="text-muted-foreground hidden sm:flex"
              >
                <Command className="h-4 w-4 mr-2" />
                {t("nav.header.search")}
                <kbd className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                  ⌘K
                </kbd>
              </Button>
              <Separator
                orientation="vertical"
                className="h-6 hidden sm:block"
              />
              <Link to="/transactions">
                <Button size="sm" variant="default">
                  <Plus className="h-4 w-4 mr-1" />
                  {t("nav.header.new")}
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 h-9">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm">
                      {user?.firstName || user?.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user?.firstName || user?.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("nav.user.account")}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      setTheme(resolvedTheme === "dark" ? "light" : "dark")
                    }
                  >
                    {resolvedTheme === "dark" ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    {resolvedTheme === "dark" ? t("nav.user.lightMode") : t("nav.user.darkMode")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="mr-2 h-4 w-4" />
                    {t("nav.user.systemTheme")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.user.settings")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.user.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} navigate={navigate} t={t} />
    </TooltipProvider>
  );
}

function NavGroup({
  items,
  label,
  isActiveItem,
  collapsed,
  t,
}: {
  items: NavItem[];
  label: string;
  isActiveItem: (path: string) => boolean;
  collapsed: boolean;
  t: (key: string) => string;
}) {
  return (
    <div>
      {!collapsed && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
          {t(label)}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = isActiveItem(item.path);
          const NavIcon = item.icon;
          const link = (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors relative",
                active
                  ? "bg-sidebar-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-accent-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
              )}
              <NavIcon className="h-4 w-4 shrink-0" />
              {!collapsed && t(item.label)}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{t(item.label)}</TooltipContent>
              </Tooltip>
            );
          }
          return link;
        })}
      </div>
    </div>
  );
}

function CommandPalette({
  open,
  onOpenChange,
  navigate,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
  t: (key: string) => string;
}) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("nav.header.searchPlaceholder")} />
      <CommandList>
        <CommandEmpty>{t("noResults")}</CommandEmpty>
        <CommandGroup heading={t("nav.command.pages")}>
          <CommandItem onSelect={() => { navigate("/"); onOpenChange(false); }}>
            <LayoutDashboard className="h-4 w-4 mr-2" />
            {t("nav.items.dashboard")}
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/transactions"); onOpenChange(false); }}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            {t("nav.items.transactions")}
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/receipts"); onOpenChange(false); }}>
            <Receipt className="h-4 w-4 mr-2" />
            {t("nav.items.receipts")}
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/clients"); onOpenChange(false); }}>
            <Users className="h-4 w-4 mr-2" />
            {t("nav.items.clients")}
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/categories"); onOpenChange(false); }}>
            <Tag className="h-4 w-4 mr-2" />
            {t("nav.items.categories")}
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/invoices"); onOpenChange(false); }}>
            <FileText className="h-4 w-4 mr-2" />
            {t("nav.items.invoices")}
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/budgets"); onOpenChange(false); }}>
            <BarChart3 className="h-4 w-4 mr-2" />
            {t("nav.items.budgets")}
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/reports"); onOpenChange(false); }}>
            <Calculator className="h-4 w-4 mr-2" />
            {t("nav.items.reports")}
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/tax-summary"); onOpenChange(false); }}>
            <Calculator className="h-4 w-4 mr-2" />
            {t("nav.items.taxSummary")}
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading={t("nav.command.quickActions")}>
          <CommandItem onSelect={() => { navigate("/transactions?type=expense"); onOpenChange(false); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t("nav.command.addExpense")}
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/transactions?type=income"); onOpenChange(false); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t("nav.command.addIncome")}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
