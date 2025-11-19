import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBedSchema, type InsertBed, type Bed } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Bed as BedIcon, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Beds() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<Bed | null>(null);
  const [deletingBedId, setDeletingBedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: beds, isLoading } = useQuery<Bed[]>({
    queryKey: ["/api/beds"],
  });

  const addBedMutation = useMutation({
    mutationFn: (data: InsertBed) => apiRequest("POST", "/api/beds", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beds"] });
      setIsAddDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم إضافة السرير بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة السرير",
        variant: "destructive",
      });
    },
  });

  const updateBedMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertBed> }) =>
      apiRequest("PUT", `/api/beds/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beds"] });
      setEditingBed(null);
      toast({
        title: "تم بنجاح",
        description: "تم تحديث السرير بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث السرير",
        variant: "destructive",
      });
    },
  });

  const deleteBedMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/beds/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beds"] });
      setDeletingBedId(null);
      toast({
        title: "تم بنجاح",
        description: "تم حذف السرير بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف السرير",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      available: { label: "متاح", variant: "default" },
      occupied: { label: "مشغول", variant: "secondary" },
      maintenance: { label: "صيانة", variant: "destructive" },
    };
    const config = variants[status] || { label: status, variant: "default" };
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  const filteredBeds = beds?.filter((bed) => {
    const query = searchQuery.toLowerCase();
    return (
      bed.bedNumber.toLowerCase().includes(query) ||
      bed.ward.toLowerCase().includes(query) ||
      bed.roomNumber?.toLowerCase().includes(query) ||
      bed.floor?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BedIcon className="h-8 w-8" />
            إدارة الأسرّة
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة أسرّة المستشفى وحالتها
          </p>
        </div>
        <AddBedDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSubmit={(data) => addBedMutation.mutate(data)}
          isPending={addBedMutation.isPending}
        />
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث برقم السرير، الجناح، الطابق، أو رقم الغرفة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              data-testid="input-search-beds"
            />
          </div>
        </CardContent>
      </Card>

      {/* Beds List */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأسرّة ({filteredBeds?.length || 0})</CardTitle>
          <CardDescription>
            إجمالي الأسرّة المتاحة في المستشفى
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="loading-beds">
              جاري التحميل...
            </div>
          ) : filteredBeds && filteredBeds.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم السرير</TableHead>
                    <TableHead className="text-right">الجناح</TableHead>
                    <TableHead className="text-right">الطابق</TableHead>
                    <TableHead className="text-right">رقم الغرفة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBeds.map((bed) => (
                    <TableRow key={bed.id} data-testid={`row-bed-${bed.id}`}>
                      <TableCell className="font-medium" data-testid={`text-bed-number-${bed.id}`}>
                        {bed.bedNumber}
                      </TableCell>
                      <TableCell data-testid={`text-ward-${bed.id}`}>{bed.ward}</TableCell>
                      <TableCell data-testid={`text-floor-${bed.id}`}>{bed.floor || "-"}</TableCell>
                      <TableCell data-testid={`text-room-${bed.id}`}>{bed.roomNumber || "-"}</TableCell>
                      <TableCell>{getStatusBadge(bed.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingBed(bed)}
                            data-testid={`button-edit-${bed.id}`}
                          >
                            <Edit className="h-4 w-4 ml-1" />
                            تعديل
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingBedId(bed.id)}
                            data-testid={`button-delete-${bed.id}`}
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground" data-testid="empty-beds">
              {searchQuery ? "لا توجد أسرّة تطابق البحث" : "لا توجد أسرّة مضافة"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingBed && (
        <EditBedDialog
          bed={editingBed}
          open={!!editingBed}
          onOpenChange={(open) => !open && setEditingBed(null)}
          onSubmit={(data) => updateBedMutation.mutate({ id: editingBed.id, data })}
          isPending={updateBedMutation.isPending}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingBedId} onOpenChange={(open) => !open && setDeletingBedId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا السرير؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBedId && deleteBedMutation.mutate(deletingBedId)}
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

function AddBedDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertBed) => void;
  isPending: boolean;
}) {
  const form = useForm<InsertBed>({
    resolver: zodResolver(insertBedSchema),
    defaultValues: {
      bedNumber: "",
      ward: "",
      floor: "",
      roomNumber: "",
      status: "available",
    },
  });

  const handleSubmit = (data: InsertBed) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === "" ? undefined : value
      ])
    ) as InsertBed;
    onSubmit(cleanedData);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-bed">
          <Plus className="h-4 w-4 ml-2" />
          إضافة سرير جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة سرير جديد</DialogTitle>
          <DialogDescription>
            أدخل معلومات السرير الجديد
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bedNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم السرير</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-bed-number" placeholder="مثال: B-101" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الجناح</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-ward" placeholder="مثال: جناح العناية المركزة" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الطابق</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-floor" placeholder="مثال: الطابق الثاني" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الغرفة</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-room-number" placeholder="مثال: 201" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">متاح</SelectItem>
                        <SelectItem value="occupied">مشغول</SelectItem>
                        <SelectItem value="maintenance">صيانة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditBedDialog({
  bed,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  bed: Bed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<InsertBed>) => void;
  isPending: boolean;
}) {
  const form = useForm<InsertBed>({
    resolver: zodResolver(insertBedSchema),
    defaultValues: {
      bedNumber: bed.bedNumber,
      ward: bed.ward,
      floor: bed.floor || "",
      roomNumber: bed.roomNumber || "",
      status: bed.status,
    },
  });

  const handleSubmit = (data: InsertBed) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === "" ? undefined : value
      ])
    ) as InsertBed;
    onSubmit(cleanedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل السرير</DialogTitle>
          <DialogDescription>
            تعديل معلومات السرير
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bedNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم السرير</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-bed-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الجناح</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-ward" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الطابق</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-edit-floor" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الغرفة</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-edit-room-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">متاح</SelectItem>
                        <SelectItem value="occupied">مشغول</SelectItem>
                        <SelectItem value="maintenance">صيانة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-edit-cancel"
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-edit-submit">
                {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
