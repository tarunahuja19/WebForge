import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { 
  useListGatePasses, 
  useCreateGatePass,
  GatePassInput
} from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Clock, Calendar, QrCode, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StudentGatePass() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Form state
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");

  const { data: passes, isLoading, refetch } = useListGatePasses({
    studentId: user?.id
  });

  const createMutation = useCreateGatePass();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !purpose || !expectedReturn) {
      toast({ title: "Validation Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    const payload: GatePassInput = {
      destination,
      purpose,
      expectedReturn: new Date(expectedReturn).toISOString(),
    };

    createMutation.mutate({ data: payload }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Gate pass requested successfully." });
        setIsOpen(false);
        setDestination("");
        setPurpose("");
        setExpectedReturn("");
        refetch();
      },
      onError: (err) => {
        toast({ title: "Error", description: "Failed to request gate pass.", variant: "destructive" });
      }
    });
  };

  if (isLoading) return <LoadingSkeleton />;

  const activePasses = passes?.filter(p => p.status === 'approved') || [];
  const pastPasses = passes?.filter(p => p.status !== 'approved') || [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gate Passes" 
        description="Request and manage your entry/exit permissions."
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Request</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Request Gate Pass</DialogTitle>
                <DialogDescription>
                  Submit a request to leave the campus. Approvals are usually processed within 2 hours.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input 
                    id="destination" 
                    placeholder="e.g. City Mall, Hospital" 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input 
                    id="purpose" 
                    placeholder="Reason for leaving" 
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return">Expected Return Time</Label>
                  <Input 
                    id="return" 
                    type="datetime-local" 
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(e.target.value)}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Active Pass Section */}
      {activePasses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" /> Active Passes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePasses.map(pass => (
              <Card key={pass.id} className="border-primary/30 bg-primary/5 overflow-hidden">
                <div className="h-2 w-full bg-primary" />
                <CardContent className="p-6 flex gap-6 items-center">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-border shrink-0 h-24 w-24 flex items-center justify-center">
                    {/* Simulated QR Code */}
                    <div className="grid grid-cols-5 grid-rows-5 gap-1 w-full h-full opacity-80">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className={`bg-black rounded-sm ${Math.random() > 0.4 ? 'opacity-100' : 'opacity-0'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-lg">{pass.destination}</h4>
                    <p className="text-sm text-muted-foreground">{pass.purpose}</p>
                    <div className="flex items-center gap-2 text-xs font-medium text-primary mt-2">
                      <Clock className="h-3 w-3" /> Return by {new Date(pass.expectedReturn).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* History Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">Pass History</h3>
        <Card>
          <CardContent className="p-0">
            {pastPasses.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No gate pass history found.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pastPasses.map(pass => (
                  <div key={pass.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{pass.destination}</span>
                        <StatusBadge status={pass.status} />
                      </div>
                      <span className="text-sm text-muted-foreground">{pass.purpose}</span>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(pass.createdAt || '').toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Return: {new Date(pass.expectedReturn).toLocaleString()}</span>
                      </div>
                    </div>
                    {pass.wardenRemarks && (
                      <div className="text-xs bg-muted p-2 rounded-md max-w-xs text-muted-foreground border border-border">
                        <strong>Remarks:</strong> {pass.wardenRemarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
