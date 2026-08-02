import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("auth.register.validation.passwordMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t("auth.register.validation.passwordMinLength"));
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      setDone(true);
      toast.success(t("resetPassword.success"));
    } catch {
      toast.error(t("resetPassword.failed"));
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
          <h1 className="text-2xl font-bold tracking-tight">{t("resetPassword.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("resetPassword.description")}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {!token ? (
              <p className="text-sm text-destructive text-center">{t("resetPassword.invalidLink")}</p>
            ) : done ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">{t("resetPassword.success")}</p>
                <Button className="w-full" onClick={() => navigate("/login")}>
                  {t("resetPassword.loginButton")}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t("resetPassword.newPassword")}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder={t("resetPassword.newPasswordPlaceholder")}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("resetPassword.confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("resetPassword.resetting") : t("resetPassword.resetButton")}
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
