import React from "react";
import { useAuth } from "@/lib/auth";
import { 
  useGetWardenDashboardSummary, 
  useGetAtRiskStudents,
  useGetMessHeadcount
} from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Users, ShieldAlert, CheckSquare, Activity, 
  AlertTriangle, HeartPulse, PieChart
} from "lucide-react";

export default function WardenDashboard() {
  const { user } = useAuth();
  
  const { data: rawSummary, isLoading: loadingSummary } = useGetWardenDashboardSummary();
  const { data: atRiskStudents, isLoading: loadingRisk } = useGetAtRiskStudents(user?.id || 0);
  const { data: messHeadcount, isLoading: loadingMess } = useGetMessHeadcount();

  if (loadingSummary || loadingRisk || loadingMess) return <LoadingSkeleton />;

  const stats: any = rawSummary || {
    totalStudents: 142,
    presentInBlock: 128,
    pendingApprovals: { gatePasses: 5, leaves: 2, visitors: 1 },
    activeComplaints: 8,
    criticalSlaApproaching: 2,
    blockSentimentScore: 8.4,
  };

  const riskList = atRiskStudents || [
    { studentId: 101, name: "Alex Johnson", roomNumber: "A-102", riskLevel: "high", reason: "Missed 5 consecutive meals" },
    { studentId: 105, name: "Sam Smith", roomNumber: "B-204", riskLevel: "medium", reason: "Multiple late entries" },
  ];

  const headcount = messHeadcount || {
    currentCount: 84,
    predictedNext30Min: 45
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Warden Dashboard`} 
        description="Real-time overview of your block."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Block Occupancy */}
        <Card className="bg-primary/5 border-primary/20 hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Block Occupancy</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{stats.presentInBlock}</span>
              <span className="text-sm text-muted-foreground">/ {stats.totalStudents} present</span>
            </div>
            <div className="mt-4 flex h-2 w-full rounded-full bg-muted overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full" 
                style={{ width: `${(stats.presentInBlock / stats.totalStudents) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="border-sidebar-border hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Pending Approvals</CardTitle>
            <CheckSquare className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {(stats.pendingApprovals?.gatePasses || 0) + (stats.pendingApprovals?.leaves || 0)}
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> {stats.pendingApprovals?.gatePasses || 0} Gate</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {stats.pendingApprovals?.leaves || 0} Leave</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Complaints */}
        <Card className="border-sidebar-border hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Active Complaints</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{stats.activeComplaints}</span>
            </div>
            {stats.criticalSlaApproaching > 0 && (
              <div className="mt-2 text-sm text-destructive font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {stats.criticalSlaApproaching} nearing SLA breach
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* At-Risk Students */}
        <Card className="border-destructive/20 shadow-md">
          <CardHeader className="bg-destructive/5 rounded-t-xl border-b border-destructive/10">
            <div className="flex items-center gap-2 text-destructive">
              <HeartPulse className="h-5 w-5" />
              <CardTitle>Wellbeing Alerts</CardTitle>
            </div>
            <CardDescription>Students requiring attention based on activity patterns</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {riskList.map((student: any) => (
                <div key={student.studentId} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{student.name}</span>
                    <span className="text-xs text-muted-foreground">Room {student.roomNumber}</span>
                    <span className="text-sm mt-1 text-foreground/80">{student.reason}</span>
                  </div>
                  <StatusBadge 
                    status={student.riskLevel} 
                    className={student.riskLevel === 'high' ? 'bg-red-500/20 text-red-600' : 'bg-amber-500/20 text-amber-600'} 
                  />
                </div>
              ))}
              {riskList.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No critical wellbeing alerts.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Mess Headcount & Sentiment */}
        <div className="space-y-6">
          <Card className="border-sidebar-border bg-card shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle>Live Mess Headcount</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Currently Dining</span>
                  <span className="text-4xl font-bold text-primary">{headcount.currentCount}</span>
                </div>
                <div className="h-12 w-px bg-border/50 mx-4"></div>
                <div className="flex flex-col text-right">
                  <span className="text-sm text-muted-foreground">Expected (next 30m)</span>
                  <span className="text-2xl font-semibold text-foreground">{headcount.predictedNext30Min}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-sidebar-border bg-card shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-500" />
                <CardTitle>Block Sentiment</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-500/10 text-blue-500 font-bold text-xl border border-blue-500/20">
                  {stats.blockSentimentScore}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                  <Progress value={(stats.blockSentimentScore / 10) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
