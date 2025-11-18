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
import Prescriptions from "@/pages/prescriptions";
import { useAuth } from "@/hooks/useAuth";
import { Home, Users, Calendar, Activity, Pill, FileText, LogOut, Stethoscope, Building2, DollarSign, UserCog, Menu, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import { usePermissions } from "@/hooks/usePermissions";

function AppSidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const [location] = useLocation();
  const { canRead } = usePermissions();
  
  const allMenuItems = [
    { title: "الرئيسية", url: "/", icon: Home, resource: null },
    { title: "المرضى", url: "/patients", icon: Users, resource: "patients" as const },
    { title: "المواعيد", url: "/appointments", icon: Calendar, resource: "appointments" as const },
    { title: "التنويم", url: "/admissions", icon: Activity, resource: "admissions" as const },
    { title: "العمليات", url: "/surgeries", icon: Stethoscope, resource: "surgeries" as const },
    { title: "الصيدلية", url: "/pharmacy", icon: Pill, resource: "medications" as const },
    { title: "الوصفات الطبية", url: "/prescriptions", icon: ClipboardList, resource: "prescriptions" as const },
    { title: "المعامل", url: "/laboratory", icon: FileText, resource: "labTests" as const },
    { title: "الأشعة", url: "/radiology", icon: Building2, resource: "radiologyTests" as const },
    { title: "الموارد البشرية", url: "/hr", icon: UserCog, resource: "staff" as const },
    { title: "الرواتب", url: "/payroll", icon: DollarSign, resource: "payroll" as const },
    { title: "الفواتير", url: "/invoices", icon: FileText, resource: "invoices" as const },
  ];

  const menuItems = allMenuItems.filter(item => 
    !item.resource || canRead(item.resource)
  );

  return (
    <aside
      className={`fixed top-0 right-0 h-full bg-card border-l border-border transition-all duration-300 z-10 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
      data-testid="sidebar"
      aria-label="قائمة التنقل الرئيسية"
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-bold text-primary">نظام إدارة المستشفيات</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="flex-shrink-0"
            data-testid="button-sidebar-toggle-internal"
            aria-label={isCollapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية"}
            title={isCollapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            {isCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location === item.url;
              const Icon = item.icon;
              
              return (
                <li key={item.url}>
                  <a
                    href={item.url}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover-elevate active-elevate-2 ${
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground"
                    } ${isCollapsed ? "justify-center" : ""}`}
                    data-testid={`link-sidebar-${item.url.substring(1) || "home"}`}
                    aria-label={item.title}
                    title={item.title}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? "" : "ml-2"}`} aria-hidden="true" />
                    {!isCollapsed && <span className="whitespace-nowrap">{item.title}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
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
          <Route path="/prescriptions" component={Prescriptions} />
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (isLoading || !isAuthenticated) {
    return <Router />;
  }

  return (
    <div className="h-screen w-full flex flex-col" dir="rtl">
      <header 
        className={`flex items-center justify-between p-4 border-b bg-card z-30 transition-all duration-300 ${
          isSidebarCollapsed ? "ml-20" : "ml-64"
        }`}
        style={{ marginRight: isSidebarCollapsed ? "5rem" : "16rem" }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            data-testid="button-sidebar-toggle"
            aria-label={isSidebarCollapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية"}
            title={isSidebarCollapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            <Menu className="h-5 w-5" />
          </Button>
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

      <div className="flex-1 flex overflow-hidden">
        <main
          className={`flex-1 overflow-auto bg-background transition-all duration-300 ${
            isSidebarCollapsed ? "ml-20" : "ml-64"
          }`}
          style={{ marginRight: isSidebarCollapsed ? "5rem" : "16rem" }}
        >
          <Router />
        </main>
        <AppSidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      </div>
    </div>
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
