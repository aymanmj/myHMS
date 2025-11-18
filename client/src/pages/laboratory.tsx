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
import { insertLabTestSchema, type InsertLabTest, type Patient } from "@shared/schema";
import { useState } from "react";
import { Plus, Beaker, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { usePermissions } from "@/hooks/usePermissions";

export default function Laboratory() {
  const { toast } = useToast();
  const { canCreate } = usePermissions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: labTests, isLoading } = useQuery({
    queryKey: ["/api/lab-tests"],
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: staff } = useQuery({
    queryKey: ["/api/staff"],
  });

  const addLabTestMutation = useMutation({
    mutationFn: async (data: InsertLabTest) => {
      return await apiRequest("POST", "/api/lab-tests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
      setIsAddDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم إضافة طلب التحليل بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة طلب التحليل",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertLabTest>({
    resolver: zodResolver(insertLabTestSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      testType: "",
      testName: "",
      status: "pending",
    },
  });

  const onSubmit = (data: InsertLabTest) => {
    addLabTestMutation.mutate(data);
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

  const labTestsList = Array.isArray(labTests) ? labTests : [];
  const patientsList = Array.isArray(patients) ? patients : [];
  const staffList = Array.isArray(staff) ? staff : [];
  
  const pendingTests = labTestsList.filter((test: any) => test.status === "pending");
  const inProgressTests = labTestsList.filter((test: any) => test.status === "in_progress");
  const completedTests = labTestsList.filter((test: any) => test.status === "completed");

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة المعامل والتحاليل</h1>
          <p className="text-muted-foreground">طلبات التحاليل والنتائج الطبية</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          {canCreate("labTests") && (
            <DialogTrigger asChild>
              <Button data-testid="button-add-lab-test">
                <Plus className="h-4 w-4 ml-2" />
                طلب تحليل جديد
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>طلب تحليل جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات طلب التحليل
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
                        <FormLabel>نوع التحليل</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-test-type">
                              <SelectValue placeholder="اختر نوع التحليل" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="blood">تحليل دم</SelectItem>
                            <SelectItem value="urine">تحليل بول</SelectItem>
                            <SelectItem value="stool">تحليل براز</SelectItem>
                            <SelectItem value="microbiology">تحليل ميكروبيولوجي</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="testName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم التحليل</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="مثال: صورة دم كاملة CBC" data-testid="input-test-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="resultNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="ملاحظات إضافية" data-testid="input-notes" />
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
                    disabled={addLabTestMutation.isPending}
                    data-testid="button-submit-lab-test"
                  >
                    {addLabTestMutation.isPending ? "جاري الحفظ..." : "حفظ الطلب"}
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
              إجمالي التحاليل
            </CardTitle>
            <Beaker className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-tests">
              {labTestsList.length}
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
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-tests">
              {pendingTests.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              قيد التنفيذ
            </CardTitle>
            <Beaker className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-in-progress-tests">
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
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-tests">
              {completedTests.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lab Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة طلبات التحاليل ({labTestsList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المريض</TableHead>
                <TableHead>نوع التحليل</TableHead>
                <TableHead>اسم التحليل</TableHead>
                <TableHead>الطبيب الطالب</TableHead>
                <TableHead>تاريخ الطلب</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labTestsList.map((test: any) => {
                const patient = patientsList.find((p: Patient) => p.id === test.patientId);
                const doctor = staffList.find((s: any) => s.id === test.doctorId);
                
                return (
                  <TableRow key={test.id} data-testid={`row-lab-test-${test.id}`}>
                    <TableCell data-testid={`cell-patient-${test.id}`}>
                      {patient ? `${patient.firstNameAr} ${patient.familyNameAr}` : "غير معروف"}
                    </TableCell>
                    <TableCell data-testid={`cell-test-type-${test.id}`}>
                      {test.testType === "blood" && "دم"}
                      {test.testType === "urine" && "بول"}
                      {test.testType === "stool" && "براز"}
                      {test.testType === "microbiology" && "ميكروبيولوجي"}
                    </TableCell>
                    <TableCell data-testid={`cell-test-name-${test.id}`}>{test.testName}</TableCell>
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
