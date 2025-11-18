import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import Appointments from "@/pages/appointments";
import Pharmacy from "@/pages/pharmacy";
import Invoices from "@/pages/invoices";
import Admissions from "@/pages/admissions";
import Surgeries from "@/pages/surgeries";
import Laboratory from "@/pages/laboratory";
import Radiology from "@/pages/radiology";
import HR from "@/pages/hr";
import Payroll from "@/pages/payroll";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Home, Users, Calendar, Activity, Pill, FileText, LogOut, Stethoscope, Building2, DollarSign, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";

function AppSidebar() {
  const menuItems = [
    { title: "الرئيسية", url: "/", icon: Home },
    { title: "المرضى", url: "/patients", icon: Users },
    { title: "المواعيد", url: "/appointments", icon: Calendar },
    { title: "التنويم", url: "/admissions", icon: Activity },
    { title: "العمليات", url: "/surgeries", icon: Stethoscope },
    { title: "الصيدلية", url: "/pharmacy", icon: Pill },
    { title: "المعامل", url: "/laboratory", icon: FileText },
    { title: "الأشعة", url: "/radiology", icon: Building2 },
    { title: "الموارد البشرية", url: "/hr", icon: UserCog },
    { title: "الرواتب", url: "/payroll", icon: DollarSign },
    { title: "الفواتير", url: "/invoices", icon: FileText },
  ];

  return (
    <Sidebar side="right" variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-primary mb-4">
            نظام إدارة المستشفيات
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="ml-2" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/patients" component={Patients} />
          <Route path="/appointments" component={Appointments} />
          <Route path="/pharmacy" component={Pharmacy} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/admissions" component={Admissions} />
          <Route path="/surgeries" component={Surgeries} />
          <Route path="/laboratory" component={Laboratory} />
          <Route path="/radiology" component={Radiology} />
          <Route path="/hr" component={HR} />
          <Route path="/payroll" component={Payroll} />
          {/* Add more routes here as pages are created */}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (isLoading || !isAuthenticated) {
    return <Router />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties} defaultOpen={true}>
      <div className="flex h-screen w-full" dir="rtl">
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between p-4 border-b bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h2 className="text-lg font-semibold">لوحة التحكم</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground" data-testid="text-user-name">
                {user && typeof user === 'object' ? (user as any).firstName || (user as any).email : 'مستخدم'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Router />
          </main>
        </div>
        <AppSidebar />
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
