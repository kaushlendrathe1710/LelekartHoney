import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  FileText,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/dashboard-layout";

interface Distributor {
  id: number;
  companyName: string;
  currentBalance: number;
  totalOrdered: number;
  totalPaid: number;
  creditLimit: number;
}

interface LedgerEntry {
  id: number;
  entryType: string;
  amount: number;
  description: string;
  balanceAfter: number;
  paymentMethod?: string;
  paymentReference?: string;
  createdAt: string;
  notes?: string;
}

export default function DistributorDashboard() {
  // Get current user
  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  // Fetch distributor data
  const { data: distributor, isLoading: loadingDistributor } =
    useQuery<Distributor>({
      queryKey: ["/api/distributors/user", user?.id],
      queryFn: async () => {
        const res = await apiRequest(
          "GET",
          `/api/distributors/user/${user?.id}`
        );
        return res.json();
      },
      enabled: !!user?.id,
    });

  // Fetch ledger entries
  const { data: ledgerData, isLoading: loadingLedger } = useQuery<{
    entries: LedgerEntry[];
    total: number;
  }>({
    queryKey: ["/api/distributors/ledger", distributor?.id],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/distributors/${distributor?.id}/ledger?page=1&limit=50`
      );
      return res.json();
    },
    enabled: !!distributor?.id,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
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

  if (loadingDistributor) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!distributor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Distributor Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your account is not set up as a distributor. Please contact the
              administrator for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">
                  {distributor.companyName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Distributor Dashboard
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Current Balance
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
                  {formatCurrency(distributor.currentBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {distributor.currentBalance > 0 ? "Outstanding" : "Settled"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Ordered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(distributor.totalOrdered)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Total Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(distributor.totalPaid)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Credit Limit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {distributor.creditLimit
                    ? formatCurrency(distributor.creditLimit)
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Available credit
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ledger Table */}
          <Card>
            <CardHeader>
              <CardTitle>Account Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLedger ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Payment Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledgerData?.entries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No transactions yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        ledgerData?.entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="text-sm">
                              {formatDate(entry.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  entry.entryType === "order"
                                    ? "destructive"
                                    : "default"
                                }
                              >
                                {entry.entryType === "order"
                                  ? "Order"
                                  : "Payment"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {entry.description}
                                {entry.notes && (
                                  <div className="text-xs text-muted-foreground">
                                    {entry.notes}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={
                                  entry.amount > 0
                                    ? "text-red-600 font-semibold"
                                    : "text-green-600 font-semibold"
                                }
                              >
                                {entry.amount > 0 ? "+" : ""}
                                {formatCurrency(Math.abs(entry.amount))}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(entry.balanceAfter)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.paymentMethod || "-"}
                              {entry.paymentReference && (
                                <div className="text-xs">
                                  Ref: {entry.paymentReference}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
