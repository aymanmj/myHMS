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
import { insertPayrollSchema, type InsertPayroll, type Staff } from "@shared/schema";
import { useState } from "react";
import { Plus, DollarSign, TrendingUp, Calendar, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";

const months = [
  { value: 1, label: "يناير" },
  { value: 2, label: "فبراير" },
  { value: 3, label: "مارس" },
  { value: 4, label: "أبريل" },
  { value: 5, label: "مايو" },
  { value: 6, label: "يونيو" },
  { value: 7, label: "يوليو" },
  { value: 8, label: "أغسطس" },
  { value: 9, label: "سبتمبر" },
  { value: 10, label: "أكتوبر" },
  { value: 11, label: "نوفمبر" },
  { value: 12, label: "ديسمبر" },
];

export default function Payroll() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { canCreate } = usePermissions();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const { data: payroll, isLoading } = useQuery({
    queryKey: ["/api/payroll"],
  });

  const { data: staff } = useQuery({
    queryKey: ["/api/staff"],
  });

  const addPayrollMutation = useMutation({
    mutationFn: async (data: InsertPayroll) => {
      const totalSalary = 
        parseFloat(data.baseSalary || "0") +
        parseFloat(data.shiftAllowance || "0") +
        parseFloat(data.bonuses || "0") -
        parseFloat(data.deductions || "0") -
        parseFloat(data.insurance || "0");
      
      return await apiRequest("POST", "/api/payroll", {
        ...data,
        totalSalary: totalSalary.toString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      setIsAddDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الراتب بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة الراتب",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertPayroll>({
    resolver: zodResolver(insertPayrollSchema),
    defaultValues: {
      staffId: "",
      month: currentMonth,
      year: currentYear,
      baseSalary: "0",
      shiftAllowance: "0",
      bonuses: "0",
      deductions: "0",
      insurance: "0",
      totalSalary: "0",
    },
  });

  const baseSalary = parseFloat(form.watch("baseSalary") || "0");
  const shiftAllowance = parseFloat(form.watch("shiftAllowance") || "0");
  const bonuses = parseFloat(form.watch("bonuses") || "0");
  const deductions = parseFloat(form.watch("deductions") || "0");
  const insurance = parseFloat(form.watch("insurance") || "0");
  const totalSalary = baseSalary + shiftAllowance + bonuses - deductions - insurance;

  const onSubmit = (data: InsertPayroll) => {
    addPayrollMutation.mutate(data);
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

  const payrollList = Array.isArray(payroll) ? payroll : [];
  const staffList = Array.isArray(staff) ? staff : [];
  
  const thisMonthPayroll = payrollList.filter((p: any) => 
    p.month === currentMonth && p.year === currentYear
  );
  
  const paidPayroll = payrollList.filter((p: any) => p.paidAt !== null);
  
  const totalPayrollAmount = thisMonthPayroll.reduce((sum: number, p: any) => 
    sum + parseFloat(p.totalSalary || "0"), 0
  );

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">إدارة الرواتب</h1>
          <p className="text-muted-foreground">رواتب الموظفين والمستحقات المالية</p>
        </div>
        {canCreate("payroll") && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-payroll">
                <Plus className="h-4 w-4 ml-2" />
                إضافة راتب
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة راتب جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات راتب الموظف
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="staffId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الموظف</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          const selectedStaff = staffList.find((s: Staff) => s.id === value);
                          if (selectedStaff) {
                            form.setValue("baseSalary", selectedStaff.baseSalary || "0");
                          }
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-staff">
                            <SelectValue placeholder="اختر الموظف" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {staffList.map((employee: Staff) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.firstNameAr} {employee.familyNameAr} - {employee.position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الشهر</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-month">
                              <SelectValue placeholder="اختر الشهر" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
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
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>السنة</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" data-testid="input-year" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="baseSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الراتب الأساسي</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" data-testid="input-base-salary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shiftAllowance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>بدل نوبات</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="number" step="0.01" placeholder="0" data-testid="input-shift-allowance" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="bonuses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المكافآت</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="number" step="0.01" placeholder="0" data-testid="input-bonuses" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deductions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الخصومات</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="number" step="0.01" placeholder="0" data-testid="input-deductions" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="insurance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>التأمينات</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="number" step="0.01" placeholder="0" data-testid="input-insurance" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">إجمالي الراتب:</span>
                      <span className="text-2xl font-bold text-green-600" data-testid="text-calculated-total">
                        {totalSalary.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                      </span>
                    </div>
                  </CardContent>
                </Card>

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
                    disabled={addPayrollMutation.isPending}
                    data-testid="button-submit-payroll"
                  >
                    {addPayrollMutation.isPending ? "جاري الحفظ..." : "حفظ الراتب"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي الرواتب
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-payroll">
              {payrollList.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              رواتب الشهر الحالي
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-this-month-payroll">
              {thisMonthPayroll.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              المدفوعة
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-paid-payroll">
              {paidPayroll.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المبلغ (الشهر الحالي)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600" data-testid="text-total-amount">
              {totalPayrollAmount.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الرواتب ({payrollList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>الشهر/السنة</TableHead>
                <TableHead>الراتب الأساسي</TableHead>
                <TableHead>البدلات</TableHead>
                <TableHead>المكافآت</TableHead>
                <TableHead>الخصومات</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollList.map((salary: any) => {
                const employee = staffList.find((s: Staff) => s.id === salary.staffId);
                const monthName = months.find(m => m.value === salary.month)?.label || salary.month;
                
                return (
                  <TableRow key={salary.id} data-testid={`row-payroll-${salary.id}`}>
                    <TableCell data-testid={`cell-employee-${salary.id}`}>
                      {employee ? `${employee.firstNameAr} ${employee.familyNameAr}` : "غير معروف"}
                    </TableCell>
                    <TableCell data-testid={`cell-period-${salary.id}`}>
                      {monthName} {salary.year}
                    </TableCell>
                    <TableCell data-testid={`cell-base-salary-${salary.id}`}>
                      {parseFloat(salary.baseSalary || "0").toLocaleString('ar-SA')} ر.س
                    </TableCell>
                    <TableCell data-testid={`cell-allowances-${salary.id}`}>
                      {parseFloat(salary.shiftAllowance || "0").toLocaleString('ar-SA')} ر.س
                    </TableCell>
                    <TableCell data-testid={`cell-bonuses-${salary.id}`}>
                      {parseFloat(salary.bonuses || "0").toLocaleString('ar-SA')} ر.س
                    </TableCell>
                    <TableCell data-testid={`cell-deductions-${salary.id}`}>
                      {(parseFloat(salary.deductions || "0") + parseFloat(salary.insurance || "0")).toLocaleString('ar-SA')} ر.س
                    </TableCell>
                    <TableCell data-testid={`cell-total-${salary.id}`}>
                      <span className="font-semibold text-green-600">
                        {parseFloat(salary.totalSalary || "0").toLocaleString('ar-SA')} ر.س
                      </span>
                    </TableCell>
                    <TableCell data-testid={`cell-status-${salary.id}`}>
                      {salary.paidAt ? (
                        <Badge variant="secondary" data-testid="badge-status-paid">مدفوع</Badge>
                      ) : (
                        <Badge variant="default" data-testid="badge-status-pending">قيد الانتظار</Badge>
                      )}
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
