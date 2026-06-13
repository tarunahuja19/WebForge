import React from "react";
import { useGetOccupancyStats, useGetFeeStats } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminReports() {
  const { data: occStats, isLoading: occLoading } = useGetOccupancyStats();
  const { data: feeStats, isLoading: feeLoading } = useGetFeeStats();

  if (occLoading || feeLoading) return <LoadingSkeleton />;

  // Mock data if API is empty
  const blockOccupancy = occStats?.byBlock || [
    { blockName: "North Wing", occupiedRooms: 45, totalRooms: 50 },
    { blockName: "South Wing", occupiedRooms: 48, totalRooms: 50 },
    { blockName: "East Block", occupiedRooms: 30, totalRooms: 40 },
    { blockName: "West Annex", occupiedRooms: 35, totalRooms: 40 },
  ];

  const feeTrend = feeStats?.monthlyTrend || [
    { month: "Jan", collected: 45000, due: 5000 },
    { month: "Feb", collected: 48000, due: 2000 },
    { month: "Mar", collected: 30000, due: 20000 },
    { month: "Apr", collected: 49000, due: 1000 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports & Analytics" 
        description="Data-driven insights for hostel operations."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Block Occupancy</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={blockOccupancy} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="blockName" stroke="currentColor" fontSize={12} opacity={0.6} />
                <YAxis stroke="currentColor" fontSize={12} opacity={0.6} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                <Bar dataKey="occupiedRooms" name="Occupied" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalRooms" name="Capacity" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Collection Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={feeTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" stroke="currentColor" fontSize={12} opacity={0.6} />
                <YAxis stroke="currentColor" fontSize={12} opacity={0.6} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                <Line type="monotone" dataKey="collected" name="Collected" stroke="hsl(var(--primary))" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="due" name="Pending Due" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
