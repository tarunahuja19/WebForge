import React from "react";
import { useAuth } from "@/lib/auth";
import { useGetParentDashboardSummary } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, Users, CreditCard } from "lucide-react";

export default function ParentDashboard() {
  const { data: rawSummary, isLoading } = useGetParentDashboardSummary();

  if (isLoading) return <LoadingSkeleton />;

  const stats: any = rawSummary || {
    wardStatus: { name: "Alex Johnson", room: "A-204", status: "present" },
    feeSummary: { status: "paid", nextDue: "2024-05-01" },
    recentLeaves: [],
    visitorLog: [],
    messAttendancePercentage: 88,
    gateActivity: []
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Parent Dashboard" 
        description={`Overview of ${stats.wardStatus?.name || 'your ward'}'s campus life.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Status</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize text-emerald-600">{stats.wardStatus?.status || 'Present'}</div>
            <p className="text-xs text-muted-foreground mt-1">Room {stats.wardStatus?.room}</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mess Attendance</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messAttendancePercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
