import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Building2,
  IndianRupee,
} from "lucide-react";
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

interface Distributor {
  id: number;
  userId: number;
  companyName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  city: string;
  state: string;
  currentBalance: number;
  totalOrdered: number;
  totalPaid: number;
  active: boolean;
  createdAt: string;
}

export default function DistributorsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    distributorId: number | null;
    companyName: string;
  }>({
    open: false,
    distributorId: null,
    companyName: "",
  });

  // Fetch distributors
  const { data: distributors, isLoading } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/distributors");
      return res.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/distributors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/distributors"] });
      toast({
        title: "Distributor deleted",
        description: "The distributor has been deleted successfully.",
      });
      setDeleteConfirm({ open: false, distributorId: null, companyName: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter distributors based on search
  const filteredDistributors = distributors?.filter(
    (d) =>
      d.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: number, companyName: string) => {
    setDeleteConfirm({ open: true, distributorId: id, companyName });
  };

  const confirmDelete = () => {
    if (deleteConfirm.distributorId) {
      deleteMutation.mutate(deleteConfirm.distributorId);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Distributors</h1>
            <p className="text-muted-foreground">
              Manage distributor accounts and track their ledgers
            </p>
          </div>
          <Button onClick={() => setLocation("/admin/distributors/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Distributor
          </Button>
        </div>

        {/* Stats Cards */}
        {!isLoading && distributors && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Distributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{distributors.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Distributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {distributors.filter((d) => d.active).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(
                    distributors.reduce((sum, d) => sum + d.currentBalance, 0)
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    distributors.reduce((sum, d) => sum + d.totalPaid, 0)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Distributor List</CardTitle>
            <CardDescription>
              Search and manage all distributor accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company name, email, or contact person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredDistributors && filteredDistributors.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email/Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDistributors.map((distributor) => (
                      <TableRow key={distributor.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {distributor.companyName}
                          </div>
                        </TableCell>
                        <TableCell>{distributor.userName || "N/A"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{distributor.userEmail}</div>
                            <div className="text-muted-foreground">
                              {distributor.userPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {distributor.city}, {distributor.state}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className={`font-semibold ${
                              distributor.currentBalance > 0
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {formatCurrency(distributor.currentBalance)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              distributor.active ? "default" : "secondary"
                            }
                          >
                            {distributor.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setLocation(
                                  `/admin/distributors/${distributor.id}`
                                )
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setLocation(
                                  `/admin/distributors/${distributor.id}/edit`
                                )
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete(
                                  distributor.id,
                                  distributor.companyName
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm
                  ? "No distributors found matching your search"
                  : "No distributors yet. Create your first distributor account."}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteConfirm.open}
          onOpenChange={(open) =>
            !open &&
            setDeleteConfirm({
              open: false,
              distributorId: null,
              companyName: "",
            })
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Distributor</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <strong>{deleteConfirm.companyName}</strong>? This will also
                delete all their ledger entries. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
