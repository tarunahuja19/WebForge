import React, { useState } from "react";
import { useGetGatePass, useUpdateGatePass, useCreateGateLog } from "@workspace/api-client-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, CheckCircle2, XCircle, Search, Zap, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GatePassCard } from "@/components/GatePassCard";

export default function GateScan() {
  const [passIdInput, setPassIdInput] = useState("");
  const [searchedId, setSearchedId] = useState<number | null>(null);
  const [activationStatus, setActivationStatus] = useState<'idle' | 'activating' | 'activated' | 'error'>('idle');
  const { toast } = useToast();

  const { data: pass, isLoading: isFetching, error: fetchError, refetch } = useGetGatePass(
    searchedId ?? 0,
    { query: { enabled: searchedId !== null && searchedId > 0 } as any }
  );

  const updateMutation = useUpdateGatePass();
  const createLog = useCreateGateLog();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(passIdInput.trim());
    if (!id || id <= 0) {
      toast({ variant: "destructive", title: "Invalid Pass ID", description: "Please enter a valid numeric pass ID." });
      return;
    }
    setSearchedId(id);
    setActivationStatus('idle');
  };

  const handleActivate = () => {
    if (!pass) return;
    setActivationStatus('activating');

    // Update the gate pass status to "active"
    updateMutation.mutate({ id: pass.id, data: { status: "active" } }, {
      onSuccess: () => {
        // Log the exit event
        createLog.mutate({
          data: {
            studentId: pass.studentId,
            gatePassId: pass.id,
            type: "exit",
            method: "manual",
          }
        });
        setActivationStatus('activated');
        toast({ title: "✅ Pass Activated!", description: `Gate pass #${pass.id} is now active. 2-hour countdown started.` });
        refetch();
      },
      onError: () => {
        setActivationStatus('error');
        toast({ variant: "destructive", title: "Activation Failed", description: "Could not activate the gate pass." });
      }
    });
  };

  const handleReset = () => {
    setPassIdInput("");
    setSearchedId(null);
    setActivationStatus('idle');
  };

  const isAlreadyActive = pass?.status === 'active';
  const canActivate = pass?.status === 'approved';
  const isExpiredOrUsed = pass?.status === 'expired' || pass?.status === 'used';
  const isPending = pass?.status === 'pending';
  const isRejected = pass?.status === 'rejected';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Gate Pass Verification"
        description="Enter a pass ID to look up and activate a student's gate pass."
      />

      {/* Search Bar */}
      <Card className="border-sidebar-border shadow-md">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="pass-id-input"
                placeholder="Enter Pass ID (e.g. 42)"
                value={passIdInput}
                onChange={e => setPassIdInput(e.target.value)}
                className="pl-10 text-lg font-mono py-6 text-center tracking-widest"
                autoFocus
              />
            </div>
            <Button type="submit" size="lg" className="gap-2 shrink-0" disabled={isFetching}>
              <Search className="h-4 w-4" />
              {isFetching ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pass Not Found */}
      {searchedId && !isFetching && fetchError && (
        <Card className="border-destructive/50">
          <CardContent className="p-8 flex flex-col items-center text-center gap-3">
            <XCircle className="h-16 w-16 text-destructive" />
            <h3 className="text-xl font-bold">Pass Not Found</h3>
            <p className="text-muted-foreground">No gate pass found with ID #{searchedId}. Please double-check the pass ID.</p>
            <Button variant="outline" onClick={handleReset}>Try Another</Button>
          </CardContent>
        </Card>
      )}

      {/* Pass Found — Display it */}
      {pass && !fetchError && (
        <div className="space-y-4">
          <GatePassCard pass={pass} />

          {/* Status-specific actions */}
          {canActivate && activationStatus !== 'activated' && (
            <Card className="border-amber-300/50 bg-amber-50/50 dark:border-amber-700/40 dark:bg-amber-950/20">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Pass is Approved — Not Yet Active
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click "Activate Pass" to start the 2-hour countdown and allow the student to exit.
                    </p>
                  </div>
                  <Button
                    id="activate-pass-btn"
                    onClick={handleActivate}
                    disabled={activationStatus === 'activating'}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-lg shadow-emerald-500/20"
                    size="lg"
                  >
                    <Zap className="h-4 w-4" />
                    {activationStatus === 'activating' ? "Activating..." : "Activate Pass"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isAlreadyActive && (
            <Card className="border-emerald-500/50 bg-emerald-50/50 dark:border-emerald-700/40 dark:bg-emerald-950/20">
              <CardContent className="p-5 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-300">Pass is Currently Active</h4>
                  <p className="text-sm text-muted-foreground">Student has already exited. The 2-hour timer is running.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activationStatus === 'activated' && (
            <Card className="border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-5 flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">Access Granted!</h4>
                  <p className="text-sm text-muted-foreground">Pass activated. Student may exit. 2-hour countdown has started.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {isExpiredOrUsed && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-5 flex items-center gap-3">
                <XCircle className="h-6 w-6 text-destructive shrink-0" />
                <div>
                  <h4 className="font-bold text-destructive">Access Denied</h4>
                  <p className="text-sm text-muted-foreground">This pass is {pass.status}. Student is not authorized to exit with this pass.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {isPending && (
            <Card className="border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-5 flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-700 dark:text-amber-300">Pending Warden Approval</h4>
                  <p className="text-sm text-muted-foreground">This pass has not been approved by the warden yet. Student cannot exit.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {isRejected && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-5 flex items-center gap-3">
                <XCircle className="h-6 w-6 text-destructive shrink-0" />
                <div>
                  <h4 className="font-bold text-destructive">Pass Rejected</h4>
                  <p className="text-sm text-muted-foreground">
                    This pass was rejected by the warden.
                    {pass.wardenRemarks && <> Reason: <em>{pass.wardenRemarks}</em></>}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleReset}>
              Search Another Pass
            </Button>
          </div>
        </div>
      )}

      {/* Idle state */}
      {!searchedId && (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="p-12 flex flex-col items-center text-center gap-4">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
              <ScanLine className="h-10 w-10 text-muted-foreground animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground">Ready to Verify</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Enter the gate pass ID above to look up a student's pass. You can then activate it to start the 2-hour exit window.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
