import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useListVisitors, useUpdateVisitorRequest } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Calendar, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WardenVisitors() {
  const { data: visitors, isLoading, refetch } = useListVisitors();
  const updateMutation = useUpdateVisitorRequest();
  const { toast } = useToast();

  if (isLoading) return <LoadingSkeleton />;

  const pendingVisitors = visitors?.filter(v => v.status === 'pending') || [];
  const activeVisitors = visitors?.filter(v => v.status === 'approved' || v.status === 'visited') || [];

  const handleAction = (id: number, status: 'approved' | 'rejected') => {
    updateMutation.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Visitor request ${status}` });
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Visitor Approvals" 
        description="Review student visitor requests."
      />

      <div className="grid grid-cols-1 gap-4">
        {pendingVisitors.map(visitor => (
          <Card key={visitor.id} className="border-sidebar-border overflow-hidden hover-elevate">
            <CardContent className="p-0 flex flex-col md:flex-row">
              <div className="flex-1 p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{visitor.visitorName}</h3>
                    <p className="text-sm font-medium text-primary mt-1">Visiting: {visitor.studentName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Expected Arrival</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium mt-1">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      {new Date(visitor.expectedArrival).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border/50 text-sm">
                  <div>
                    <span className="font-semibold text-muted-foreground text-xs uppercase">Relation</span>
                    <p className="text-foreground mt-1">{visitor.relation}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground text-xs uppercase">Purpose</span>
                    <p className="text-foreground mt-1">{visitor.purpose}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-muted-foreground text-xs uppercase">Contact</span>
                    <p className="text-foreground mt-1 flex items-center gap-1"><Phone className="h-3 w-3"/> {visitor.visitorPhone || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/10 border-t md:border-t-0 md:border-l border-border p-6 flex flex-row md:flex-col items-center justify-center gap-3 shrink-0 md:w-48">
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                  onClick={() => handleAction(visitor.id, 'approved')}
                  disabled={updateMutation.isPending}
                >
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
                  onClick={() => handleAction(visitor.id, 'rejected')}
                  disabled={updateMutation.isPending}
                >
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {pendingVisitors.length === 0 && (
          <div className="p-12 text-center border border-dashed rounded-xl bg-card text-muted-foreground">
            No pending visitor requests.
          </div>
        )}
      </div>
    </div>
  );
}
