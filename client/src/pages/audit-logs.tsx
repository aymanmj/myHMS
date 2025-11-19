import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { AlertCircle, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuditLog {
  id: string;
  userId: string;
  action: "create" | "update" | "delete";
  tableName: string;
  recordId: string;
  oldData: any;
  newData: any;
  createdAt: Date;
}

export default function AuditLogsPage() {
  const [filterTable, setFilterTable] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: auditLogs = [], isLoading, error } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const filteredLogs = auditLogs.filter((log) => {
    const matchesTable = filterTable === "all" || log.tableName === filterTable;
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesSearch = searchQuery === "" || 
      log.recordId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTable && matchesAction && matchesSearch;
  });

  const tableNames = Array.from(new Set(auditLogs.map((log) => log.tableName))).sort();

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "create":
        return "default";
      case "update":
        return "secondary";
      case "delete":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "create":
        return "إنشاء";
      case "update":
        return "تحديث";
      case "delete":
        return "حذف";
      default:
        return action;
    }
  };

  const getTableLabel = (tableName: string) => {
    const labels: Record<string, string> = {
      users: "المستخدمين",
      patients: "المرضى",
      appointments: "المواعيد",
      admissions: "التنويم",
      surgeries: "العمليات",
      medications: "الأدوية",
      prescriptions: "الوصفات",
      labTests: "التحاليل",
      radiologyTests: "الأشعة",
      staff: "الموظفين",
      attendance: "الحضور",
      leaves: "الإجازات",
      shifts: "الورديات",
      payroll: "الرواتب",
      invoices: "الفواتير",
    };
    return labels[tableName] || tableName;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">جارٍ تحميل سجلات التدقيق...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" data-testid="alert-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>فشل في تحميل سجلات التدقيق. يرجى المحاولة مرة أخرى.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-audit-logs">سجلات التدقيق</h1>
        <p className="text-muted-foreground" data-testid="text-description">
          عرض جميع العمليات التي تمت على النظام
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تصفية السجلات</CardTitle>
          <CardDescription>استخدم الفلاتر للبحث عن سجلات محددة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع الجدول</label>
              <Select value={filterTable} onValueChange={setFilterTable}>
                <SelectTrigger data-testid="select-table-filter">
                  <SelectValue placeholder="اختر الجدول" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الجداول</SelectItem>
                  {tableNames.map((tableName) => (
                    <SelectItem key={tableName} value={tableName}>
                      {getTableLabel(tableName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">نوع العملية</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger data-testid="select-action-filter">
                  <SelectValue placeholder="اختر العملية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العمليات</SelectItem>
                  <SelectItem value="create">إنشاء</SelectItem>
                  <SelectItem value="update">تحديث</SelectItem>
                  <SelectItem value="delete">حذف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">بحث</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم السجل أو المستخدم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle data-testid="text-results-count">
            النتائج ({filteredLogs.length} سجل)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ والوقت</TableHead>
                  <TableHead className="text-right">العملية</TableHead>
                  <TableHead className="text-right">الجدول</TableHead>
                  <TableHead className="text-right">رقم السجل</TableHead>
                  <TableHead className="text-right">المستخدم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8" data-testid="text-no-logs">
                      لا توجد سجلات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell className="text-right" data-testid={`cell-timestamp-${log.id}`}>
                        {format(new Date(log.createdAt), "yyyy/MM/dd HH:mm:ss", { locale: ar })}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`cell-action-${log.id}`}>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" data-testid={`cell-table-${log.id}`}>
                        {getTableLabel(log.tableName)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs" data-testid={`cell-record-${log.id}`}>
                        {log.recordId.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs" data-testid={`cell-user-${log.id}`}>
                        {log.userId.substring(0, 8)}...
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
