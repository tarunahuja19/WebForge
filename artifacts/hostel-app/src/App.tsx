import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";

// Pages
import Login from "@/pages/login";

// Student
import StudentDashboard from "@/pages/student/dashboard";
import StudentRoom from "@/pages/student/room";
import StudentGatePass from "@/pages/student/gate-pass";
import StudentLeave from "@/pages/student/leave";
import StudentComplaints from "@/pages/student/complaints";
import StudentMess from "@/pages/student/mess";
import StudentFees from "@/pages/student/fees";
import StudentVisitors from "@/pages/student/visitors";

// Warden
import WardenDashboard from "@/pages/warden/dashboard";
import WardenStudents from "@/pages/warden/students";
import WardenComplaints from "@/pages/warden/complaints";
import WardenGatePasses from "@/pages/warden/gate-passes";
import WardenLeave from "@/pages/warden/leave";
import WardenVisitors from "@/pages/warden/visitors";
import WardenRounds from "@/pages/warden/rounds";
import WardenAppointments from "@/pages/warden/appointments";

// Admin
import AdminDashboard from "@/pages/admin/dashboard";
import AdminStudents from "@/pages/admin/students";
import AdminBlocks from "@/pages/admin/blocks";
import AdminRooms from "@/pages/admin/rooms";
import AdminStaff from "@/pages/admin/staff";
import AdminFees from "@/pages/admin/fees";
import AdminComplaints from "@/pages/admin/complaints";
import AdminAnnouncements from "@/pages/admin/announcements";
import AdminReports from "@/pages/admin/reports";

// Parent
import ParentDashboard from "@/pages/parent/dashboard";
import ParentFees from "@/pages/parent/fees";
import ParentVisitors from "@/pages/parent/visitors";
import ParentAppointments from "@/pages/parent/appointments";

// Gate
import GateDashboard from "@/pages/gate/dashboard";
import GateScan from "@/pages/gate/scan";
import GateLog from "@/pages/gate/log";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, allowedRole }: { component: any, allowedRole: string }) {
  const { user, role } = useAuth();
  const [, setLocation] = useLocation();

  if (!user || !role) {
    setLocation("/login");
    return null;
  }

  if (role !== allowedRole) {
    setLocation(`/${role}`);
    return null;
  }

  return (
    <AppLayout role={role}>
      <Component />
    </AppLayout>
  );
}

function Router() {
  const { user, role } = useAuth();

  return (
    <Switch>
      <Route path="/">
        {() => {
          if (user && role) {
            window.location.href = `/${role}`;
            return null;
          }
          window.location.href = "/login";
          return null;
        }}
      </Route>
      <Route path="/login" component={Login} />

      {/* Student Routes */}
      <Route path="/student"><ProtectedRoute allowedRole="student" component={StudentDashboard} /></Route>
      <Route path="/student/room"><ProtectedRoute allowedRole="student" component={StudentRoom} /></Route>
      <Route path="/student/gate-pass"><ProtectedRoute allowedRole="student" component={StudentGatePass} /></Route>
      <Route path="/student/leave"><ProtectedRoute allowedRole="student" component={StudentLeave} /></Route>
      <Route path="/student/complaints"><ProtectedRoute allowedRole="student" component={StudentComplaints} /></Route>
      <Route path="/student/mess"><ProtectedRoute allowedRole="student" component={StudentMess} /></Route>
      <Route path="/student/fees"><ProtectedRoute allowedRole="student" component={StudentFees} /></Route>
      <Route path="/student/visitors"><ProtectedRoute allowedRole="student" component={StudentVisitors} /></Route>

      {/* Warden Routes */}
      <Route path="/warden"><ProtectedRoute allowedRole="warden" component={WardenDashboard} /></Route>
      <Route path="/warden/students"><ProtectedRoute allowedRole="warden" component={WardenStudents} /></Route>
      <Route path="/warden/complaints"><ProtectedRoute allowedRole="warden" component={WardenComplaints} /></Route>
      <Route path="/warden/gate-passes"><ProtectedRoute allowedRole="warden" component={WardenGatePasses} /></Route>
      <Route path="/warden/leave"><ProtectedRoute allowedRole="warden" component={WardenLeave} /></Route>
      <Route path="/warden/visitors"><ProtectedRoute allowedRole="warden" component={WardenVisitors} /></Route>
      <Route path="/warden/rounds"><ProtectedRoute allowedRole="warden" component={WardenRounds} /></Route>
      <Route path="/warden/appointments"><ProtectedRoute allowedRole="warden" component={WardenAppointments} /></Route>

      {/* Admin Routes */}
      <Route path="/admin"><ProtectedRoute allowedRole="admin" component={AdminDashboard} /></Route>
      <Route path="/admin/students"><ProtectedRoute allowedRole="admin" component={AdminStudents} /></Route>
      <Route path="/admin/blocks"><ProtectedRoute allowedRole="admin" component={AdminBlocks} /></Route>
      <Route path="/admin/rooms"><ProtectedRoute allowedRole="admin" component={AdminRooms} /></Route>
      <Route path="/admin/staff"><ProtectedRoute allowedRole="admin" component={AdminStaff} /></Route>
      <Route path="/admin/fees"><ProtectedRoute allowedRole="admin" component={AdminFees} /></Route>
      <Route path="/admin/complaints"><ProtectedRoute allowedRole="admin" component={AdminComplaints} /></Route>
      <Route path="/admin/announcements"><ProtectedRoute allowedRole="admin" component={AdminAnnouncements} /></Route>
      <Route path="/admin/reports"><ProtectedRoute allowedRole="admin" component={AdminReports} /></Route>

      {/* Parent Routes */}
      <Route path="/parent"><ProtectedRoute allowedRole="parent" component={ParentDashboard} /></Route>
      <Route path="/parent/fees"><ProtectedRoute allowedRole="parent" component={ParentFees} /></Route>
      <Route path="/parent/visitors"><ProtectedRoute allowedRole="parent" component={ParentVisitors} /></Route>
      <Route path="/parent/appointments"><ProtectedRoute allowedRole="parent" component={ParentAppointments} /></Route>

      {/* Gate Staff Routes */}
      <Route path="/gate"><ProtectedRoute allowedRole="gate_staff" component={GateDashboard} /></Route>
      <Route path="/gate/scan"><ProtectedRoute allowedRole="gate_staff" component={GateScan} /></Route>
      <Route path="/gate/log"><ProtectedRoute allowedRole="gate_staff" component={GateLog} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
