import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMedicationSchema, type Medication, type InsertMedication } from "@shared/schema";
import { useState, useEffect } from "react";
import { Plus, AlertTriangle, Package, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { usePermissions } from "@/hooks/usePermissions";

export default function Pharmacy() {
  const { toast } = useToast();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [deletingMedicationId, setDeletingMedicationId] = useState<string | null>(null);

  const { data: medications, isLoading } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const { data: lowStockMeds } = useQuery<Medication[]>({
    queryKey: ["/api/medications/low-stock"],
  });

  const { data: expiringMeds } = useQuery<Medication[]>({
    queryKey: ["/api/medications/expiring"],
  });

  const addMedicationMutation = useMutation({
    mutationFn: async (data: InsertMedication) => {
      return await apiRequest("POST", "/api/medications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/expiring"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الدواء بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة الدواء",
        variant: "destructive",
      });
    },
  });

  const editMedicationMutation = useMutation({
    mutationFn: async ({ id, medication }: { id: string; medication: Partial<InsertMedication> }) => {
      return await apiRequest("PUT", `/api/medications/${id}`, medication);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/expiring"] });
      setIsEditDialogOpen(false);
      setEditingMedication(null);
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الدواء بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الدواء",
        variant: "destructive",
      });
    },
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/medications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/expiring"] });
      setDeletingMedicationId(null);
      toast({
        title: "تم بنجاح",
        description: "تم حذف الدواء بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الدواء",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertMedication>({
    resolver: zodResolver(insertMedicationSchema),
    defaultValues: {
      name: "",
      genericName: "",
      barcode: "",
      category: "",
      manufacturer: "",
      unitPrice: "0",
      stockQuantity: 0,
      minStockLevel: 10,
      expiryDate: "",
    },
  });

  const editForm = useForm<InsertMedication>({
    resolver: zodResolver(insertMedicationSchema),
    defaultValues: {
      name: "",
      genericName: "",
      barcode: "",
      category: "",
      manufacturer: "",
      unitPrice: "0",
      stockQuantity: 0,
      minStockLevel: 10,
      expiryDate: "",
    },
  });

  useEffect(() => {
    if (editingMedication) {
      editForm.reset({
        name: editingMedication.name,
        genericName: editingMedication.genericName || "",
        barcode: editingMedication.barcode || "",
        category: editingMedication.category || "",
        manufacturer: editingMedication.manufacturer || "",
        unitPrice: editingMedication.unitPrice,
        stockQuantity: editingMedication.stockQuantity,
        minStockLevel: editingMedication.minStockLevel,
        expiryDate: editingMedication.expiryDate || "",
      });
    }
  }, [editingMedication]);

  const onSubmit = (data: InsertMedication) => {
    addMedicationMutation.mutate(data);
  };

  const onEditSubmit = (data: InsertMedication) => {
    if (!editingMedication) return;
    
    const cleanedData = {
      ...data,
      unitPrice: String(data.unitPrice),
      stockQuantity: parseInt(String(data.stockQuantity)) || 0,
      minStockLevel: parseInt(String(data.minStockLevel)) || 0,
    };
    
    editMedicationMutation.mutate({
      id: editingMedication.id,
      medication: cleanedData,
    });
  };

  const handleDelete = () => {
    if (!deletingMedicationId) return;
    deleteMedicationMutation.mutate(deletingMedicationId);
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
          <h1 className="text-3xl font-bold">إدارة الصيدلية</h1>
          <p className="text-muted-foreground">إدارة المخزون والوصفات الطبية</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          {canCreate("medications") && (
            <DialogTrigger asChild>
              <Button data-testid="button-add-medication">
                <Plus className="h-4 w-4 ml-2" />
                إضافة دواء جديد
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة دواء جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات الدواء الكاملة
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الدواء</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="genericName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم العلمي</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-generic-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الباركود</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-barcode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>التصنيف</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="مثال: مسكنات" data-testid="input-category" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الشركة المصنعة</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-manufacturer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الكمية المتوفرة</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-stock-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="minStockLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحد الأدنى للمخزون</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-min-stock"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>السعر (ريال)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-unit-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ انتهاء الصلاحية</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} data-testid="input-expiry-date" />
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
                    disabled={addMedicationMutation.isPending}
                    data-testid="button-submit-medication"
                  >
                    {addMedicationMutation.isPending ? "جاري الحفظ..." : "حفظ"}
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
              إجمالي الأدوية
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-medications">
              {medications?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              صنف دوائي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              مخزون منخفض
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-low-stock-medications">
              {lowStockMeds?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              يحتاج إعادة طلب
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              قريبة الانتهاء
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-expiring-medications">
              {expiringMeds?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              خلال 30 يوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              القيمة الإجمالية
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-value">
              {medications?.reduce((acc: number, med: Medication) => {
                return acc + (med.stockQuantity * parseFloat(med.unitPrice));
              }, 0).toLocaleString('ar-SA', { maximumFractionDigits: 2 }) || 0} ر.س
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medications Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأدوية ({medications?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الباركود</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>انتهاء الصلاحية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications?.map((medication: Medication) => {
                const isLowStock = medication.stockQuantity <= medication.minStockLevel;
                const isExpiring = medication.expiryDate && new Date(medication.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                
                return (
                  <TableRow key={medication.id} data-testid={`row-medication-${medication.id}`}>
                    <TableCell className="font-mono">{medication.barcode}</TableCell>
                    <TableCell>
                      <div className="font-medium">{medication.name}</div>
                      {medication.genericName && (
                        <div className="text-sm text-muted-foreground">{medication.genericName}</div>
                      )}
                    </TableCell>
                    <TableCell>{medication.category}</TableCell>
                    <TableCell>
                      <div className={isLowStock ? "text-destructive font-semibold" : ""}>
                        {medication.stockQuantity}
                      </div>
                    </TableCell>
                    <TableCell>{medication.unitPrice} ر.س</TableCell>
                    <TableCell className={isExpiring ? "text-destructive" : ""}>
                      {medication.expiryDate ? format(new Date(medication.expiryDate), "dd/MM/yyyy", { locale: ar }) : "-"}
                    </TableCell>
                    <TableCell>
                      {isLowStock && <Badge variant="destructive">مخزون منخفض</Badge>}
                      {isExpiring && <Badge variant="destructive">قريب الانتهاء</Badge>}
                      {!isLowStock && !isExpiring && <Badge variant="secondary">متوفر</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canUpdate("medications") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingMedication(medication);
                              setIsEditDialogOpen(true);
                            }}
                            data-testid={`button-edit-${medication.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete("medications") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingMedicationId(medication.id)}
                            data-testid={`button-delete-${medication.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Medication Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل دواء</DialogTitle>
            <DialogDescription>
              تحديث بيانات الدواء
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الدواء</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="edit-input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="genericName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم العلمي</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="edit-input-generic-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الباركود</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="edit-input-barcode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التصنيف</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="edit-input-category" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الشركة المصنعة</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="edit-input-manufacturer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكمية المتوفرة</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="edit-input-stock-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="minStockLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحد الأدنى للمخزون</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="edit-input-min-stock"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر (ريال)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="edit-input-unit-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ انتهاء الصلاحية</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} data-testid="edit-input-expiry-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingMedication(null);
                  }}
                  data-testid="edit-button-cancel"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={editMedicationMutation.isPending}
                  data-testid="edit-button-submit"
                >
                  {editMedicationMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMedicationId} onOpenChange={(open) => !open && setDeletingMedicationId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الدواء؟ لا يمكن التراجع عن هذا الإجراء.
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
