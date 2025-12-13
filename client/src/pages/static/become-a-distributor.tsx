import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
import { StaticPageSection } from "@/components/static-page-template";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle,
  Store,
  TrendingUp,
  Users,
  Package,
  Upload,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const phoneRegex = /^[6-9]\d{9}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const becomeDistributorSchema = z.object({
  // Contact Information
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(phoneRegex, "Please enter a valid 10-digit mobile number"),
  name: z.string().min(2, "Name must be at least 2 characters"),

  // Company Information
  companyName: z.string().min(2, "Company name is required"),
  businessType: z.string().optional(),
  gstNumber: z
    .string()
    .optional()
    .refine((val) => !val || gstRegex.test(val.replace(/\s/g, "")), {
      message: "Please enter a valid GST number",
    }),
  panNumber: z
    .string()
    .optional()
    .refine((val) => !val || panRegex.test(val.replace(/\s/g, "")), {
      message: "Please enter a valid PAN number",
    }),
  address: z.string().min(10, "Please enter a complete address"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Please enter a valid pincode"),

  // Additional
  notes: z.string().optional(),
  aadharCardUrl: z.string().optional(),

  // Terms
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, "You must agree to the terms"),
});

type FormData = z.infer<typeof becomeDistributorSchema>;

export default function BecomeADistributorPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [isUploadingAadhar, setIsUploadingAadhar] = useState(false);
  const [aadharPreview, setAadharPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(becomeDistributorSchema),
    defaultValues: {
      businessType: "",
      agreeToTerms: false,
    },
  });

  const handleAadharUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setAadharFile(file);
    setIsUploadingAadhar(true);

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

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setValue("aadharCardUrl", data.url);

      toast({
        title: "Upload successful",
        description: "Aadhar card uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
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
    setValue("aadharCardUrl", "");
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/become-distributor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit application");
      }

      setIsSuccess(true);
      toast({
        title: "Application Submitted!",
        description:
          "Thank you for your interest. We'll review your application and contact you soon.",
      });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <Helmet>
          <title>Application Submitted - LeleKart</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Application Submitted!</h2>
              <p className="text-muted-foreground">
                Thank you for your interest in becoming a distributor. Our team
                will review your application and contact you within 2-3 business
                days.
              </p>
              <Button onClick={() => (window.location.href = "/")}>
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Become a Distributor - LeleKart</title>
        <meta
          name="description"
          content="Join LeleKart as a distributor and grow your business with us"
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Become a Distributor
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Partner with LeleKart and expand your distribution network
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() =>
                document
                  .getElementById("application-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Apply Now
            </Button>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Distribute with LeleKart?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Wide Product Range</h3>
                <p className="text-sm text-muted-foreground">
                  Access to diverse product categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Competitive Pricing</h3>
                <p className="text-sm text-muted-foreground">
                  Best wholesale rates for distributors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Dedicated Support</h3>
                <p className="text-sm text-muted-foreground">
                  24/7 assistance from our team
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Easy Ordering</h3>
                <p className="text-sm text-muted-foreground">
                  Simple platform with quick delivery
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Application Form */}
        <div id="application-form" className="container mx-auto px-4 py-16">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">
                Distributor Application Form
              </CardTitle>
              <p className="text-muted-foreground">
                Fill in the details below to start your distributor journey
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        {...register("name")}
                        placeholder="John Doe"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="john@example.com"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        {...register("phone")}
                        placeholder="9876543210"
                        maxLength={10}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Company Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        {...register("companyName")}
                        placeholder="ABC Distributors Pvt Ltd"
                      />
                      {errors.companyName && (
                        <p className="text-sm text-red-500">
                          {errors.companyName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue("businessType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Wholesale">Wholesale</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gstNumber">GST Number</Label>
                      <Input
                        id="gstNumber"
                        {...register("gstNumber")}
                        placeholder="22AAAAA0000A1Z5"
                      />
                      {errors.gstNumber && (
                        <p className="text-sm text-red-500">
                          {errors.gstNumber.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="panNumber">PAN Number</Label>
                      <Input
                        id="panNumber"
                        {...register("panNumber")}
                        placeholder="ABCDE1234F"
                      />
                      {errors.panNumber && (
                        <p className="text-sm text-red-500">
                          {errors.panNumber.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Aadhar Upload */}
                  <div className="space-y-2">
                    <Label>Aadhar Card (Optional)</Label>
                    <div className="border-2 border-dashed rounded-lg p-6">
                      {!aadharFile ? (
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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
                          <p className="text-xs text-muted-foreground mt-2">
                            JPG, PNG or PDF (Max 5MB)
                          </p>
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
                                alt="Preview"
                                className="h-16 w-16 object-cover rounded"
                              />
                            ) : (
                              <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                                <Upload className="h-6 w-6" />
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

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      {...register("address")}
                      placeholder="Street, Building, Landmark"
                      rows={2}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-500">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        {...register("city")}
                        placeholder="Mumbai"
                      />
                      {errors.city && (
                        <p className="text-sm text-red-500">
                          {errors.city.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        {...register("state")}
                        placeholder="Maharashtra"
                      />
                      {errors.state && (
                        <p className="text-sm text-red-500">
                          {errors.state.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input
                        id="pincode"
                        {...register("pincode")}
                        placeholder="400001"
                        maxLength={6}
                      />
                      {errors.pincode && (
                        <p className="text-sm text-red-500">
                          {errors.pincode.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Information</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Tell us about your distribution experience, areas of interest, etc."
                    rows={3}
                  />
                </div>

                {/* Terms */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={watch("agreeToTerms")}
                    onCheckedChange={(checked) =>
                      setValue("agreeToTerms", checked as boolean)
                    }
                  />
                  <label htmlFor="terms" className="text-sm leading-none">
                    I agree to the terms and conditions and privacy policy *
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-sm text-red-500">
                    {errors.agreeToTerms.message}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
