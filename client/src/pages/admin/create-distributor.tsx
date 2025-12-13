import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Loader2, ArrowLeft, Building2, Upload, X } from "lucide-react";

const createDistributorSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  companyName: z.string().min(2, "Company name is required"),
  businessType: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  aadharCardUrl: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Pincode must be 6 digits").max(6),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof createDistributorSchema>;

export default function CreateDistributorPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [isUploadingAadhar, setIsUploadingAadhar] = useState(false);
  const [aadharPreview, setAadharPreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(createDistributorSchema),
    defaultValues: {
      email: "",
      name: "",
      phone: "",
      companyName: "",
      businessType: "",
      gstNumber: "",
      panNumber: "",
      aadharCardUrl: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      notes: "",
    },
  });

  const handleAadharUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or PDF file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Aadhar card file must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setAadharFile(file);
    setIsUploadingAadhar(true);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAadharPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/aadhar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      form.setValue("aadharCardUrl", data.url);

      toast({
        title: "Upload successful",
        description: "Aadhar card has been uploaded",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload Aadhar card. Please try again.",
        variant: "destructive",
      });
      setAadharFile(null);
      setAadharPreview(null);
    } finally {
      setIsUploadingAadhar(false);
    }
  };

  const removeAadharFile = () => {
    setAadharFile(null);
    setAadharPreview(null);
    form.setValue("aadharCardUrl", "");
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // First create the user (username and role will be auto-generated on backend)
      const userRes = await apiRequest("POST", "/api/users", {
        email: data.email,
        name: data.name,
        phone: data.phone,
      });

      if (!userRes.ok) {
        const error = await userRes.json();
        throw new Error(error.error || "Failed to create user");
      }

      const user = await userRes.json();

      // Then create the distributor record
      const distributorRes = await apiRequest("POST", "/api/distributors", {
        userId: user.id,
        companyName: data.companyName,
        businessType: data.businessType || null,
        gstNumber: data.gstNumber || null,
        panNumber: data.panNumber || null,
        aadharCardUrl: data.aadharCardUrl || null,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        notes: data.notes || null,
      });

      if (!distributorRes.ok) {
        const error = await distributorRes.json();
        throw new Error(error.error || "Failed to create distributor");
      }

      return distributorRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/distributors"] });
      toast({
        title: "Distributor created",
        description:
          "The distributor account has been created successfully. They can now log in using OTP.",
      });
      setLocation("/admin/distributors");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create distributor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    setIsCreating(true);
    createMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
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
            <h1 className="text-3xl font-bold tracking-tight">
              Create Distributor
            </h1>
            <p className="text-muted-foreground">
              Create a new distributor account with ledger tracking
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* User Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>User Account Information</CardTitle>
                <CardDescription>
                  The distributor will use email OTP to log in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="distributor@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Used for OTP login</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
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
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ABC Distributors Pvt Ltd"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Wholesale">Wholesale</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                            <SelectItem value="Both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gstNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Number</FormLabel>
                        <FormControl>
                          <Input placeholder="22AAAAA0000A1Z5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN Number</FormLabel>
                        <FormControl>
                          <Input placeholder="ABCDE1234F" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Aadhar Card Upload */}
                <div className="space-y-2">
                  <Label>Aadhar Card (Optional)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6">
                    {!aadharFile ? (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <div className="space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document.getElementById("aadhar-upload")?.click()
                            }
                            disabled={isUploadingAadhar}
                          >
                            {isUploadingAadhar ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Aadhar Card
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG or PDF (Max 5MB)
                          </p>
                        </div>
                        <input
                          id="aadhar-upload"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          onChange={handleAadharUpload}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {aadharPreview ? (
                            <img
                              src={aadharPreview}
                              alt="Aadhar preview"
                              className="h-16 w-16 object-cover rounded"
                            />
                          ) : (
                            <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                              <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{aadharFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(aadharFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={removeAadharFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Street address, building name, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="Mumbai" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input placeholder="Maharashtra" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="400001"
                            maxLength={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Internal notes about this distributor..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/admin/distributors")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Distributor"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
