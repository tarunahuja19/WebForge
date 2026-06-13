import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function PageHeader({ 
  title, 
  description, 
  action 
}: { 
  title: string; 
  description?: string; 
  action?: React.ReactNode 
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatusBadge({ 
  status, 
  className = "" 
}: { 
  status: string; 
  className?: string 
}) {
  const normalized = status.toLowerCase();
  
  let colorClass = "bg-muted text-muted-foreground";
  
  if (["approved", "resolved", "paid", "active", "completed"].includes(normalized)) {
    colorClass = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  } else if (["pending", "in_progress", "partial", "acknowledged"].includes(normalized)) {
    colorClass = "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  } else if (["rejected", "overdue", "expired", "cancelled"].includes(normalized)) {
    colorClass = "bg-red-500/15 text-red-600 dark:text-red-400";
  } else if (["used", "visited", "vacated"].includes(normalized)) {
    colorClass = "bg-blue-500/15 text-blue-600 dark:text-blue-400";
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${colorClass} ${className}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} description="This page is under construction." />
      <div className="h-64 border-2 border-dashed border-border rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground font-medium">Coming Soon</p>
      </div>
    </div>
  );
}
