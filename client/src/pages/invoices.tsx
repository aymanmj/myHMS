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
import { insertInvoiceSchema, type InsertInvoice, type Patient } from "@shared/schema";
import { useState } from "react";
import { Plus, DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { usePermissions } from "@/hooks/usePermissions";

export default function Invoices() {
  const { toast } = useToast();
  const { canCreate } = usePermissions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const addInvoiceMutation = useMutation({
    mutationFn: async (data: InsertInvoice) => {
      return await apiRequest("POST", "/api/invoices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsAddDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الفاتورة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء الفاتورة",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      patientId: "",
      services: [],
      subtotal: "0",
      tax: "0",
      discount: "0",
      total: "0",
      amountPaid: "0",
      paymentStatus: "pending",
      notes: "",
    },
  });

  const onSubmit = (data: InsertInvoice) => {
    addInvoiceMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "معلقة", variant: "outline" },
      paid: { label: "مدفوعة", variant: "secondary" },
      partially_paid: { label: "مدفوعة جزئياً", variant: "default" },
      overdue: { label: "متأخرة", variant: "destructive" },
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

  const invoiceList = Array.isArray(invoices) ? invoices : [];
  const totalRevenue = invoiceList.reduce((acc: number, inv: any) => acc + parseFloat(inv.total || "0"), 0);
  const paidRevenue = invoiceList.reduce((acc: number, inv: any) => acc + parseFloat(inv.amountPaid || "0"), 0);
  const pendingRevenue = invoiceList.filter((inv: any) => inv.paymentStatus === "pending").reduce((acc: number, inv: any) => acc + (parseFloat(inv.total || "0") - parseFloat(inv.amountPaid || "0")), 0);
  const overdueRevenue = invoiceList.filter((inv: any) => inv.paymentStatus === "overdue").reduce((acc: number, inv: any) => acc + (parseFloat(inv.total || "0") - parseFloat(inv.amountPaid || "0")), 0);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الفواتير</h1>
          <p className="text-muted-foreground">المحاسبة والمدفوعات</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          {canCreate("invoices") && (
            <DialogTrigger asChild>
              <Button data-testid="button-add-invoice">
                <Plus className="h-4 w-4 ml-2" />
                إنشاء فاتورة جديدة
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
              <DialogDescription>
                أدخل بيانات الفاتورة
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
                          {Array.isArray(patients) && patients.map((patient: Patient) => (
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subtotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المبلغ الأساسي (ر.س)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-subtotal" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الضريبة (ر.س)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || "0"} data-testid="input-tax" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الخصم (ر.س)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || "0"} data-testid="input-discount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الإجمالي (ر.س)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-total" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المبلغ المدفوع (ر.س)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || "0"} data-testid="input-amount-paid" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>طريقة الدفع</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-method">
                            <SelectValue placeholder="اختر طريقة الدفع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">نقداً</SelectItem>
                          <SelectItem value="card">بطاقة</SelectItem>
                          <SelectItem value="transfer">تحويل بنكي</SelectItem>
                          <SelectItem value="insurance">تأمين</SelectItem>
                        </SelectContent>
                      </Select>
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
                    disabled={addInvoiceMutation.isPending}
                    data-testid="button-submit-invoice"
                  >
                    {addInvoiceMutation.isPending ? "جاري الحفظ..." : "إنشاء الفاتورة"}
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
              إجمالي الفواتير
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-invoices">
              {invoiceList.length}
            </div>
            <p className="text-xs text-muted-foreground">
              فاتورة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              الإيرادات الإجمالية
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              {totalRevenue.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ر.س
            </div>
            <p className="text-xs text-muted-foreground">
              المبلغ الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              المدفوعات
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-paid-revenue">
              {paidRevenue.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ر.س
            </div>
            <p className="text-xs text-muted-foreground">
              تم تحصيله
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              المستحقات المتأخرة
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-overdue-revenue">
              {overdueRevenue.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ر.س
            </div>
            <p className="text-xs text-muted-foreground">
              متأخرة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الفواتير ({invoiceList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المريض</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>المبلغ المدفوع</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceList.map((invoice: any) => {
                const patient = Array.isArray(patients) ? patients.find((p: Patient) => p.id === invoice.patientId) : null;
                const remaining = parseFloat(invoice.total || "0") - parseFloat(invoice.amountPaid || "0");
                
                return (
                  <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                    <TableCell data-testid={`cell-patient-${invoice.id}`}>
                      {patient ? `${patient.firstNameAr} ${patient.familyNameAr}` : "غير معروف"}
                    </TableCell>
                    <TableCell data-testid={`cell-date-${invoice.id}`}>
                      {invoice.invoiceDate && format(new Date(invoice.invoiceDate), "dd/MM/yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell data-testid={`cell-total-${invoice.id}`}>{parseFloat(invoice.total || "0").toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ر.س</TableCell>
                    <TableCell className="text-green-600" data-testid={`cell-paid-${invoice.id}`}>
                      {parseFloat(invoice.amountPaid || "0").toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ر.س
                    </TableCell>
                    <TableCell className={remaining > 0 ? "text-destructive font-semibold" : ""} data-testid={`cell-remaining-${invoice.id}`}>
                      {remaining.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ر.س
                    </TableCell>
                    <TableCell data-testid={`cell-payment-method-${invoice.id}`}>{invoice.paymentMethod || "-"}</TableCell>
                    <TableCell data-testid={`cell-status-${invoice.id}`}>{getStatusBadge(invoice.paymentStatus)}</TableCell>
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
