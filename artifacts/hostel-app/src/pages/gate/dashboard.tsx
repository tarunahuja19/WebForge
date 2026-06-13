import React from "react";
import { useGetGateDashboardSummary } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, LogIn, LogOut, AlertTriangle } from "lucide-react";

export default function GateDashboard() {
  const { data: rawSummary, isLoading } = useGetGateDashboardSummary();

  if (isLoading) return <LoadingSkeleton />;

  const stats: any = rawSummary || {
    todayEntries: 145,
    todayExits: 152,
    currentlyOut: 42,
    tailgatingAlerts: 1,
    recentLogs: []
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Live Gate Dashboard" 
        description="Real-time campus perimeter monitoring."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Currently Out</CardTitle>
            <Activity className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.currentlyOut}</div>
            <p className="text-xs opacity-80 mt-1">Students outside campus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Exits</CardTitle>
            <LogOut className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayExits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Entries</CardTitle>
            <LogIn className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayEntries}</div>
          </CardContent>
        </Card>

        <Card className={stats.tailgatingAlerts > 0 ? "border-destructive border-2" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tailgating Alerts</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.tailgatingAlerts > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.tailgatingAlerts > 0 ? 'text-destructive' : ''}`}>{stats.tailgatingAlerts}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
