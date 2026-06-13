import React, { useState } from "react";
import { useCreateGateLog } from "@workspace/api-client-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GateScan() {
  const [passId, setPassId] = useState("");
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const createLog = useCreateGateLog();
  const { toast } = useToast();

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passId) return;

    // Simulate validation
    createLog.mutate({
      data: {
        studentId: parseInt(passId) || 1, // Mock student ID
        type: "exit",
        method: "qr"
      }
    }, {
      onSuccess: () => {
        setStatus('success');
        toast({ title: "Valid Pass", description: "Entry/Exit logged." });
        setTimeout(() => { setStatus('idle'); setPassId(""); }, 3000);
      },
      onError: () => {
        setStatus('error');
        toast({ variant: "destructive", title: "Invalid Pass", description: "Pass expired or rejected." });
        setTimeout(() => setStatus('idle'), 3000);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <PageHeader title="QR Scanner UI" />

      <Card className={`border-2 ${status === 'success' ? 'border-emerald-500' : status === 'error' ? 'border-destructive' : 'border-sidebar-border'}`}>
        <CardContent className="p-12 flex flex-col items-center text-center">
          
          {status === 'idle' && <ScanLine className="h-24 w-24 text-primary animate-pulse mb-6" />}
          {status === 'success' && <CheckCircle2 className="h-24 w-24 text-emerald-500 mb-6" />}
          {status === 'error' && <XCircle className="h-24 w-24 text-destructive mb-6" />}

          <h3 className="text-xl font-bold mb-2">
            {status === 'idle' ? "Ready to Scan" : status === 'success' ? "Access Granted" : "Access Denied"}
          </h3>

          <form onSubmit={handleScan} className="w-full mt-8 space-y-4">
            <Input 
              placeholder="Simulate QR scan (enter Pass ID)" 
              value={passId}
              onChange={e => setPassId(e.target.value)}
              className="text-center font-mono text-lg py-6"
              autoFocus
            />
            <Button type="submit" size="lg" className="w-full" disabled={createLog.isPending}>
              Simulate Scan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
