import React from "react";
import { useListBlocks } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Building2, Users } from "lucide-react";

export default function AdminBlocks() {
  const { data: blocks, isLoading } = useListBlocks();

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Block Management" 
        description="Overview of all hostel blocks and their health scores."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blocks?.map(block => (
          <Card key={block.id} className="hover-elevate transition-all border-sidebar-border">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{block.name}</CardTitle>
                </div>
                <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold">
                  Score: {block.healthScore || 0}/10
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Warden: {block.wardenName || 'Unassigned'}</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Occupancy</span>
                  <span className="font-medium">{block.occupiedRooms} / {block.totalRooms} Rooms</span>
                </div>
                <Progress value={(block.occupiedRooms / block.totalRooms) * 100} className="h-2" />
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{block.totalStudents || 0} Total Students</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
