import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Calendar, FileText, Activity, Stethoscope, Pill, TestTube, ScanLine, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface PatientWithDetails {
  id: string;
  firstNameAr: string;
  fatherNameAr: string;
  grandFatherNameAr: string;
  familyNameAr: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  nationality: string;
  nationalId?: string;
  bloodType?: string;
  appointments: any[];
  prescriptions: any[];
  admissions: any[];
  surgeries: any[];
  labTests: any[];
  radiologyTests: any[];
  invoices: any[];
}

function formatPatientName(patient: PatientWithDetails) {
  return `${patient.firstNameAr} ${patient.fatherNameAr} ${patient.grandFatherNameAr} ${patient.familyNameAr}`;
}

function formatDate(dateString: string | Date) {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, 'dd MMMM yyyy', { locale: ar });
  } catch {
    return 'غير متوفر';
  }
}

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    scheduled: "bg-blue-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
    active: "bg-green-500",
    discharged: "bg-gray-500",
    in_progress: "bg-blue-500",
    paid: "bg-green-500",
    unpaid: "bg-red-500",
    partial: "bg-yellow-500",
  };

  const statusLabels: Record<string, string> = {
    pending: "قيد الانتظار",
    scheduled: "مجدول",
    completed: "مكتمل",
    cancelled: "ملغي",
    active: "نشط",
    discharged: "خرج",
    in_progress: "جاري التنفيذ",
    paid: "مدفوع",
    unpaid: "غير مدفوع",
    partial: "مدفوع جزئياً",
  };

  return (
    <Badge className={statusColors[status] || "bg-gray-500"}>
      {statusLabels[status] || status}
    </Badge>
  );
}

export default function PatientDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const patientId = params.id;

  const { data: patient, isLoading, error } = useQuery<PatientWithDetails>({
    queryKey: [`/api/patients/${patientId}/details`],
    enabled: !!patientId,
    retry: 2,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "خطأ",
        description: (error as any).message || "فشل في تحميل بيانات المريض",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || (!isLoading && !patient)) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {error ? "حدث خطأ أثناء تحميل البيانات" : "لم يتم العثور على المريض"}
            </p>
            <Button className="mt-4" onClick={() => navigate("/patients")}>
              العودة للمرضى
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-patient-name">
            {formatPatientName(patient)}
          </h1>
          <p className="text-muted-foreground">
            {patient.gender === 'male' ? 'ذكر' : 'أنثى'} • تاريخ الميلاد: {formatDate(patient.dateOfBirth)}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/patients")} data-testid="button-back">
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">المواعيد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient.appointments?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">الوصفات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient.prescriptions?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">العمليات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient.surgeries?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">الفواتير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient.invoices?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="inline-flex flex-wrap w-full gap-1 h-auto p-1">
          <TabsTrigger value="overview" data-testid="tab-overview" className="flex-shrink-0">نظرة عامة</TabsTrigger>
          <TabsTrigger value="appointments" data-testid="tab-appointments" className="flex-shrink-0">
            <Calendar className="h-4 w-4 ml-2" />
            المواعيد
          </TabsTrigger>
          <TabsTrigger value="prescriptions" data-testid="tab-prescriptions" className="flex-shrink-0">
            <Pill className="h-4 w-4 ml-2" />
            الوصفات
          </TabsTrigger>
          <TabsTrigger value="admissions" data-testid="tab-admissions" className="flex-shrink-0">
            <Activity className="h-4 w-4 ml-2" />
            التنويم
          </TabsTrigger>
          <TabsTrigger value="surgeries" data-testid="tab-surgeries" className="flex-shrink-0">
            <Stethoscope className="h-4 w-4 ml-2" />
            العمليات
          </TabsTrigger>
          <TabsTrigger value="lab" data-testid="tab-lab" className="flex-shrink-0">
            <TestTube className="h-4 w-4 ml-2" />
            التحاليل
          </TabsTrigger>
          <TabsTrigger value="radiology" data-testid="tab-radiology" className="flex-shrink-0">
            <ScanLine className="h-4 w-4 ml-2" />
            الأشعة
          </TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices" className="flex-shrink-0">
            <DollarSign className="h-4 w-4 ml-2" />
            الفواتير
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الشخصية</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">رقم الهوية</p>
                <p className="font-medium">{patient.nationalId || 'غير متوفر'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الجنسية</p>
                <p className="font-medium">{patient.nationality}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                <p className="font-medium">{patient.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                <p className="font-medium">{patient.email || 'غير متوفر'}</p>
              </div>
              {patient.bloodType && (
                <div>
                  <p className="text-sm text-muted-foreground">فصيلة الدم</p>
                  <p className="font-medium">{patient.bloodType}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المواعيد الطبية</CardTitle>
              <CardDescription>{patient.appointments?.length || 0} موعد</CardDescription>
            </CardHeader>
            <CardContent>
              {patient.appointments && patient.appointments.length > 0 ? (
                <div className="space-y-4">
                  {patient.appointments.map((appointment: any) => (
                    <Card key={appointment.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium">{formatDate(appointment.appointmentDate)}</p>
                          <p className="text-sm text-muted-foreground">{appointment.reason || 'لا يوجد سبب'}</p>
                        </div>
                        <StatusBadge status={appointment.status} />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد مواعيد</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الوصفات الطبية</CardTitle>
              <CardDescription>{patient.prescriptions?.length || 0} وصفة</CardDescription>
            </CardHeader>
            <CardContent>
              {patient.prescriptions && patient.prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {patient.prescriptions.map((prescription: any) => (
                    <Card key={prescription.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{formatDate(prescription.prescriptionDate)}</p>
                        <StatusBadge status={prescription.status} />
                      </div>
                      {prescription.medications && prescription.medications.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {prescription.medications.map((med: any, idx: number) => (
                            <p key={idx} className="text-sm text-muted-foreground">
                              • {med.medicationName} - {med.dosage}
                            </p>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد وصفات طبية</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل التنويم</CardTitle>
              <CardDescription>{patient.admissions?.length || 0} حالة تنويم</CardDescription>
            </CardHeader>
            <CardContent>
              {patient.admissions && patient.admissions.length > 0 ? (
                <div className="space-y-4">
                  {patient.admissions.map((admission: any) => (
                    <Card key={admission.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">تاريخ الدخول: {formatDate(admission.admissionDate)}</p>
                          {admission.dischargeDate && (
                            <p className="text-sm text-muted-foreground">
                              تاريخ الخروج: {formatDate(admission.dischargeDate)}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={admission.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{admission.diagnosis || 'لا يوجد تشخيص'}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا يوجد سجل تنويم</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surgeries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>العمليات الجراحية</CardTitle>
              <CardDescription>{patient.surgeries?.length || 0} عملية</CardDescription>
            </CardHeader>
            <CardContent>
              {patient.surgeries && patient.surgeries.length > 0 ? (
                <div className="space-y-4">
                  {patient.surgeries.map((surgery: any) => (
                    <Card key={surgery.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{surgery.surgeryType}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(surgery.surgeryDate)}
                          </p>
                        </div>
                        <StatusBadge status={surgery.status} />
                      </div>
                      {surgery.description && (
                        <p className="text-sm text-muted-foreground mt-2">{surgery.description}</p>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد عمليات جراحية</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التحاليل المعملية</CardTitle>
              <CardDescription>{patient.labTests?.length || 0} تحليل</CardDescription>
            </CardHeader>
            <CardContent>
              {patient.labTests && patient.labTests.length > 0 ? (
                <div className="space-y-4">
                  {patient.labTests.map((test: any) => (
                    <Card key={test.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{test.testName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(test.requestDate)}
                          </p>
                        </div>
                        <StatusBadge status={test.status} />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد تحاليل معملية</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="radiology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الأشعة التشخيصية</CardTitle>
              <CardDescription>{patient.radiologyTests?.length || 0} فحص</CardDescription>
            </CardHeader>
            <CardContent>
              {patient.radiologyTests && patient.radiologyTests.length > 0 ? (
                <div className="space-y-4">
                  {patient.radiologyTests.map((test: any) => (
                    <Card key={test.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{test.testType} - {test.bodyPart}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(test.requestDate)}
                          </p>
                        </div>
                        <StatusBadge status={test.status} />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد فحوصات أشعة</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الفواتير</CardTitle>
              <CardDescription>{patient.invoices?.length || 0} فاتورة</CardDescription>
            </CardHeader>
            <CardContent>
              {patient.invoices && patient.invoices.length > 0 ? (
                <div className="space-y-4">
                  {patient.invoices.map((invoice: any) => (
                    <Card key={invoice.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">فاتورة #{invoice.id.substring(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(invoice.invoiceDate)}
                          </p>
                        </div>
                        <StatusBadge status={invoice.paymentStatus} />
                      </div>
                      <p className="text-lg font-bold mt-2">{invoice.totalAmount} ريال</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد فواتير</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
