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
import { insertStaffSchema, type InsertStaff } from "@shared/schema";
import { useState } from "react";
import { Plus, Users, UserCheck, UserX, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { usePermissions } from "@/hooks/usePermissions";

export default function HR() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { canCreate, canUpdate, canDelete } = usePermissions();

  const { data: staff, isLoading } = useQuery({
    queryKey: ["/api/staff"],
  });

  const { data: attendance } = useQuery({
    queryKey: ["/api/attendance"],
  });

  const { data: leaves } = useQuery({
    queryKey: ["/api/leaves"],
  });

  const addStaffMutation = useMutation({
    mutationFn: async (data: InsertStaff) => {
      return await apiRequest("POST", "/api/staff", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setIsAddDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الموظف بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة الموظف",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertStaff>({
    resolver: zodResolver(insertStaffSchema),
    defaultValues: {
      firstNameAr: "",
      fatherNameAr: "",
      grandFatherNameAr: "",
      familyNameAr: "",
      dateOfBirth: "",
      gender: "male",
      nationality: "",
      phone: "",
      position: "",
      department: "",
      hireDate: new Date().toISOString().split('T')[0],
      baseSalary: "0",
    },
  });

  const onSubmit = (data: InsertStaff) => {
    addStaffMutation.mutate(data);
  };

  const getPositionBadge = (position: string) => {
    return <Badge variant="default" data-testid={`badge-position-${position}`}>{position}</Badge>;
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

  const staffList = Array.isArray(staff) ? staff : [];
  const attendanceList = Array.isArray(attendance) ? attendance : [];
  const leavesList = Array.isArray(leaves) ? leaves : [];
  
  const todayAttendance = attendanceList.filter((a: any) => {
    const today = new Date().toISOString().split('T')[0];
    return a.date === today;
  });

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">إدارة الموارد البشرية</h1>
          <p className="text-muted-foreground">إدارة الموظفين والحضور والإجازات</p>
        </div>
        {canCreate("staff") && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-staff">
                <Plus className="h-4 w-4 ml-2" />
                إضافة موظف جديد
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة موظف جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات الموظف الكاملة
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">الاسم الرباعي بالعربي</h3>
                  <div className="grid gap-4 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name="firstNameAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الأول</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-first-name-ar" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fatherNameAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم الأب</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-father-name-ar" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="grandFatherNameAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم الجد</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-grandfather-name-ar" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="familyNameAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم العائلة</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-family-name-ar" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ الميلاد</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-date-of-birth" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الجنس</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="اختر الجنس" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">ذكر</SelectItem>
                            <SelectItem value="female">أنثى</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الجنسية</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="مثال: سعودي" data-testid="input-nationality" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nationalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهوية الوطنية</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-national-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الجوال</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المسمى الوظيفي</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="مثال: طبيب، ممرض، صيدلي" data-testid="input-position" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>القسم</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="مثال: الطوارئ، الباطنية" data-testid="input-department" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ التوظيف</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-hire-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="baseSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الراتب الأساسي</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" data-testid="input-base-salary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                    disabled={addStaffMutation.isPending}
                    data-testid="button-submit-staff"
                  >
                    {addStaffMutation.isPending ? "جاري الحفظ..." : "حفظ الموظف"}
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
              إجمالي الموظفين
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-staff">
              {staffList.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              الأقسام
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-departments">
              {new Set(staffList.map((s: any) => s.department)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              الإجازات
            </CardTitle>
            <UserX className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-leaves">
              {leavesList.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              حضور اليوم
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-today-attendance">
              {todayAttendance.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الموظفين ({staffList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>رقم الهوية</TableHead>
                <TableHead>المسمى الوظيفي</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>الجوال</TableHead>
                <TableHead>الراتب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.map((employee: any) => (
                <TableRow key={employee.id} data-testid={`row-staff-${employee.id}`}>
                  <TableCell data-testid={`cell-name-${employee.id}`}>
                    {employee.firstNameAr} {employee.fatherNameAr} {employee.familyNameAr}
                  </TableCell>
                  <TableCell data-testid={`cell-national-id-${employee.id}`}>{employee.nationalId || "-"}</TableCell>
                  <TableCell data-testid={`cell-position-${employee.id}`}>{getPositionBadge(employee.position)}</TableCell>
                  <TableCell data-testid={`cell-department-${employee.id}`}>{employee.department}</TableCell>
                  <TableCell data-testid={`cell-phone-${employee.id}`}>{employee.phone}</TableCell>
                  <TableCell data-testid={`cell-salary-${employee.id}`}>{parseFloat(employee.baseSalary || "0").toLocaleString('ar-SA')} ر.س</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
