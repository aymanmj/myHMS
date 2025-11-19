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
import { insertPatientSchema, type Patient, type InsertPatient } from "@shared/schema";
import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Plus, Edit, Eye, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/usePermissions";

export default function Patients() {
  const { toast } = useToast();
  const { canCreate, canDelete } = usePermissions();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const { data: patients, isLoading } = useQuery({
    queryKey: ["/api/patients"],
  });

  const addPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      return await apiRequest("POST", "/api/patients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setIsAddDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المريض بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة المريض",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: {
      firstNameAr: "",
      fatherNameAr: "",
      grandFatherNameAr: "",
      familyNameAr: "",
      dateOfBirth: "",
      gender: "male",
      nationality: "",
      phone: "",
      allergies: [],
      chronicDiseases: [],
      previousSurgeries: [],
    },
  });

  const onSubmit = (data: InsertPatient) => {
    addPatientMutation.mutate(data);
  };

  const filteredPatients = patients?.filter((patient: Patient) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      patient.firstNameAr?.toLowerCase().includes(query) ||
      patient.familyNameAr?.toLowerCase().includes(query) ||
      patient.phone?.includes(query) ||
      patient.nationalId?.includes(query)
    );
  });

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
          <h1 className="text-3xl font-bold">إدارة المرضى</h1>
          <p className="text-muted-foreground">عرض وإدارة ملفات المرضى</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-patient">
              <Plus className="h-4 w-4 ml-2" />
              إضافة مريض جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة مريض جديد</DialogTitle>
              <DialogDescription>
                أدخل البيانات الشخصية الكاملة للمريض
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Arabic Name Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">الاسم بالعربية</h3>
                  <div className="grid grid-cols-2 gap-4">
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

                {/* English Name Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">الاسم بالإنجليزية</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstNameEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-first-name-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fatherNameEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Father Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-father-name-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="grandFatherNameEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grand Father Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-grandfather-name-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="familyNameEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Family Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-family-name-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Personal Info Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">البيانات الشخصية</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nationalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهوية الوطنية</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-national-id" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="passportNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم جواز السفر</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-passport" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاريخ الميلاد</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-dob" />
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
                                <SelectValue />
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
                      name="maritalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الحالة الاجتماعية</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-marital-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single">أعزب</SelectItem>
                              <SelectItem value="married">متزوج</SelectItem>
                              <SelectItem value="divorced">مطلق</SelectItem>
                              <SelectItem value="widowed">أرمل</SelectItem>
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
                            <Input {...field} data-testid="input-nationality" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">معلومات الاتصال</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} value={field.value || ""} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العنوان</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المدينة</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Medical Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">المعلومات الطبية</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bloodType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>فصيلة الدم</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-blood-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="a_positive">A+</SelectItem>
                              <SelectItem value="a_negative">A-</SelectItem>
                              <SelectItem value="b_positive">B+</SelectItem>
                              <SelectItem value="b_negative">B-</SelectItem>
                              <SelectItem value="ab_positive">AB+</SelectItem>
                              <SelectItem value="ab_negative">AB-</SelectItem>
                              <SelectItem value="o_positive">O+</SelectItem>
                              <SelectItem value="o_negative">O-</SelectItem>
                              <SelectItem value="unknown">غير معروف</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الحساسية (افصل بفاصلة)</FormLabel>
                          <FormControl>
                            <Input 
                              value={field.value?.join(", ") || ""} 
                              onChange={(e) => {
                                const value = e.target.value;
                                const array = value ? value.split(",").map(s => s.trim()).filter(Boolean) : [];
                                field.onChange(array);
                              }}
                              placeholder="مثال: بنسلين، فول سوداني" 
                              data-testid="input-allergies" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="chronicDiseases"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الأمراض المزمنة (افصل بفاصلة)</FormLabel>
                          <FormControl>
                            <Input 
                              value={field.value?.join(", ") || ""} 
                              onChange={(e) => {
                                const value = e.target.value;
                                const array = value ? value.split(",").map(s => s.trim()).filter(Boolean) : [];
                                field.onChange(array);
                              }}
                              placeholder="مثال: سكري، ضغط" 
                              data-testid="input-chronic-diseases" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                    disabled={addPatientMutation.isPending}
                    data-testid="button-submit-patient"
                  >
                    {addPatientMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم، رقم الهوية، أو رقم الهاتف"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
                data-testid="input-search-patients"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المرضى ({filteredPatients?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>رقم الهوية</TableHead>
                <TableHead>الجنس</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>فصيلة الدم</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients?.map((patient: Patient) => (
                <TableRow key={patient.id} data-testid={`row-patient-${patient.id}`}>
                  <TableCell>
                    <div className="font-medium">
                      {patient.firstNameAr} {patient.fatherNameAr} {patient.grandFatherNameAr} {patient.familyNameAr}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {patient.firstNameEn} {patient.fatherNameEn} {patient.grandFatherNameEn} {patient.familyNameEn}
                    </div>
                  </TableCell>
                  <TableCell>{patient.nationalId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {patient.gender === "male" ? "ذكر" : "أنثى"}
                    </Badge>
                  </TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>
                    <Badge>
                      {patient.bloodType?.toUpperCase().replace("_", "")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        data-testid={`button-view-details-${patient.id}`}
                        title="عرض التفاصيل"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPatient(patient)}
                        data-testid={`button-view-${patient.id}`}
                        title="عرض سريع"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-edit-${patient.id}`}
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
