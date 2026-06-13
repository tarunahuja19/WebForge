import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useListComplaints, useUpdateComplaint } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WardenComplaints() {
  const { data: complaints, isLoading, refetch } = useListComplaints();
  const updateMutation = useUpdateComplaint();
  const { toast } = useToast();

  if (isLoading) return <LoadingSkeleton />;

  const activeComplaints = complaints?.filter(c => c.status !== 'resolved') || [];

  const handleUpdateStatus = (id: number, status: 'acknowledged' | 'in_progress' | 'resolved') => {
    updateMutation.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: "Status updated" });
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Complaint Inbox" 
        description="Manage and resolve student issues across the block."
      />

      <div className="grid grid-cols-1 gap-4">
        {activeComplaints.map(complaint => {
          const isOverdue = complaint.isOverdue || (complaint.slaHours && complaint.slaHours < 12);
          
          return (
            <Card key={complaint.id} className={`border-l-4 ${isOverdue ? 'border-l-destructive' : 'border-l-primary'} overflow-hidden hover-elevate`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  
                  {/* Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={complaint.status} />
                      <Badge variant="outline" className="capitalize text-xs font-semibold">{complaint.category}</Badge>
                      <span className="text-sm font-semibold text-foreground">{complaint.studentName}</span>
                      <span className="text-sm text-muted-foreground">Room {complaint.roomNumber}</span>
                    </div>
                    <p className="text-foreground text-base leading-relaxed">{complaint.description}</p>
                    <div className="flex items-center gap-4 text-xs font-medium mt-2">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> 
                        Reported {new Date(complaint.createdAt || '').toLocaleDateString()}
                      </span>
                      {isOverdue && (
                        <span className="text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> SLA Breached
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0 md:w-48 justify-center">
                    {complaint.status === 'raised' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(complaint.id, 'acknowledged')} disabled={updateMutation.isPending}>
                        Acknowledge
                      </Button>
                    )}
                    {(complaint.status === 'acknowledged' || complaint.status === 'raised') && (
                      <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(complaint.id, 'in_progress')} disabled={updateMutation.isPending}>
                        Mark In Progress
                      </Button>
                    )}
                    {complaint.status === 'in_progress' && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleUpdateStatus(complaint.id, 'resolved')} disabled={updateMutation.isPending}>
                        Resolve Issue
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-primary mt-1">View Thread</Button>
                  </div>
                  
                </div>
              </CardContent>
            </Card>
          );
        })}

        {activeComplaints.length === 0 && (
          <div className="p-12 text-center border border-dashed rounded-xl bg-card">
            <h3 className="text-lg font-medium">Inbox Zero</h3>
            <p className="text-muted-foreground">No pending complaints in your block.</p>
          </div>
        )}
      </div>
    </div>
  );
}
