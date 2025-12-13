import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Wallet,
  CreditCard,
  Plus,
  Loader2,
  FileText,
} from "lucide-react";

const paymentSchema = z.object({
  amount: z
    .string()
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function DistributorDetailsPage() {
  const [, params] = useRoute("/admin/distributors/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const distributorId = params?.id ? parseInt(params.id) : null;

  // Fetch distributor details
  const { data: distributor, isLoading: distributorLoading } = useQuery({
    queryKey: [`/api/distributors/${distributorId}`],
    enabled: !!distributorId,
  });

  // Fetch ledger entries
  const { data: ledgerData, isLoading: ledgerLoading } = useQuery({
    queryKey: [`/api/distributors/${distributorId}/ledger`, page, pageSize],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/distributors/${distributorId}/ledger?page=${page}&pageSize=${pageSize}`
      );
      return res.json();
    },
    enabled: !!distributorId,
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "",
      paymentReference: "",
      notes: "",
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const res = await apiRequest(
        "POST",
        `/api/distributors/${distributorId}/payments`,
        {
          amount: parseFloat(data.amount),
          paymentMethod: data.paymentMethod,
          paymentReference: data.paymentReference || null,
          notes: data.notes || null,
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to record payment");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/distributors/${distributorId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/distributors/${distributorId}/ledger`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/distributors"] });
      toast({
        title: "Payment recorded",
        description: "The payment has been added to the ledger successfully.",
      });
      setShowPaymentDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (distributorLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!distributor) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Distributor not found</h2>
          <Button
            className="mt-4"
            onClick={() => setLocation("/admin/distributors")}
          >
            Back to Distributors
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin/distributors")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">
                  {distributor.companyName}
                </h1>
                <Badge variant={distributor.active ? "default" : "secondary"}>
                  {distributor.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Distributor ID: #{distributor.id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setLocation(`/admin/distributors/${distributor.id}/edit`)
              }
            >
              Edit Details
            </Button>
            <Button onClick={() => setShowPaymentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Ordered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(distributor.totalOrdered || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(distributor.totalPaid || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Outstanding Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  distributor.currentBalance > 0
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {formatCurrency(distributor.currentBalance || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Business Type</p>
                <p className="font-medium">
                  {distributor.businessType || "N/A"}
                </p>
              </div>
              {distributor.gstNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">GST Number</p>
                  <p className="font-medium">{distributor.gstNumber}</p>
                </div>
              )}
              {distributor.panNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">PAN Number</p>
                  <p className="font-medium">{distributor.panNumber}</p>
                </div>
              )}
              <div className="flex items-start gap-2 pt-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {distributor.address}, {distributor.city}
                  </p>
                  <p className="font-medium">
                    {distributor.state} - {distributor.pincode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Contact Person</p>
                <p className="font-medium">{distributor.userName || "N/A"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {distributor.userEmail || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">
                    {distributor.userPhone || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {distributor.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {distributor.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Ledger */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Account Ledger
            </CardTitle>
            <CardDescription>
              Complete transaction history with orders and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ledgerLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : ledgerData?.entries?.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">
                        Balance After
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerData.entries.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {formatDate(entry.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.entryType === "order"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {entry.entryType === "order" ? (
                              <Wallet className="h-3 w-3 mr-1" />
                            ) : (
                              <CreditCard className="h-3 w-3 mr-1" />
                            )}
                            {entry.entryType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{entry.description}</p>
                            {entry.paymentMethod && (
                              <p className="text-xs text-muted-foreground">
                                via {entry.paymentMethod}
                                {entry.paymentReference &&
                                  ` - Ref: ${entry.paymentReference}`}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-xs text-muted-foreground italic">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            entry.entryType === "order"
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          {entry.entryType === "order" ? "+" : "-"}
                          {formatCurrency(Math.abs(entry.amount))}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.balanceAfter)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {ledgerData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {ledgerData.currentPage} of {ledgerData.totalPages} (
                      {ledgerData.totalEntries} total entries)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= ledgerData.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No transactions yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Add a payment entry to the distributor's ledger
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                paymentMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
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
                    <FormLabel>Payment Method *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Reference</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Transaction ID, Cheque number, etc."
                        {...field}
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
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about this payment..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={paymentMutation.isPending}>
                  {paymentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    "Record Payment"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
