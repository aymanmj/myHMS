import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Calendar, Clipboard, Pill, FileText } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20" dir="rtl">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-primary">
            نظام إدارة المستشفيات
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            منظومة متكاملة لإدارة المستشفيات والعيادات بأعلى معايير الاحترافية والجودة
          </p>
          <div className="flex gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login"
              className="text-lg px-8"
            >
              تسجيل الدخول
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          <Card className="hover-elevate">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>إدارة المرضى</CardTitle>
              <CardDescription>
                ملفات شاملة مع بيانات الاسم الرباعي والوثائق الرسمية الكاملة
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <Calendar className="h-12 w-12 text-primary mb-4" />
              <CardTitle>المواعيد والعيادات</CardTitle>
              <CardDescription>
                جدولة متقدمة حسب الأطباء والتخصصات مع قوائم الانتظار
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <Activity className="h-12 w-12 text-primary mb-4" />
              <CardTitle>التنويم والأسرة</CardTitle>
              <CardDescription>
                إدارة كاملة للأسرة والتنويم مع متابعة حالة كل سرير
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <Clipboard className="h-12 w-12 text-primary mb-4" />
              <CardTitle>العمليات الجراحية</CardTitle>
              <CardDescription>
                جدولة العمليات وحجز غرف العمليات مع إدارة فريق العملية
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <Pill className="h-12 w-12 text-primary mb-4" />
              <CardTitle>الصيدلية</CardTitle>
              <CardDescription>
                إدارة المخزون والوصفات الطبية مع تنبيهات انتهاء الصلاحية
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <FileText className="h-12 w-12 text-primary mb-4" />
              <CardTitle>التقارير والإحصائيات</CardTitle>
              <CardDescription>
                تقارير شاملة يومية وشهرية وسنوية مع إمكانية التصدير
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-muted-foreground">
          <p>© 2025 نظام إدارة المستشفيات - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
}
