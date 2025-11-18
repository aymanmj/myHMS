import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRadiologyTestSchema, type InsertRadiologyTest, type Patient } from "@shared/schema";
import { useState } from "react";
import { Plus, Radio, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Radiology() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: radiologyTests, isLoading } = useQuery({
    queryKey: ["/api/radiology-tests"],
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: staff } = useQuery({
    queryKey: ["/api/staff"],
  });

  const addRadiologyTestMutation = useMutation({
    mutationFn: async (data: InsertRadiologyTest) => {
      return await apiRequest("POST", "/api/radiology-tests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radiology-tests"] });
      setIsAddDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم إضافة طلب الأشعة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة طلب الأشعة",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertRadiologyTest>({
    resolver: zodResolver(insertRadiologyTestSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      testType: "",
      bodyPart: "",
      status: "pending",
    },
  });

  const onSubmit = (data: InsertRadiologyTest) => {
    addRadiologyTestMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "قيد الانتظار", variant: "default" },
      in_progress: { label: "قيد التنفيذ", variant: "default" },
      completed: { label: "مكتمل", variant: "secondary" },
      cancelled: { label: "ملغي", variant: "destructive" },
    };
    const { label, variant } = statusMap[status] || { label: status, variant: "default" as const };
    return <Badge variant={variant} data-testid={`badge-status-${status}`}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const radiologyTestsList = Array.isArray(radiologyTests) ? radiologyTests : [];
  const patientsList = Array.isArray(patients) ? patients : [];
  const staffList = Array.isArray(staff) ? staff : [];
  
  const pendingTests = radiologyTestsList.filter((test: any) => test.status === "pending");
  const inProgressTests = radiologyTestsList.filter((test: any) => test.status === "in_progress");
  const completedTests = radiologyTestsList.filter((test: any) => test.status === "completed");

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الأشعة</h1>
          <p className="text-muted-foreground">طلبات الأشعة والتصوير الطبي</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-radiology-test">
              <Plus className="h-4 w-4 ml-2" />
              طلب أشعة جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>طلب أشعة جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات طلب الأشعة
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المريض</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-patient">
                              <SelectValue placeholder="اختر المريض" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patientsList.map((patient: Patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.firstNameAr} {patient.familyNameAr} - {patient.nationalId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="doctorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الطبيب الطالب</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-doctor">
                              <SelectValue placeholder="اختر الطبيب" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {staffList.filter((s: any) => s.role === "doctor").map((doctor: any) => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                د. {doctor.firstNameAr} {doctor.familyNameAr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="testType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع الأشعة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-test-type">
                              <SelectValue placeholder="اختر نوع الأشعة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="x-ray">أشعة سينية (X-Ray)</SelectItem>
                            <SelectItem value="ct">أشعة مقطعية (CT)</SelectItem>
                            <SelectItem value="mri">رنين مغناطيسي (MRI)</SelectItem>
                            <SelectItem value="ultrasound">سونار (Ultrasound)</SelectItem>
                            <SelectItem value="mammography">ماموجرام (Mammography)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bodyPart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الجزء المراد فحصه</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="مثال: الصدر، البطن، الرأس" data-testid="input-body-part" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="findings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="ملاحظات إضافية" data-testid="input-findings" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={addRadiologyTestMutation.isPending}
                    data-testid="button-submit-radiology-test"
                  >
                    {addRadiologyTestMutation.isPending ? "جاري الحفظ..." : "حفظ الطلب"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي الطلبات
            </CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-radiology-tests">
              {radiologyTestsList.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              قيد الانتظار
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-radiology-tests">
              {pendingTests.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              قيد التنفيذ
            </CardTitle>
            <Radio className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-in-progress-radiology-tests">
              {inProgressTests.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              مكتملة
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-radiology-tests">
              {completedTests.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Radiology Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة طلبات الأشعة ({radiologyTestsList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المريض</TableHead>
                <TableHead>نوع الأشعة</TableHead>
                <TableHead>الجزء المفحوص</TableHead>
                <TableHead>الطبيب الطالب</TableHead>
                <TableHead>تاريخ الطلب</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {radiologyTestsList.map((test: any) => {
                const patient = patientsList.find((p: Patient) => p.id === test.patientId);
                const doctor = staffList.find((s: any) => s.id === test.doctorId);
                
                const testTypeLabels: Record<string, string> = {
                  "x-ray": "أشعة سينية",
                  "ct": "أشعة مقطعية",
                  "mri": "رنين مغناطيسي",
                  "ultrasound": "سونار",
                  "mammography": "ماموجرام",
                };
                
                return (
                  <TableRow key={test.id} data-testid={`row-radiology-test-${test.id}`}>
                    <TableCell data-testid={`cell-patient-${test.id}`}>
                      {patient ? `${patient.firstNameAr} ${patient.familyNameAr}` : "غير معروف"}
                    </TableCell>
                    <TableCell data-testid={`cell-test-type-${test.id}`}>
                      {testTypeLabels[test.testType] || test.testType}
                    </TableCell>
                    <TableCell data-testid={`cell-body-part-${test.id}`}>{test.bodyPart}</TableCell>
                    <TableCell data-testid={`cell-doctor-${test.id}`}>
                      {doctor ? `د. ${doctor.firstNameAr} ${doctor.familyNameAr}` : "غير معروف"}
                    </TableCell>
                    <TableCell data-testid={`cell-date-${test.id}`}>
                      {test.requestDate && format(new Date(test.requestDate), "dd/MM/yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell data-testid={`cell-status-${test.id}`}>{getStatusBadge(test.status)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
