import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Home, Users, Calendar, Activity, Pill, FileText, Settings, LogOut, Stethoscope, Building2, DollarSign, UserCog } from "lucide-react";
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
    <Sidebar>
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
          {/* Add more routes here as pages are created */}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (isLoading || !isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full" dir="rtl">
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <header className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <h2 className="text-lg font-semibold">لوحة التحكم</h2>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground" data-testid="text-user-name">
                    {user?.firstName || user?.email}
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
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
