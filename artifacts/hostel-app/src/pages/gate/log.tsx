import React, { useState } from "react";
import { useListGateLogs } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, LogIn, LogOut, AlertTriangle } from "lucide-react";

export default function GateLog() {
  const { data: logs, isLoading } = useListGateLogs();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  if (isLoading) return <LoadingSkeleton />;

  const filtered = logs?.filter(log => {
    const matchesSearch = log.studentName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || log.type === filterType;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gate Activity Log" 
        description="Comprehensive history of all campus entries and exits."
      />

      <Card>
        <CardHeader className="pb-3 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by student name..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="All Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="entry">Entries Only</SelectItem>
                <SelectItem value="exit">Exits Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Time</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Alerts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.studentName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {log.type === 'entry' ? <LogIn className="h-4 w-4 text-emerald-500" /> : <LogOut className="h-4 w-4 text-amber-500" />}
                      <span className="capitalize font-medium">{log.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{log.method}</TableCell>
                  <TableCell>
                    {log.isTailgating && (
                      <div className="flex items-center gap-1 text-destructive text-sm font-semibold">
                        <AlertTriangle className="h-4 w-4" /> Tailgating Detected
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No logs found.
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
