import React from "react";
import { useListGatePasses, useUpdateGatePass } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WardenGatePasses() {
  const { data: passes, isLoading, refetch } = useListGatePasses();
  const updateMutation = useUpdateGatePass();
  const { toast } = useToast();

  if (isLoading) return <LoadingSkeleton />;

  const pendingPasses = passes?.filter(p => p.status === 'pending') || [];

  const handleAction = (id: number, status: 'approved' | 'rejected') => {
    updateMutation.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Pass ${status}` });
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gate Pass Approvals" 
        description="Review and process student exit requests."
      />

      <div className="grid grid-cols-1 gap-4">
        {pendingPasses.map(pass => (
          <Card key={pass.id} className="border-sidebar-border overflow-hidden hover-elevate">
            <CardContent className="p-0 flex flex-col md:flex-row">
              <div className="flex-1 p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{pass.studentName}</h3>
                    <p className="text-sm font-medium text-primary mt-1">{pass.destination}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Expected Return</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium mt-1">
                      <Clock className="h-4 w-4 text-amber-500" />
                      {new Date(pass.expectedReturn).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm text-foreground/90">
                  <span className="font-semibold text-muted-foreground block mb-1 text-xs uppercase">Purpose</span>
                  {pass.purpose}
                </div>
              </div>
              
              <div className="bg-muted/10 border-t md:border-t-0 md:border-l border-border p-6 flex flex-row md:flex-col items-center justify-center gap-3 shrink-0 md:w-48">
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                  onClick={() => handleAction(pass.id, 'approved')}
                  disabled={updateMutation.isPending}
                >
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
                  onClick={() => handleAction(pass.id, 'rejected')}
                  disabled={updateMutation.isPending}
                >
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {pendingPasses.length === 0 && (
          <div className="p-12 text-center border border-dashed rounded-xl bg-card text-muted-foreground">
            No pending gate pass requests.
          </div>
        )}
      </div>
    </div>
  );
}
