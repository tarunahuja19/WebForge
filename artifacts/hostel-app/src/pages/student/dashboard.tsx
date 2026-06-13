import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useGetStudentDashboardSummary } from "@workspace/api-client-react";
import { PageHeader, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, DoorClosed, MapPin, MessageSquare, CreditCard, Calendar, Clock, Bell, Sparkles, Users, Building2, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);

  // In a real scenario with proper API types, we'd use the typed hook.
  // For the sake of UI completeness, we will handle potential undefined/mock data safely.
  const { data: rawData, isLoading } = useGetStudentDashboardSummary();

  // Check room assignment status
  useEffect(() => {
    async function checkRoom() {
      try {
        const studRes = await fetch("/api/students");
        const students = await studRes.json();
        const myStudent = students.find?.((s: any) => s.userId === user?.id) || students[0];
        if (!myStudent) { setLoadingRoom(false); return; }

        // Check profile
        const profRes = await fetch(`/api/personality/${myStudent.id}`);
        const profData = await profRes.json();
        setHasProfile(profData.hasProfile);

        if (myStudent.roomId) {
          const roomRes = await fetch(`/api/rooms/${myStudent.roomId}`);
          const room = await roomRes.json();
          setRoomInfo(room);
        }
      } catch {}
      setLoadingRoom(false);
    }
    checkRoom();
  }, [user]);

  if (isLoading) return <LoadingSkeleton />;

  const summary: any = rawData || {
    roomInfo: { roomNumber: "A-204", blockName: "North Wing", roommates: 2 },
    messAttendance: { percentage: 85, skipped: 3 },
    activeGatePasses: [{ id: 1, destination: "City Center", status: "approved" }],
    pendingComplaints: 1,
    feeStatus: { status: "paid", nextDueDate: "2024-05-01" },
    upcomingLeave: null,
    recentActivity: [
      { id: 1, text: "Mess attendance recorded (Breakfast)", time: "2 hours ago" },
      { id: 2, text: "Gate pass #1042 approved by Warden", time: "1 day ago" },
      { id: 3, text: "Fee receipt generated for March", time: "3 days ago" },
    ]
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Student'}`} 
        description="Here is your campus life overview for today."
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* My Room Card — Enhanced with real data */}
        <Card className="bg-card/50 backdrop-blur border-sidebar-border hover-elevate transition-all relative overflow-hidden">
          {!loadingRoom && !roomInfo && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent animate-pulse" />
          )}
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Room</CardTitle>
            <DoorClosed className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingRoom ? (
              <div className="h-8 bg-muted/30 rounded animate-pulse" />
            ) : roomInfo ? (
              <>
                <div className="text-2xl font-bold text-foreground">{roomInfo.roomNumber}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {roomInfo.blockName} • Floor {roomInfo.floor}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Users className="h-3 w-3 text-primary" />
                  <span className="text-xs text-muted-foreground">{roomInfo.currentOccupancy}/{roomInfo.capacity} occupants</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-bold text-foreground">Unassigned</div>
                <Link href="/student/room">
                  <Button size="sm" className="mt-2 gap-1.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20 text-xs">
                    <Sparkles className="h-3 w-3" />
                    {hasProfile === false ? "Take Personality Test" : "Find Your Room"}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-sidebar-border hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mess Attendance</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.messAttendance?.percentage || 0}%</div>
            <Progress value={summary.messAttendance?.percentage || 0} className="h-1.5 mt-2 bg-muted/50" />
            <p className="text-xs text-muted-foreground mt-2">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-sidebar-border hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fee Status</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground capitalize">
              {summary.feeStatus?.status || 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Next due: {summary.feeStatus?.nextDueDate ? new Date(summary.feeStatus.nextDueDate).toLocaleDateString() : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-sidebar-border hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Issues</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.pendingComplaints || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active complaints
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Personality Test CTA Banner (if no room) */}
      {!loadingRoom && !roomInfo && hasProfile === false && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden relative">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
          <CardContent className="flex items-center gap-6 py-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/30 shrink-0">
              <Brain className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">🧠 Find Your Perfect Roommate with AI</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Take a quick 15-question personality test and our AI will match you with the most compatible roommate and the best available room.
              </p>
            </div>
            <Link href="/student/room">
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 shrink-0">
                <Sparkles className="h-4 w-4" />
                Start Test
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column: Active Passes & Leave */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-sidebar-border shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Active Gate Passes</CardTitle>
              </div>
              <CardDescription>Passes approved for today</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.activeGatePasses && summary.activeGatePasses.length > 0 ? (
                <div className="space-y-4">
                  {summary.activeGatePasses.map((pass: any) => (
                    <div key={pass.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex flex-col">
                        <span className="font-semibold">{pass.destination}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" /> Valid until 10:00 PM
                        </span>
                      </div>
                      <StatusBadge status={pass.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground">No active gate passes.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="space-y-6">
          <Card className="border-sidebar-border shadow-md h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:ml-2.5 md:before:-translate-x-px before:h-full before:w-0.5 before:bg-border/50">
                {summary.recentActivity?.map((activity: any, i: number) => (
                  <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <div className="h-1.5 w-1.5 bg-primary-foreground rounded-full"></div>
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] ml-4 md:ml-0 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-sm font-medium">{activity.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Import Brain for the CTA section
function Brain(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
      <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
      <path d="M6 18a4 4 0 0 1-1.967-.516"/>
      <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
    </svg>
  );
}
