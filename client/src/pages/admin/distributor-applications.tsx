import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Building2,
} from "lucide-react";

interface DistributorApplication {
  id: number;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  businessType: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  aadharCardUrl: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  notes: string | null;
  status: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

export default function DistributorApplicationsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState<DistributorApplication | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">(
    "approve"
  );
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: applications, isLoading } = useQuery({
    queryKey: ["/api/admin/distributor-applications", statusFilter],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/admin/distributor-applications?status=${statusFilter}`
      );
      return res.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      notes,
    }: {
      id: number;
      action: "approve" | "reject";
      notes: string;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/distributor-applications/${id}/${action}`,
        { reviewNotes: notes }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/distributor-applications"],
      });
      toast({
        title: "Success",
        description:
          reviewAction === "approve"
            ? "Application approved and distributor created"
            : "Application rejected",
      });
      setShowReviewDialog(false);
      setShowDetailDialog(false);
      setReviewNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReview = () => {
    if (!selectedApplication) return;
    reviewMutation.mutate({
      id: selectedApplication.id,
      action: reviewAction,
      notes: reviewNotes,
    });
  };

  const filteredApplications = applications?.filter(
    (app: DistributorApplication) =>
      searchQuery
        ? app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
        : true
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Distributor Applications
          </h1>
          <p className="text-muted-foreground">
            Review and manage distributor applications
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Applications</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by company, email, or contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>
              {filteredApplications?.length || 0} application(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredApplications?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No applications found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications?.map(
                      (app: DistributorApplication) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">
                            {app.companyName}
                            {app.businessType && (
                              <div className="text-xs text-muted-foreground">
                                {app.businessType}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{app.contactPerson}</TableCell>
                          <TableCell>{app.email}</TableCell>
                          <TableCell>{app.phone}</TableCell>
                          <TableCell>
                            {app.city}, {app.state}
                          </TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell>
                            {new Date(app.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedApplication(app);
                                setShowDetailDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review distributor application information
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedApplication.status)}
                  </div>
                </div>
                {selectedApplication.status === "pending" && (
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setReviewAction("approve");
                        setShowReviewDialog(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setReviewAction("reject");
                        setShowReviewDialog(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>

              {/* Company Information */}
              <div>
                <h3 className="font-semibold mb-3">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Company Name
                    </p>
                    <p className="font-medium">
                      {selectedApplication.companyName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Business Type
                    </p>
                    <p className="font-medium">
                      {selectedApplication.businessType || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">GST Number</p>
                    <p className="font-medium">
                      {selectedApplication.gstNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PAN Number</p>
                    <p className="font-medium">
                      {selectedApplication.panNumber || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="font-semibold mb-3">Address</h3>
                <p className="text-sm">
                  {selectedApplication.address}
                  <br />
                  {selectedApplication.city}, {selectedApplication.state} -{" "}
                  {selectedApplication.pincode}
                </p>
              </div>

              {/* Contact Details */}
              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Contact Person
                    </p>
                    <p className="font-medium">
                      {selectedApplication.contactPerson}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {selectedApplication.contactEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">
                      {selectedApplication.contactPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Aadhar Card */}
              {selectedApplication.aadharCardUrl && (
                <div>
                  <h3 className="font-semibold mb-3">Documents</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(selectedApplication.aadharCardUrl!, "_blank")
                    }
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Aadhar Card
                  </Button>
                </div>
              )}

              {/* Notes */}
              {selectedApplication.notes && (
                <div>
                  <h3 className="font-semibold mb-3">Additional Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedApplication.notes}
                  </p>
                </div>
              )}

              {/* Review Information */}
              {selectedApplication.reviewedAt && (
                <div>
                  <h3 className="font-semibold mb-3">Review Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-muted-foreground">
                        Reviewed on:{" "}
                      </span>
                      {new Date(
                        selectedApplication.reviewedAt
                      ).toLocaleString()}
                    </p>
                    {selectedApplication.reviewNotes && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Notes: </span>
                        {selectedApplication.reviewNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve" : "Reject"} Application
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "This will create a distributor account and send login credentials."
                : "This will reject the application. You can add a reason below."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Review Notes (Optional)</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about your decision..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewDialog(false);
                setReviewNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewMutation.isPending}
              variant={reviewAction === "reject" ? "destructive" : "default"}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {reviewAction === "approve" ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  {reviewAction === "approve" ? "Approve" : "Reject"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
