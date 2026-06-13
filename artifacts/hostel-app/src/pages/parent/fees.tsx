import React from "react";
import { useAuth } from "@/lib/auth";
import { useListFees } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CreditCard, Download } from "lucide-react";

export default function ParentFees() {
  const { user } = useAuth();
  // Assume backend links parent user to student, using parent ID to fetch related student fees
  const { data: fees, isLoading } = useListFees({ studentId: user?.id });

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Fee Payments" 
        description="View and pay your ward's outstanding hostel and mess dues."
      />

      <Card>
        <CardHeader>
          <CardTitle>Fee History & Dues</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees?.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell className="font-medium">{fee.month}</TableCell>
                  <TableCell>${fee.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell><StatusBadge status={fee.status} /></TableCell>
                  <TableCell className="text-right">
                    {fee.status === 'paid' ? (
                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                        <Download className="h-3 w-3 mr-2" /> Receipt
                      </Button>
                    ) : (
                      <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
                        <CreditCard className="h-3 w-3 mr-2" /> Pay Now
                      </Button>
                    )}
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
