import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMedicationSchema, type Medication, type InsertMedication } from "@shared/schema";
import { useState } from "react";
import { Plus, AlertTriangle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Pharmacy() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: medications, isLoading } = useQuery({
    queryKey: ["/api/medications"],
  });

  const { data: lowStockMeds } = useQuery({
    queryKey: ["/api/medications/low-stock"],
  });

  const { data: expiringMeds } = useQuery({
    queryKey: ["/api/medications/expiring"],
  });

  const addMedicationMutation = useMutation({
    mutationFn: async (data: InsertMedication) => {
      return await apiRequest("/api/medications", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/low-stock"] });
      setIsAddDialogOpen(false);
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

  const form = useForm<InsertMedication>({
    resolver: zodResolver(insertMedicationSchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
      genericName: "",
      barcode: "",
      category: "",
      manufacturer: "",
      dosageForm: "",
      strength: "",
      stockQuantity: 0,
      minStockLevel: 10,
      unitPrice: "0",
      expiryDate: "",
      batchNumber: "",
      storageConditions: "",
      requiresPrescription: true,
      notes: "",
    },
  });

  const onSubmit = (data: InsertMedication) => {
    addMedicationMutation.mutate(data);
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
          <DialogTrigger asChild>
            <Button data-testid="button-add-medication">
              <Plus className="h-4 w-4 ml-2" />
              إضافة دواء جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة دواء جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات الدواء الكاملة
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nameAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم بالعربية</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-name-ar" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم بالإنجليزية</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-name-en" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          <Input {...field} data-testid="input-barcode" />
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
                          <Input {...field} placeholder="مثال: مسكنات" data-testid="input-category" />
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
                          <Input {...field} data-testid="input-manufacturer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dosageForm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الشكل الدوائي</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="أقراص، شراب، حقن" data-testid="input-dosage-form" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="strength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>التركيز</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="500mg" data-testid="input-strength" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="batchNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الدفعة</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-batch-number" />
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
                        <Input type="date" {...field} data-testid="input-expiry-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storageConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ظروف التخزين</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="درجة حرارة الغرفة" data-testid="input-storage" />
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
                <TableHead>الشكل الدوائي</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>انتهاء الصلاحية</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications?.map((medication: Medication) => {
                const isLowStock = medication.stockQuantity <= medication.minStockLevel;
                const isExpiring = new Date(medication.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                
                return (
                  <TableRow key={medication.id} data-testid={`row-medication-${medication.id}`}>
                    <TableCell className="font-mono">{medication.barcode}</TableCell>
                    <TableCell>
                      <div className="font-medium">{medication.nameAr}</div>
                      <div className="text-sm text-muted-foreground">{medication.nameEn}</div>
                    </TableCell>
                    <TableCell>{medication.category}</TableCell>
                    <TableCell>
                      {medication.dosageForm} {medication.strength}
                    </TableCell>
                    <TableCell>
                      <div className={isLowStock ? "text-destructive font-semibold" : ""}>
                        {medication.stockQuantity}
                      </div>
                    </TableCell>
                    <TableCell>{medication.unitPrice} ر.س</TableCell>
                    <TableCell className={isExpiring ? "text-destructive" : ""}>
                      {format(new Date(medication.expiryDate), "dd/MM/yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell>
                      {isLowStock && <Badge variant="destructive">مخزون منخفض</Badge>}
                      {isExpiring && <Badge variant="destructive">قريب الانتهاء</Badge>}
                      {!isLowStock && !isExpiring && <Badge variant="secondary">متوفر</Badge>}
                    </TableCell>
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
