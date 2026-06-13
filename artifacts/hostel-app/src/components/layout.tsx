import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  Building2, Users, FileText, Settings, ShieldAlert, CheckSquare,
  Activity, DoorClosed, Mail, LogOut, Home, MessageSquare, Menu, Calendar,
  CreditCard, PieChart, ShieldCheck, MapPin
} from "lucide-react";

export function Sidebar({ role }: { role: string }) {
  const [, setLocation] = useLocation();
  const { logout, user } = useAuth();
  
  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const navItems = {
    student: [
      { name: "Dashboard", href: "/student", icon: Home },
      { name: "My Room", href: "/student/room", icon: DoorClosed },
      { name: "Mess & Menu", href: "/student/mess", icon: Activity },
      { name: "Gate Pass", href: "/student/gate-pass", icon: MapPin },
      { name: "Leave Requests", href: "/student/leave", icon: Calendar },
      { name: "Complaints", href: "/student/complaints", icon: MessageSquare },
      { name: "Fees & Dues", href: "/student/fees", icon: CreditCard },
      { name: "Visitors", href: "/student/visitors", icon: Users },
    ],
    warden: [
      { name: "Dashboard", href: "/warden", icon: Home },
      { name: "Students", href: "/warden/students", icon: Users },
      { name: "Complaints", href: "/warden/complaints", icon: ShieldAlert },
      { name: "Gate Passes", href: "/warden/gate-passes", icon: CheckSquare },
      { name: "Leave Approvals", href: "/warden/leave", icon: FileText },
      { name: "Visitors", href: "/warden/visitors", icon: Users },
      { name: "Rounds Log", href: "/warden/rounds", icon: ShieldCheck },
      { name: "Appointments", href: "/warden/appointments", icon: Calendar },
    ],
    admin: [
      { name: "Dashboard", href: "/admin", icon: PieChart },
      { name: "Students", href: "/admin/students", icon: Users },
      { name: "Blocks & Rooms", href: "/admin/blocks", icon: Building2 },
      { name: "Staff", href: "/admin/staff", icon: ShieldCheck },
      { name: "Fees Collection", href: "/admin/fees", icon: CreditCard },
      { name: "All Complaints", href: "/admin/complaints", icon: ShieldAlert },
      { name: "Announcements", href: "/admin/announcements", icon: Mail },
      { name: "Reports", href: "/admin/reports", icon: FileText },
    ],
    parent: [
      { name: "Overview", href: "/parent", icon: Home },
      { name: "Fee Payments", href: "/parent/fees", icon: CreditCard },
      { name: "Visitor Log", href: "/parent/visitors", icon: Users },
      { name: "Appointments", href: "/parent/appointments", icon: Calendar },
    ],
    gate_staff: [
      { name: "Live Dashboard", href: "/gate", icon: Activity },
      { name: "QR Scanner", href: "/gate/scan", icon: MapPin },
      { name: "Gate Log", href: "/gate/log", icon: FileText },
    ]
  };

  const links = navItems[role as keyof typeof navItems] || [];

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border shadow-xl z-10 sticky top-0">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border bg-sidebar-primary/5">
        <div className="flex items-center gap-3 text-primary font-bold tracking-tight">
          <img src="https://upload.wikimedia.org/wikipedia/en/1/1f/Manipal_University_Jaipur_logo.png" alt="MUJ" className="h-8 w-8 object-contain bg-white rounded-sm p-0.5" />
          <span className="text-sm leading-tight">Manipal University<br/>Jaipur</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto py-6 px-4">
        <div className="space-y-1">
          {links.map((link) => (
            <Link key={link.name} href={link.href}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer group font-medium text-sm">
                <link.icon className="h-4 w-4 text-sidebar-foreground/60 group-hover:text-primary transition-colors" />
                {link.name}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-sidebar-border bg-sidebar/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
            {user?.name?.charAt(0) || role.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-foreground">{user?.name || "Demo User"}</span>
            <span className="text-xs text-sidebar-foreground/60 capitalize">{role.replace('_', ' ')}</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10 border-sidebar-border"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}

export function AppLayout({ children, role }: { children: React.ReactNode, role: string }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
