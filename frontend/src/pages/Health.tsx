import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import "../i18n";

interface HealthResponse {
  status: "ok" | "degraded";
  timestamp: string;
  environment: string;
  urls: {
    frontend: string | null;
    backend: string | null;
    database: string | null;
  };
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: HealthResponse };

export function Health() {
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(() => {
    setState({ kind: "loading" });
    api
      .get<HealthResponse>("/health")
      .then((res) => setState({ kind: "ready", data: res.data }))
      .catch(() => setState({ kind: "error" }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows =
    state.kind === "ready"
      ? [
          { label: t("health.environment"), value: state.data.environment },
          { label: t("health.frontendUrl"), value: state.data.urls.frontend },
          { label: t("health.backendUrl"), value: state.data.urls.backend },
          { label: t("health.databaseUrl"), value: state.data.urls.database },
          { label: t("health.thisPage"), value: window.location.origin },
        ]
      : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Logo className="w-12 h-12 mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight">{t("health.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("health.description")}</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {state.kind === "loading" && (
              <div className="space-y-3" aria-label={t("health.checking")}>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            )}

            {state.kind === "error" && (
              <div className="text-center space-y-4 py-4" role="alert">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground">{t("health.unreachable")}</p>
                <Button variant="outline" onClick={load}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("health.retry")}
                </Button>
              </div>
            )}

            {state.kind === "ready" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("health.status")}</span>
                  <Badge
                    variant={state.data.status === "ok" ? "success" : "warning"}
                  >
                    {state.data.status === "ok"
                      ? t("health.healthy")
                      : t("health.degraded")}
                  </Badge>
                </div>

                <dl className="space-y-3 text-sm">
                  {rows.map((row) => (
                    <div key={row.label} className="flex flex-col gap-0.5">
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="font-mono text-xs break-all text-foreground">
                        {row.value ?? "—"}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="text-xs text-muted-foreground">
                  {t("health.checkedAt")}: {new Date(state.data.timestamp).toLocaleString()}
                </p>

                <Button variant="outline" className="w-full" onClick={load}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("health.retry")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            {t("health.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
