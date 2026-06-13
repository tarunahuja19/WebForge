import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type RoleType = "student" | "warden" | "admin" | "parent" | "gate_staff";

const DEMO_CREDENTIALS: Record<RoleType, { email: string; password: string }> = {
  student: { email: "arjun@student.edu", password: "student123" },
  warden: { email: "warden1@hostel.edu", password: "warden123" },
  admin: { email: "admin@hostel.edu", password: "admin123" },
  parent: { email: "parent1@hostel.edu", password: "parent123" },
  gate_staff: { email: "gate@hostel.edu", password: "gate123" },
};

const PORTAL_LABELS: Record<RoleType, string> = {
  student: "Student",
  warden: "Warden",
  admin: "Admin",
  parent: "Parent",
  gate_staff: "Gate",
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { setAuth } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const [role, setRole] = useState<RoleType>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleDemoFill = () => {
    const creds = DEMO_CREDENTIALS[role];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    loginMutation.mutate(
      { data: { email, password, role } },
      {
        onSuccess: (data) => {
          setAuth(data.user, role);
          toast({
            title: "Login successful",
            description: `Welcome back, ${data.user.name}`,
          });
          setLocation(`/${role === "gate_staff" ? "gate" : role}`);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: "Invalid credentials. Use the demo login button below.",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-24 w-24 mb-4 bg-white/10 rounded-2xl p-2 backdrop-blur shadow-xl shadow-primary/20 flex items-center justify-center">
            <img src="https://upload.wikimedia.org/wikipedia/en/1/1f/Manipal_University_Jaipur_logo.png" alt="Manipal University Jaipur" className="w-full h-full object-contain filter drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Manipal University Jaipur</h1>
          <p className="text-muted-foreground">Intelligent Campus Housing Management</p>
        </div>

        <Card className="border-sidebar-border bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Select your portal and sign in to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label>Select Portal</Label>
                <Tabs
                  value={role}
                  onValueChange={(v) => {
                    setRole(v as RoleType);
                    setEmail("");
                    setPassword("");
                  }}
                  className="w-full"
                >
                  <TabsList className="w-full grid grid-cols-5 h-auto p-1">
                    {(Object.keys(PORTAL_LABELS) as RoleType[]).map((r) => (
                      <TabsTrigger key={r} value={r} className="py-2 text-xs font-medium">
                        {PORTAL_LABELS[r]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={DEMO_CREDENTIALS[role].email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <span className="text-xs text-primary cursor-pointer">Forgot password?</span>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Authenticating..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-border/50 pt-6">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Demo Access</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleDemoFill}>
              <KeyRound className="mr-2 h-4 w-4" />
              Load {PORTAL_LABELS[role]} Demo Credentials
            </Button>
            <p className="text-xs text-center text-muted-foreground opacity-60">
              {DEMO_CREDENTIALS[role].email} / {DEMO_CREDENTIALS[role].password}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
