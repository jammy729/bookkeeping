import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useTheme } from "../hooks/useTheme";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Moon, Sun, Monitor, ArrowLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { api } from "../lib/api";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { setTheme } = useTheme();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success(t("forgotPassword.emailSent"));
    } catch {
      toast.error(t("forgotPassword.title"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">{t("accessibility.toggleTheme")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Logo className="w-12 h-12 mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight">{t("forgotPassword.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("forgotPassword.description")}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/></svg>
                </div>
                <p className="text-sm text-muted-foreground">{t("forgotPassword.checkEmail")}</p>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">{t("forgotPassword.backToLogin")}</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("forgotPassword.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t("forgotPassword.emailPlaceholder")}
                    autoComplete="email"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("forgotPassword.sending") : t("forgotPassword.sendLink")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="inline-flex items-center gap-1 font-medium text-foreground hover:underline">
            <ArrowLeft className="h-3 w-3" />
            {t("forgotPassword.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
