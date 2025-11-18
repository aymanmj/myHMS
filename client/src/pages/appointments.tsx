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
import { insertAppointmentSchema, type Appointment, type InsertAppointment, type Patient } from "@shared/schema";
import { useState } from "react";
import { Plus, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Appointments() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["/api/appointments"],
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: staff } = useQuery({
    queryKey: ["/api/staff"],
  });

  const addAppointmentMutation = useMutation({
    mutationFn: async (data: InsertAppointment) => {
      return await apiRequest("/api/appointments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsAddDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم حجز الموعد بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حجز الموعد",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertAppointment>({
    resolver: zodResolver(insertAppointmentSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      appointmentDate: "",
      appointmentTime: "",
      duration: 30,
      appointmentType: "consultation",
      status: "scheduled",
      notes: "",
    },
  });

  const onSubmit = (data: InsertAppointment) => {
    addAppointmentMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      scheduled: { label: "محجوز", variant: "default" },
      confirmed: { label: "مؤكد", variant: "secondary" },
      in_progress: { label: "جاري", variant: "outline" },
      completed: { label: "مكتمل", variant: "secondary" },
      cancelled: { label: "ملغي", variant: "destructive" },
      no_show: { label: "لم يحضر", variant: "destructive" },
    };
    const { label, variant } = statusMap[status] || { label: status, variant: "default" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      consultation: "استشارة",
      follow_up: "متابعة",
      emergency: "طوارئ",
      procedure: "إجراء",
    };
    return <Badge variant="outline">{typeMap[type] || type}</Badge>;
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

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة المواعيد</h1>
          <p className="text-muted-foreground">جدولة ومتابعة مواعيد المرضى</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-appointment">
              <Plus className="h-4 w-4 ml-2" />
              حجز موعد جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>حجز موعد جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات الموعد
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
                          {patients?.map((patient: Patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.firstNameAr} {patient.familyNameAr} - {patient.fileNumber}
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
                      <FormLabel>الطبيب</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-doctor">
                            <SelectValue placeholder="اختر الطبيب" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {staff?.filter((s: any) => s.role === "doctor").map((doctor: any) => (
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>التاريخ</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-appointment-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="appointmentTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوقت</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-appointment-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="appointmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع الموعد</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-appointment-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="consultation">استشارة</SelectItem>
                            <SelectItem value="follow_up">متابعة</SelectItem>
                            <SelectItem value="emergency">طوارئ</SelectItem>
                            <SelectItem value="procedure">إجراء</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المدة (دقيقة)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
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
                    disabled={addAppointmentMutation.isPending}
                    data-testid="button-submit-appointment"
                  >
                    {addAppointmentMutation.isPending ? "جاري الحفظ..." : "حجز الموعد"}
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
              إجمالي المواعيد
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-appointments">
              {appointments?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              محجوزة
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-scheduled-appointments">
              {appointments?.filter((a: Appointment) => a.status === "scheduled").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              مكتملة
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-appointments">
              {appointments?.filter((a: Appointment) => a.status === "completed").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              ملغية
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-cancelled-appointments">
              {appointments?.filter((a: Appointment) => a.status === "cancelled").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المواعيد ({appointments?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الموعد</TableHead>
                <TableHead>المريض</TableHead>
                <TableHead>الطبيب</TableHead>
                <TableHead>التاريخ والوقت</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المدة</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments?.map((appointment: Appointment) => {
                const patient = patients?.find((p: Patient) => p.id === appointment.patientId);
                const doctor = staff?.find((s: any) => s.id === appointment.doctorId);
                
                return (
                  <TableRow key={appointment.id} data-testid={`row-appointment-${appointment.id}`}>
                    <TableCell>{appointment.appointmentNumber}</TableCell>
                    <TableCell>
                      {patient ? `${patient.firstNameAr} ${patient.familyNameAr}` : "غير معروف"}
                    </TableCell>
                    <TableCell>
                      {doctor ? `د. ${doctor.firstNameAr} ${doctor.familyNameAr}` : "غير معروف"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{format(new Date(appointment.appointmentDate), "dd/MM/yyyy", { locale: ar })}</div>
                        <div className="text-sm text-muted-foreground">{appointment.appointmentTime}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(appointment.appointmentType)}</TableCell>
                    <TableCell>{appointment.duration} دقيقة</TableCell>
                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
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
