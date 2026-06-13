import React from "react";
import { useAuth } from "@/lib/auth";
import { useListFees } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, CreditCard, ReceiptIndianRupee } from "lucide-react";

export default function StudentFees() {
  const { user } = useAuth();
  
  const { data: fees, isLoading } = useListFees({
    studentId: user?.id
  });

  if (isLoading) return <LoadingSkeleton />;

  const totalOutstanding = fees?.filter(f => ['pending', 'overdue', 'partial'].includes(f.status))
    .reduce((sum, f) => sum + (f.totalAmount - (f.paidAmount || 0)), 0) || 0;

  const currentMonthFee = fees?.find(f => f.status !== 'paid' && f.status !== 'partial') || fees?.[0];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Fees & Dues" 
        description="Manage your hostel and mess fee payments."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2 bg-primary text-primary-foreground border-none overflow-hidden relative shadow-lg">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ReceiptIndianRupee className="h-32 w-32" />
          </div>
          <CardHeader>
            <CardTitle className="text-primary-foreground/80 font-normal">Total Outstanding Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-6">₹{totalOutstanding.toLocaleString()}</div>
            <div className="flex gap-4">
              <Button variant="secondary" size="lg" className="font-bold">
                Pay Now
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                View Breakdown
              </Button>
            </div>
          </CardContent>
        </Card>

        {currentMonthFee && (
          <Card className="border-sidebar-border shadow-md flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Bill</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div>
                <div className="text-2xl font-bold mb-4">{currentMonthFee.month}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hostel Fee</span>
                    <span className="font-medium">₹{currentMonthFee.hostelFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mess Charges</span>
                    <span className="font-medium">₹{currentMonthFee.messFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Electricity</span>
                    <span className="font-medium">₹{currentMonthFee.electricityFee}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-border flex justify-between font-bold text-foreground">
                    <span>Total</span>
                    <span>₹{currentMonthFee.totalAmount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees?.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell className="font-medium">{fee.month}</TableCell>
                  <TableCell>₹{fee.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell><StatusBadge status={fee.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 text-xs" disabled={fee.status !== 'paid'}>
                      <Download className="h-3 w-3 mr-2" /> Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!fees || fees.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No fee records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
