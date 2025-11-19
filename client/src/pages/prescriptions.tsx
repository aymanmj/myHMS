import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { usePermissions } from "@/hooks/usePermissions";
import { insertPrescriptionSchema, type InsertPrescription, type Prescription, type Patient, type Medication } from "@shared/schema";
import { Plus, Trash2, Pill, FileText, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const medicationItemSchema = z.object({
  medicationId: z.string().min(1, "يجب اختيار الدواء"),
  medicationName: z.string().min(1, "اسم الدواء مطلوب"),
  dosage: z.string().min(1, "الجرعة مطلوبة"),
  frequency: z.string().min(1, "التكرار مطلوب"),
  duration: z.string().min(1, "المدة مطلوبة"),
});

const prescriptionFormSchema = insertPrescriptionSchema.extend({
  medications: z.array(medicationItemSchema).min(1, "يجب إضافة دواء واحد على الأقل"),
});

type PrescriptionFormData = z.infer<typeof prescriptionFormSchema>;

export default function Prescriptions() {
  const { toast } = useToast();
  const { canCreate, canDelete } = usePermissions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDialogFirstOpen, setIsDialogFirstOpen] = useState(true);
  const [deletingPrescriptionId, setDeletingPrescriptionId] = useState<string | null>(null);

  const { data: prescriptions, isLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: medications } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const form = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      medications: [],
      instructions: "",
      status: "pending",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications",
  });
  
  const handleDialogOpen = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (open && fields.length === 0) {
      append({ medicationId: "", medicationName: "", dosage: "", frequency: "", duration: "" });
    }
    if (!open) {
      form.reset();
    }
  };

  const addPrescriptionMutation = useMutation({
    mutationFn: async (data: PrescriptionFormData) => {
      return await apiRequest("POST", "/api/prescriptions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الوصفة الطبية بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة الوصفة",
        variant: "destructive",
      });
    },
  });

  const deletePrescriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/prescriptions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      setDeletingPrescriptionId(null);
      toast({
        title: "تم بنجاح",
        description: "تم حذف الوصفة الطبية بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الوصفة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PrescriptionFormData) => {
    addPrescriptionMutation.mutate(data);
  };

  const handleDelete = () => {
    if (!deletingPrescriptionId) return;
    deletePrescriptionMutation.mutate(deletingPrescriptionId);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      pending: { label: "قيد الانتظار", variant: "default" },
      dispensed: { label: "تم الصرف", variant: "secondary" },
      cancelled: { label: "ملغية", variant: "destructive" },
    };
    const { label, variant} = statusMap[status] || { label: status, variant: "default" as const };
    return <Badge variant={variant} data-testid={`badge-status-${status}`}>{label}</Badge>;
  };

  const getPatientName = (patientId: string) => {
    const patient = patients?.find((p) => p.id === patientId);
    if (!patient) return "غير معروف";
    return `${patient.firstNameAr} ${patient.fatherNameAr} ${patient.familyNameAr}`;
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

  const prescriptionsList = Array.isArray(prescriptions) ? prescriptions : [];
  const pendingCount = prescriptionsList.filter((p) => p.status === "pending").length;
  const dispensedCount = prescriptionsList.filter((p) => p.status === "dispensed").length;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الوصفات الطبية</h1>
          <p className="text-muted-foreground">إدارة الوصفات الطبية والروشتات</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpen}>
          {canCreate("prescriptions") && (
            <DialogTrigger asChild>
              <Button data-testid="button-add-prescription">
                <Plus className="ml-2 h-4 w-4" />
                إضافة وصفة طبية
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة وصفة طبية جديدة</DialogTitle>
              <DialogDescription>قم بملء بيانات الوصفة الطبية والأدوية</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
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
                            {patients?.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.firstNameAr} {patient.fatherNameAr} {patient.familyNameAr}
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
                        <FormControl>
                          <Input {...field} placeholder="معرف الطبيب" data-testid="input-doctor-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">الأدوية</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ medicationId: "", medicationName: "", dosage: "", frequency: "", duration: "" })}
                      data-testid="button-add-medication-item"
                    >
                      <Plus className="ml-1 h-3 w-3" />
                      إضافة دواء
                    </Button>
                  </div>

                  {fields.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>لم يتم إضافة أي دواء بعد</p>
                      <p className="text-sm">انقر على "إضافة دواء" لإضافة الأدوية</p>
                    </div>
                  )}

                  {fields.map((field, index) => (
                    <Card key={field.id}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-4 gap-4 items-end">
                          <FormField
                            control={form.control}
                            name={`medications.${index}.medicationId`}
                            render={({ field: medField }) => (
                              <FormItem>
                                <FormLabel>الدواء</FormLabel>
                                <Select
                                  value={medField.value}
                                  onValueChange={(value) => {
                                    const selectedMed = medications?.find((m) => m.id === value);
                                    medField.onChange(value);
                                    if (selectedMed) {
                                      form.setValue(`medications.${index}.medicationName`, selectedMed.name);
                                    }
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-medication-${index}`}>
                                      <SelectValue placeholder="اختر الدواء" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {medications?.map((med) => (
                                      <SelectItem key={med.id} value={med.id}>
                                        {med.name}
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
                            name={`medications.${index}.medicationName`}
                            render={({ field }) => (
                              <FormControl>
                                <input type="hidden" {...field} />
                              </FormControl>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`medications.${index}.dosage`}
                            render={({ field: dosageField }) => (
                              <FormItem>
                                <FormLabel>الجرعة</FormLabel>
                                <FormControl>
                                  <Input {...dosageField} placeholder="مثال: حبة واحدة" data-testid={`input-dosage-${index}`} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`medications.${index}.frequency`}
                            render={({ field: freqField }) => (
                              <FormItem>
                                <FormLabel>التكرار</FormLabel>
                                <FormControl>
                                  <Input {...freqField} placeholder="مثال: 3 مرات يومياً" data-testid={`input-frequency-${index}`} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`medications.${index}.duration`}
                            render={({ field: durationField }) => (
                              <FormItem>
                                <FormLabel>المدة</FormLabel>
                                <div className="flex gap-2">
                                  <FormControl>
                                    <Input {...durationField} placeholder="مثال: 7 أيام" data-testid={`input-duration-${index}`} />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    data-testid={`button-remove-medication-${index}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التعليمات</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="تعليمات إضافية للمريض..."
                          rows={3}
                          data-testid="textarea-instructions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={addPrescriptionMutation.isPending} data-testid="button-submit-prescription">
                    {addPrescriptionMutation.isPending ? "جاري الحفظ..." : "حفظ الوصفة"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الوصفات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-prescriptions">{prescriptionsList.length}</div>
            <p className="text-xs text-muted-foreground">جميع الوصفات المسجلة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-prescriptions">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">في انتظار الصرف</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تم الصرف</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-dispensed-prescriptions">{dispensedCount}</div>
            <p className="text-xs text-muted-foreground">وصفات تم صرفها</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الوصفات الطبية</CardTitle>
          <CardDescription>جميع الوصفات الطبية المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المريض</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>عدد الأدوية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التعليمات</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptionsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    لا توجد وصفات طبية مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                prescriptionsList.map((prescription) => {
                  const medsArray = Array.isArray(prescription.medications) ? prescription.medications : [];
                  return (
                    <TableRow key={prescription.id} data-testid={`row-prescription-${prescription.id}`}>
                      <TableCell data-testid={`cell-patient-${prescription.id}`}>
                        {getPatientName(prescription.patientId)}
                      </TableCell>
                      <TableCell data-testid={`cell-date-${prescription.id}`}>
                        {prescription.prescriptionDate
                          ? format(new Date(prescription.prescriptionDate), "dd/MM/yyyy", { locale: ar })
                          : "-"}
                      </TableCell>
                      <TableCell data-testid={`cell-medications-count-${prescription.id}`}>
                        <Badge variant="outline">{medsArray.length} دواء</Badge>
                      </TableCell>
                      <TableCell data-testid={`cell-status-${prescription.id}`}>{getStatusBadge(prescription.status)}</TableCell>
                      <TableCell className="max-w-xs truncate" data-testid={`cell-instructions-${prescription.id}`}>
                        {prescription.instructions || "-"}
                      </TableCell>
                      <TableCell>
                        {canDelete("prescriptions") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingPrescriptionId(prescription.id)}
                            data-testid={`button-delete-${prescription.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPrescriptionId} onOpenChange={(open) => !open && setDeletingPrescriptionId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الوصفة الطبية؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-button-cancel">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="delete-button-confirm"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
