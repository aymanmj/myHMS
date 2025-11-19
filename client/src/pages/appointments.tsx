import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAppointmentSchema, type Appointment, type InsertAppointment, type Patient, type User } from "@shared/schema";
import { Plus, Calendar as CalendarIcon, Clock, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const statusLabels: Record<string, string> = {
  scheduled: "محجوز",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغي",
  no_show: "لم يحضر",
};

export default function Appointments() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);

  const { data: appointments, isLoading, error } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: doctors } = useQuery<User[]>({
    queryKey: ["/api/users/doctors"],
  });

  const form = useForm<InsertAppointment>({
    resolver: zodResolver(insertAppointmentSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      appointmentDate: new Date(),
      specialty: "",
      duration: 30,
      status: "scheduled",
      reason: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل المواعيد",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertAppointment) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsDialogOpen(false);
      setEditingAppointment(null);
      form.reset();
      toast({
        title: "نجح",
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

  const updateMutation = useMutation({
    mutationFn: async (data: InsertAppointment & { id: string }) => {
      const { id, ...appointmentData } = data;
      const res = await apiRequest("PUT", `/api/appointments/${id}`, appointmentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsDialogOpen(false);
      setEditingAppointment(null);
      form.reset();
      toast({
        title: "نجح",
        description: "تم تحديث الموعد بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الموعد",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/appointments/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsDeleteDialogOpen(false);
      setDeletingAppointment(null);
      toast({
        title: "نجح",
        description: "تم حذف الموعد بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الموعد",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/appointments/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "نجح",
        description: "تم تحديث حالة الموعد بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة الموعد",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (appointment?: Appointment) => {
    if (appointment) {
      setEditingAppointment(appointment);
      form.reset({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentDate: new Date(appointment.appointmentDate),
        specialty: appointment.specialty,
        duration: appointment.duration,
        status: appointment.status as "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show",
        reason: appointment.reason || "",
        notes: appointment.notes || "",
      });
    } else {
      setEditingAppointment(null);
      form.reset({
        patientId: "",
        doctorId: "",
        appointmentDate: new Date(),
        specialty: "",
        duration: 30,
        status: "scheduled" as const,
        reason: "",
        notes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: InsertAppointment) => {
    if (editingAppointment) {
      updateMutation.mutate({ ...data, id: editingAppointment.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (appointment: Appointment) => {
    setDeletingAppointment(appointment);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingAppointment) {
      deleteMutation.mutate(deletingAppointment.id);
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة المواعيد</h1>
          <p className="text-muted-foreground">جدولة ومتابعة مواعيد المرضى</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-appointment">
          <Plus className="h-4 w-4 ml-2" />
          حجز موعد جديد
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المواعيد</CardTitle>
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
            <CardTitle className="text-sm font-medium">محجوزة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-scheduled-appointments">
              {appointments?.filter(a => a.status === "scheduled").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مكتملة</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-appointments">
              {appointments?.filter(a => a.status === "completed").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ملغية</CardTitle>
            <CalendarIcon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-cancelled-appointments">
              {appointments?.filter(a => a.status === "cancelled").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المواعيد ({appointments?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المريض</TableHead>
                <TableHead>الطبيب</TableHead>
                <TableHead>التخصص</TableHead>
                <TableHead>التاريخ والوقت</TableHead>
                <TableHead>المدة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments?.map(appointment => {
                const patient = patients?.find(p => p.id === appointment.patientId);
                const doctor = doctors?.find(u => u.id === appointment.doctorId);

                return (
                  <TableRow key={appointment.id} data-testid={`row-appointment-${appointment.id}`}>
                    <TableCell>
                      {patient ? `${patient.firstNameAr} ${patient.familyNameAr}` : "غير معروف"}
                    </TableCell>
                    <TableCell>
                      {doctor ? `د. ${doctor.firstName} ${doctor.lastName}` : "غير معروف"}
                    </TableCell>
                    <TableCell>{appointment.specialty}</TableCell>
                    <TableCell>
                      {format(new Date(appointment.appointmentDate), "dd/MM/yyyy HH:mm", { locale: ar })}
                    </TableCell>
                    <TableCell>{appointment.duration} دقيقة</TableCell>
                    <TableCell>
                      <Select
                        value={appointment.status}
                        onValueChange={(value) => updateStatusMutation.mutate({ id: appointment.id, status: value })}
                        data-testid={`select-status-${appointment.id}`}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue>
                            {statusLabels[appointment.status]}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">محجوز</SelectItem>
                          <SelectItem value="confirmed">مؤكد</SelectItem>
                          <SelectItem value="completed">مكتمل</SelectItem>
                          <SelectItem value="cancelled">ملغي</SelectItem>
                          <SelectItem value="no_show">لم يحضر</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(appointment)}
                          data-testid={`button-edit-appointment-${appointment.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(appointment)}
                          data-testid={`button-delete-appointment-${appointment.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? "تعديل موعد" : "حجز موعد جديد"}</DialogTitle>
            <DialogDescription>أدخل بيانات الموعد</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المريض</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-patient">
                          <SelectValue placeholder="اختر المريض" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients?.map(patient => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.firstNameAr} {patient.familyNameAr}
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-doctor">
                          <SelectValue placeholder="اختر الطبيب" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors?.map(doctor => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            د. {doctor.firstName} {doctor.lastName}
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
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التخصص</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="مثال: باطنية، أطفال، عظام" data-testid="input-specialty" />
                    </FormControl>
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
                      <FormLabel>التاريخ والوقت</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={
                            field.value && field.value instanceof Date && !isNaN(field.value.getTime())
                              ? format(field.value, "yyyy-MM-dd'T'HH:mm")
                              : ""
                          }
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            if (!isNaN(date.getTime())) {
                              field.onChange(date);
                            }
                          }}
                          data-testid="input-appointment-date"
                        />
                      </FormControl>
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
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سبب الزيارة</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="اكتب سبب الزيارة"
                        data-testid="input-reason"
                      />
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
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="ملاحظات إضافية"
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-appointment"
                >
                  {createMutation.isPending || updateMutation.isPending ? "جاري الحفظ..." : editingAppointment ? "تحديث" : "حجز"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
