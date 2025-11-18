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
import { insertAdmissionSchema, type InsertAdmission, type Patient } from "@shared/schema";
import { useState } from "react";
import { Plus, Bed as BedIcon, Activity, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { usePermissions } from "@/hooks/usePermissions";

export default function Admissions() {
  const { toast } = useToast();
  const { canCreate } = usePermissions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: admissions, isLoading } = useQuery({
    queryKey: ["/api/admissions"],
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: beds } = useQuery({
    queryKey: ["/api/beds"],
  });

  const { data: staff } = useQuery({
    queryKey: ["/api/staff"],
  });

  const addAdmissionMutation = useMutation({
    mutationFn: async (data: InsertAdmission) => {
      return await apiRequest("POST", "/api/admissions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/beds"] });
      setIsAddDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم تنويم المريض بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تنويم المريض",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertAdmission>({
    resolver: zodResolver(insertAdmissionSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      reason: "",
      status: "active",
      notes: "",
    },
  });

  const onSubmit = (data: InsertAdmission) => {
    addAdmissionMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "نشط", variant: "default" },
      discharged: { label: "مخرج", variant: "secondary" },
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

  const admissionsList = Array.isArray(admissions) ? admissions : [];
  const bedsList = Array.isArray(beds) ? beds : [];
  const patientsList = Array.isArray(patients) ? patients : [];
  const staffList = Array.isArray(staff) ? staff : [];
  
  const availableBeds = bedsList.filter((bed: any) => bed.status === "available");
  const occupiedBeds = bedsList.filter((bed: any) => bed.status === "occupied");
  const activeAdmissions = admissionsList.filter((adm: any) => adm.status === "active");

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة التنويم</h1>
          <p className="text-muted-foreground">تنويم المرضى وإدارة الأسرة</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          {canCreate("admissions") && (
            <DialogTrigger asChild>
              <Button data-testid="button-add-admission">
                <Plus className="h-4 w-4 ml-2" />
                تنويم مريض جديد
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>تنويم مريض جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات التنويم
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  name="bedId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السرير ({availableBeds.length} متاح)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-bed">
                            <SelectValue placeholder="اختر السرير" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableBeds.map((bed: any) => (
                            <SelectItem key={bed.id} value={bed.id}>
                              {bed.bedNumber} - {bed.roomNumber || bed.ward}
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
                      <FormLabel>الطبيب المعالج</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-doctor">
                            <SelectValue placeholder="اختر الطبيب" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {staffList.filter((s: any) => s.role === "doctor").map((doctor: any) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              د. {doctor.firstNameAr} {doctor.familyNameAr} - {doctor.specialization}
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
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سبب التنويم</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="سبب دخول المستشفى" data-testid="input-reason" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التشخيص</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="التشخيص الأولي" data-testid="input-diagnosis" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-notes" />
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
                    disabled={addAdmissionMutation.isPending}
                    data-testid="button-submit-admission"
                  >
                    {addAdmissionMutation.isPending ? "جاري الحفظ..." : "تنويم المريض"}
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
              إجمالي الأسرة
            </CardTitle>
            <BedIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-beds">
              {bedsList.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              أسرة متاحة
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-available-beds">
              {availableBeds.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              أسرة مشغولة
            </CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-occupied-beds">
              {occupiedBeds.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              حالات نشطة
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-admissions">
              {activeAdmissions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة حالات التنويم ({admissionsList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المريض</TableHead>
                <TableHead>السرير</TableHead>
                <TableHead>الطبيب المعالج</TableHead>
                <TableHead>تاريخ التنويم</TableHead>
                <TableHead>السبب</TableHead>
                <TableHead>التشخيص</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissionsList.map((admission: any) => {
                const patient = patientsList.find((p: Patient) => p.id === admission.patientId);
                const bed = bedsList.find((b: any) => b.id === admission.bedId);
                const doctor = staffList.find((s: any) => s.id === admission.doctorId);
                
                return (
                  <TableRow key={admission.id} data-testid={`row-admission-${admission.id}`}>
                    <TableCell data-testid={`cell-patient-${admission.id}`}>
                      {patient ? `${patient.firstNameAr} ${patient.familyNameAr}` : "غير معروف"}
                    </TableCell>
                    <TableCell data-testid={`cell-bed-${admission.id}`}>
                      {bed ? `${bed.bedNumber} - ${bed.roomNumber || bed.ward}` : "غير محدد"}
                    </TableCell>
                    <TableCell data-testid={`cell-doctor-${admission.id}`}>
                      {doctor ? `د. ${doctor.firstNameAr} ${doctor.familyNameAr}` : "غير معروف"}
                    </TableCell>
                    <TableCell data-testid={`cell-date-${admission.id}`}>
                      {admission.admissionDate && format(new Date(admission.admissionDate), "dd/MM/yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell data-testid={`cell-reason-${admission.id}`}>{admission.reason}</TableCell>
                    <TableCell data-testid={`cell-diagnosis-${admission.id}`}>{admission.diagnosis || "-"}</TableCell>
                    <TableCell data-testid={`cell-status-${admission.id}`}>{getStatusBadge(admission.status)}</TableCell>
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
