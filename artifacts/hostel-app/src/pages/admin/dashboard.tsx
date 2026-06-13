import React from "react";
import { useAuth } from "@/lib/auth";
import { useGetAdminDashboardSummary } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DollarSign, Activity, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AdminDashboard() {
  const { data: rawSummary, isLoading } = useGetAdminDashboardSummary();

  if (isLoading) return <LoadingSkeleton />;

  const stats: any = rawSummary || {
    totalBlocks: 4,
    totalStudents: 520,
    overallOccupancy: 88,
    feeCollectionRate: 92,
    complaintResolutionRate: 85,
    hostelHealthLeaderboard: [
      { blockName: "North Wing", score: 9.2 },
      { blockName: "South Wing", score: 8.7 },
      { blockName: "East Block", score: 8.1 },
      { blockName: "West Annex", score: 7.4 }
    ],
    recentActivity: []
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Control Center" 
        description="Campus-wide overview of hostel operations."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Occupancy</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overallOccupancy}%</div>
            <Progress value={stats.overallOccupancy} className="h-1.5 mt-3" />
            <p className="text-xs text-muted-foreground mt-2">{stats.totalStudents} students across {stats.totalBlocks} blocks</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fee Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.feeCollectionRate}%</div>
            <Progress value={stats.feeCollectionRate} className="h-1.5 mt-3 bg-muted [&>div]:bg-emerald-500" />
            <p className="text-xs text-muted-foreground mt-2">Target: 95% by month end</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SLA Resolution</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complaintResolutionRate}%</div>
            <Progress value={stats.complaintResolutionRate} className="h-1.5 mt-3 bg-muted [&>div]:bg-blue-500" />
            <p className="text-xs text-muted-foreground mt-2">Complaints resolved on time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Block Health Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats.hostelHealthLeaderboard?.map((block: any, i: number) => (
                <div key={block.blockName} className="flex items-center">
                  <div className="w-8 font-bold text-muted-foreground">#{i+1}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-foreground">{block.blockName}</span>
                      <span className="font-bold text-primary">{block.score}/10</span>
                    </div>
                    <Progress value={(block.score / 10) * 100} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
