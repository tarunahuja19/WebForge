import React from "react";
import { useAuth } from "@/lib/auth";
import { useListVisitors } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ParentVisitors() {
  const { user } = useAuth();
  const { data: visitors, isLoading } = useListVisitors();

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Visitor Log" 
        description="View approved visitors for your ward."
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Visitors</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Visitor Name</TableHead>
                <TableHead>Relation</TableHead>
                <TableHead>Expected Arrival</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors?.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.visitorName}</TableCell>
                  <TableCell>{v.relation}</TableCell>
                  <TableCell>{new Date(v.expectedArrival).toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={v.status} /></TableCell>
                </TableRow>
              ))}
              {(!visitors || visitors.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No visitor records found.
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
