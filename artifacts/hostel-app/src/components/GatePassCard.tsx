import React, { useState, useEffect } from "react";
import { GatePass } from "@workspace/api-client-react";
import { Clock, MapPin, User, Hash, Building2, BookOpen, ShieldCheck, Timer } from "lucide-react";

interface GatePassCardProps {
  pass: GatePass;
  compact?: boolean;
}

function formatCountdown(activatedAt: string): string {
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const elapsed = Date.now() - new Date(activatedAt).getTime();
  const remaining = Math.max(0, twoHoursMs - elapsed);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function GatePassCard({ pass, compact = false }: GatePassCardProps) {
  const [countdown, setCountdown] = useState<string>("");

  const isActive = pass.status === "active";
  const isApproved = pass.status === "approved";
  const isExpired = pass.status === "expired" || pass.status === "used";

  useEffect(() => {
    if (!isActive || !pass.activatedAt) return;
    const tick = () => setCountdown(formatCountdown(pass.activatedAt as string));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isActive, pass.activatedAt]);

  // Color theming
  let cardClasses = "";
  let accentBarColor = "";
  let statusLabel = "";
  let statusLabelClasses = "";

  if (isActive) {
    cardClasses = "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent shadow-lg shadow-emerald-500/10";
    accentBarColor = "bg-gradient-to-r from-emerald-500 to-emerald-400";
    statusLabel = "ACTIVE";
    statusLabelClasses = "bg-emerald-500 text-white animate-pulse";
  } else if (isApproved) {
    cardClasses = "border-slate-300/60 bg-gradient-to-br from-slate-100/80 via-slate-50/60 to-transparent dark:border-slate-600/40 dark:from-slate-800/50 dark:via-slate-700/30";
    accentBarColor = "bg-gradient-to-r from-slate-400 to-slate-300 dark:from-slate-500 dark:to-slate-600";
    statusLabel = "APPROVED — AWAITING ACTIVATION";
    statusLabelClasses = "bg-slate-400/20 text-slate-600 dark:bg-slate-600/30 dark:text-slate-300";
  } else if (isExpired) {
    cardClasses = "border-rose-300/40 bg-gradient-to-br from-rose-50/50 to-transparent dark:border-rose-800/30 dark:from-rose-950/20 opacity-70";
    accentBarColor = "bg-gradient-to-r from-rose-400 to-rose-300";
    statusLabel = pass.status.toUpperCase();
    statusLabelClasses = "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400";
  } else {
    cardClasses = "border-amber-300/40 bg-gradient-to-br from-amber-50/50 to-transparent dark:border-amber-800/30 dark:from-amber-950/20";
    accentBarColor = "bg-gradient-to-r from-amber-400 to-amber-300";
    statusLabel = pass.status.toUpperCase();
    statusLabelClasses = "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400";
  }

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${cardClasses}`}>
      {/* Top accent bar */}
      <div className={`h-1.5 w-full ${accentBarColor}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isActive ? "bg-emerald-500/15" : "bg-muted/60"}`}>
              <ShieldCheck className={`h-5 w-5 ${isActive ? "text-emerald-500" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Gate Pass</p>
              <p className="text-lg font-bold text-foreground font-mono">#{pass.id}</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full tracking-wider ${statusLabelClasses}`}>
            {statusLabel}
          </span>
        </div>

        {/* Active countdown timer */}
        {isActive && pass.activatedAt && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <Timer className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Time Remaining</p>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-300 tabular-nums tracking-wider">
                {countdown}
              </p>
            </div>
          </div>
        )}

        {/* Details grid */}
        <div className={`grid ${compact ? "grid-cols-1 gap-2" : "grid-cols-2 gap-3"}`}>
          {pass.studentName && (
            <div className="flex items-start gap-2">
              <User className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Student</p>
                <p className="text-sm font-semibold text-foreground leading-tight">{pass.studentName}</p>
                {(pass as any).studentRoll && (
                  <p className="text-xs text-muted-foreground">{(pass as any).studentRoll}</p>
                )}
              </div>
            </div>
          )}

          {(pass as any).studentDept && (
            <div className="flex items-start gap-2">
              <BookOpen className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Department</p>
                <p className="text-sm font-semibold text-foreground leading-tight">{(pass as any).studentDept}</p>
              </div>
            </div>
          )}

          {(pass as any).studentRoom && (
            <div className="flex items-start gap-2">
              <Building2 className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Room</p>
                <p className="text-sm font-semibold text-foreground leading-tight">{(pass as any).studentRoom}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Destination</p>
              <p className="text-sm font-semibold text-foreground leading-tight">{pass.destination}</p>
            </div>
          </div>

          <div className={`flex items-start gap-2 ${compact ? "" : "col-span-2"}`}>
            <Hash className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Purpose</p>
              <p className="text-sm text-foreground leading-tight">{pass.purpose}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Requested {pass.createdAt ? new Date(pass.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
          </span>
          <span className="flex items-center gap-1">
            Return by {new Date(pass.expectedReturn).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
}
