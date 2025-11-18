import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Users, Calendar, Activity, Pill, FileText, Stethoscope } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "غير مصرح",
        description: "جاري تسجيل الدخول...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast]);

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
    enabled: !!user,
  });

  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments"],
    enabled: !!user,
  });

  const { data: medications } = useQuery({
    queryKey: ["/api/medications"],
    enabled: !!user,
  });

  const { data: lowStockMeds } = useQuery({
    queryKey: ["/api/medications/low-stock"],
    enabled: !!user,
  });

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-welcome">
          مرحباً، {user?.firstName || user?.email}
        </h1>
        <p className="text-muted-foreground">
          نظرة عامة على نشاطات المستشفى اليوم
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المرضى
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-patients">
              {patients?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              مريض مسجل في النظام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              المواعيد اليوم
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-appointments-today">
              {appointments?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              موعد محجوز
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              مخزون الأدوية
            </CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-medications-count">
              {medications?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              صنف دوائي متوفر
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              تنبيهات المخزون
            </CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-low-stock">
              {lowStockMeds?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              دواء يحتاج إعادة طلب
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover-elevate cursor-pointer">
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-2" />
            <CardTitle>إدارة المرضى</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              عرض وإدارة ملفات المرضى
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer">
          <CardHeader>
            <Calendar className="h-8 w-8 text-primary mb-2" />
            <CardTitle>المواعيد</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              جدولة ومتابعة المواعيد
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer">
          <CardHeader>
            <Stethoscope className="h-8 w-8 text-primary mb-2" />
            <CardTitle>العيادات الخارجية</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              متابعة العيادات الخارجية
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer">
          <CardHeader>
            <Activity className="h-8 w-8 text-primary mb-2" />
            <CardTitle>التنويم والأسرة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              إدارة الأسرة والتنويم
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer">
          <CardHeader>
            <Pill className="h-8 w-8 text-primary mb-2" />
            <CardTitle>الصيدلية</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              إدارة المخزون والوصفات
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer">
          <CardHeader>
            <FileText className="h-8 w-8 text-primary mb-2" />
            <CardTitle>التقارير</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              عرض التقارير والإحصائيات
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
