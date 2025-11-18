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
import { insertSurgerySchema, type InsertSurgery, type Patient } from "@shared/schema";
import { useState } from "react";
import { Plus, Scissors, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Surgeries() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: surgeries, isLoading } = useQuery({
    queryKey: ["/api/surgeries"],
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: staff } = useQuery({
    queryKey: ["/api/staff"],
  });

  const addSurgeryMutation = useMutation({
    mutationFn: async (data: InsertSurgery) => {
      return await apiRequest("POST", "/api/surgeries", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surgeries"] });
      setIsAddDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم إضافة العملية الجراحية بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة العملية",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertSurgery>({
    resolver: zodResolver(insertSurgerySchema),
    defaultValues: {
      patientId: "",
      surgeonId: "",
      surgeryType: "",
      operatingRoom: "",
      description: "",
      status: "scheduled",
    },
  });

  const onSubmit = (data: InsertSurgery) => {
    addSurgeryMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      scheduled: { label: "مجدولة", variant: "default" },
      in_progress: { label: "جارية", variant: "default" },
      completed: { label: "مكتملة", variant: "secondary" },
      cancelled: { label: "ملغية", variant: "destructive" },
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

  const surgeriesList = Array.isArray(surgeries) ? surgeries : [];
  const patientsList = Array.isArray(patients) ? patients : [];
  const staffList = Array.isArray(staff) ? staff : [];
  
  const scheduledSurgeries = surgeriesList.filter((s: any) => s.status === "scheduled");
  const completedSurgeries = surgeriesList.filter((s: any) => s.status === "completed");
  const surgeons = staffList.filter((s: any) => s.role === "doctor");

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة العمليات الجراحية</h1>
          <p className="text-muted-foreground">جدولة ومتابعة العمليات الجراحية</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-surgery">
              <Plus className="h-4 w-4 ml-2" />
              إضافة عملية جراحية
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>عملية جراحية جديدة</DialogTitle>
              <DialogDescription>
                أدخل بيانات العملية الجراحية
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
                    name="surgeonId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الجراح الرئيسي</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-surgeon">
                              <SelectValue placeholder="اختر الجراح" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {surgeons.map((surgeon: any) => (
                              <SelectItem key={surgeon.id} value={surgeon.id}>
                                د. {surgeon.firstNameAr} {surgeon.familyNameAr} - {surgeon.specialization}
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
                    name="surgeryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع العملية</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="مثال: استئصال الزائدة" data-testid="input-surgery-type" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operatingRoom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>غرفة العمليات</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="مثال: غرفة 1" data-testid="input-operating-room" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="تفاصيل العملية" data-testid="input-description" />
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
                    disabled={addSurgeryMutation.isPending}
                    data-testid="button-submit-surgery"
                  >
                    {addSurgeryMutation.isPending ? "جاري الحفظ..." : "حفظ العملية"}
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
              إجمالي العمليات
            </CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-surgeries">
              {surgeriesList.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              عمليات مجدولة
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-scheduled-surgeries">
              {scheduledSurgeries.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              عمليات مكتملة
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-surgeries">
              {completedSurgeries.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              جراحون متاحون
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-available-surgeons">
              {surgeons.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Surgeries Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العمليات الجراحية ({surgeriesList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المريض</TableHead>
                <TableHead>نوع العملية</TableHead>
                <TableHead>الجراح</TableHead>
                <TableHead>غرفة العمليات</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surgeriesList.map((surgery: any) => {
                const patient = patientsList.find((p: Patient) => p.id === surgery.patientId);
                const surgeon = staffList.find((s: any) => s.id === surgery.surgeonId);
                
                return (
                  <TableRow key={surgery.id} data-testid={`row-surgery-${surgery.id}`}>
                    <TableCell data-testid={`cell-patient-${surgery.id}`}>
                      {patient ? `${patient.firstNameAr} ${patient.familyNameAr}` : "غير معروف"}
                    </TableCell>
                    <TableCell data-testid={`cell-type-${surgery.id}`}>{surgery.surgeryType}</TableCell>
                    <TableCell data-testid={`cell-surgeon-${surgery.id}`}>
                      {surgeon ? `د. ${surgeon.firstNameAr} ${surgeon.familyNameAr}` : "غير معروف"}
                    </TableCell>
                    <TableCell data-testid={`cell-room-${surgery.id}`}>{surgery.operatingRoom}</TableCell>
                    <TableCell data-testid={`cell-date-${surgery.id}`}>
                      {surgery.surgeryDate && format(new Date(surgery.surgeryDate), "dd/MM/yyyy HH:mm", { locale: ar })}
                    </TableCell>
                    <TableCell data-testid={`cell-status-${surgery.id}`}>{getStatusBadge(surgery.status)}</TableCell>
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
