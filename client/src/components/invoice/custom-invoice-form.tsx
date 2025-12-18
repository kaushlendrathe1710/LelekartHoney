import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Download,
  FileText,
  Loader2,
  Building2,
  Eye,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  price: number;
  gstRate: number;
  mrp: number;
}

interface Distributor {
  id: number;
  companyName: string;
  businessType: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  gstNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface InvoiceItem {
  productId: number;
  productName: string;
  quantity: number;
}

interface CustomInvoiceFormData {
  distributorId: string;
  items: InvoiceItem[];
}

export function CustomInvoiceForm() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingDistributors, setLoadingDistributors] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [invoiceDataForDownload, setInvoiceDataForDownload] =
    useState<any>(null);
  const [distributorOpen, setDistributorOpen] = useState(false);
  const [productOpen, setProductOpen] = useState<{ [key: number]: boolean }>(
    {}
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomInvoiceFormData>({
    defaultValues: {
      distributorId: "",
      items: [
        {
          productId: 0,
          productName: "",
          quantity: 1,
        },
      ],
    },
  });

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/seller/products?limit=1000");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        });
      } finally {
        setLoadingProducts(false);
      }
    };

    const fetchDistributors = async () => {
      try {
        const res = await fetch("/api/distributors");
        if (res.ok) {
          const data = await res.json();
          setDistributors(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch distributors:", error);
        toast({
          title: "Error",
          description: "Failed to load distributors",
          variant: "destructive",
        });
      } finally {
        setLoadingDistributors(false);
      }
    };

    fetchProducts();
    fetchDistributors();
  }, [toast]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === parseInt(productId));
    if (product) {
      setValue(`items.${index}.productId`, product.id);
      setValue(`items.${index}.productName`, product.name);
      setProductOpen({ ...productOpen, [index]: false });
    }
  };

  const getSelectedDistributorText = () => {
    const distributorId = watch("distributorId");
    if (!distributorId) return "Choose a distributor";
    const dist = distributors.find((d) => d.id.toString() === distributorId);
    return dist
      ? `${dist.companyName} - ${dist.userName}`
      : "Choose a distributor";
  };

  const getSelectedProductText = (index: number) => {
    const productId = items[index]?.productId;
    if (!productId) return "Select a product";
    const product = products.find((p) => p.id === productId);
    return product ? `${product.name} - ₹${product.price}` : "Select a product";
  };

  const onSubmit = async (data: CustomInvoiceFormData) => {
    setIsGenerating(true);

    try {
      // Find selected distributor
      const distributor = distributors.find(
        (d) => d.id.toString() === data.distributorId
      );

      if (!distributor) {
        throw new Error("Distributor not found");
      }

      toast({
        title: "Generating Preview",
        description: "Your invoice preview is being generated...",
      });

      // Generate a unique invoice number
      const invoiceNumber = `INV-${Date.now()}`;

      // Send item data with productId and quantity - backend will fetch price and GST from product table
      const invoiceData = {
        invoiceNumber,
        invoiceDate: new Date().toISOString(),
        distributor: {
          id: distributor.id,
          companyName: distributor.companyName,
          name: distributor.userName,
          email: distributor.userEmail,
          phone: distributor.userPhone,
          gstNumber: distributor.gstNumber || "N/A",
          address: distributor.address,
          city: distributor.city,
          state: distributor.state,
          pincode: distributor.pincode,
        },
        items: data.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
        })),
      };

      // Save invoice data for later download
      setInvoiceDataForDownload(invoiceData);

      // Send request to generate preview HTML
      const response = await fetch("/api/invoices/preview-custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate preview");
      }

      // Get HTML preview
      const html = await response.text();
      setPreviewHtml(html);
      setShowPreview(true);

      toast({
        title: "Preview Ready",
        description: "Review your invoice before downloading.",
      });
    } catch (error) {
      console.error("Error generating preview:", error);
      toast({
        title: "Preview Failed",
        description: "Failed to generate the preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceDataForDownload) return;

    setIsGenerating(true);
    try {
      toast({
        title: "Generating PDF",
        description: "Your invoice is being downloaded...",
      });

      // Send request to generate PDF
      const response = await fetch("/api/invoices/generate-custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceDataForDownload),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate invoice");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceDataForDownload.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowPreview(false);
      toast({
        title: "Invoice Generated!",
        description: "Your custom invoice has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate the invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Distributor Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="distributorId">Select Distributor *</Label>
            {loadingDistributors ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading distributors...
                </span>
              </div>
            ) : (
              <Popover open={distributorOpen} onOpenChange={setDistributorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={distributorOpen}
                    className="w-full justify-between font-normal"
                  >
                    {getSelectedDistributorText()}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search distributors..." />
                    <CommandList>
                      <CommandEmpty>
                        {distributors.length === 0
                          ? "No distributors found"
                          : "No results found"}
                      </CommandEmpty>
                      <CommandGroup>
                        {distributors.map((dist) => (
                          <CommandItem
                            key={dist.id}
                            value={`${dist.companyName} ${dist.userName}`}
                            onSelect={() => {
                              setValue("distributorId", dist.id.toString());
                              setDistributorOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                watch("distributorId") === dist.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {dist.companyName} - {dist.userName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            {errors.distributorId && (
              <p className="text-sm text-red-500">Distributor is required</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Items
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  productId: 0,
                  productName: "",
                  quantity: 1,
                })
              }
              disabled={loadingProducts}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Item {index + 1}</h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`items.${index}.productId`}>Product *</Label>
                  {loadingProducts ? (
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                      disabled
                    >
                      Loading products...
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    </Button>
                  ) : (
                    <Popover
                      open={productOpen[index] || false}
                      onOpenChange={(open) =>
                        setProductOpen({ ...productOpen, [index]: open })
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={productOpen[index] || false}
                          className="w-full justify-between font-normal"
                        >
                          {getSelectedProductText(index)}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search products..." />
                          <CommandList>
                            <CommandEmpty>No products found</CommandEmpty>
                            <CommandGroup>
                              {products.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={`${product.name} ${product.price}`}
                                  onSelect={() =>
                                    handleProductSelect(
                                      index,
                                      product.id.toString()
                                    )
                                  }
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      items[index]?.productId === product.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  {product.name} - ₹{product.price}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                  {errors.items?.[index]?.productId && (
                    <p className="text-sm text-red-500">Product is required</p>
                  )}
                  {/* Hidden field for productName */}
                  <input
                    type="hidden"
                    {...register(`items.${index}.productName`)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.quantity`}>Quantity *</Label>
                  <Input
                    id={`items.${index}.quantity`}
                    type="number"
                    min="1"
                    {...register(`items.${index}.quantity`, {
                      required: "Quantity is required",
                      min: { value: 1, message: "Minimum quantity is 1" },
                      valueAsNumber: true,
                    })}
                    placeholder="1"
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-sm text-red-500">
                      {errors.items[index]?.quantity?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={isGenerating || loadingProducts}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Preview Invoice
            </>
          )}
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              Review your invoice before downloading. Click "Download PDF" to
              save the invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="border rounded-lg overflow-auto max-h-[60vh]">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>

          <DialogFooter className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              disabled={isGenerating}
            >
              Close
            </Button>
            <Button onClick={handleDownloadInvoice} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
