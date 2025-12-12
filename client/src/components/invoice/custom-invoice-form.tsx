import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Download, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Product {
  id: number;
  name: string;
  price: number;
  gstRate: number;
  mrp: number;
}

interface InvoiceItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  gstRate: number;
  mrp: number;
}

interface CustomInvoiceFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerPincode: string;
  items: InvoiceItem[];
  additionalNotes?: string;
}

export function CustomInvoiceForm() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomInvoiceFormData>({
    defaultValues: {
      items: [
        {
          productId: 0,
          productName: "",
          quantity: 1,
          price: 0,
          gstRate: 18,
          mrp: 0,
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
    fetchProducts();
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
      setValue(`items.${index}.price`, product.price);
      setValue(`items.${index}.gstRate`, product.gstRate || 18);
      setValue(`items.${index}.mrp`, product.mrp || product.price);
    }
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.price;
    const gstAmount = (subtotal * item.gstRate) / 100;
    return subtotal + gstAmount;
  };

  const calculateGrandTotal = () => {
    return items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const onSubmit = async (data: CustomInvoiceFormData) => {
    setIsGenerating(true);

    try {
      toast({
        title: "Generating Invoice",
        description: "Your custom invoice is being generated...",
      });

      // Generate a unique invoice number
      const invoiceNumber = `INV-${Date.now()}`;

      // Calculate totals for each item
      const itemsWithTotals = data.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        gstRate: item.gstRate,
        mrp: item.mrp,
        subtotal: item.quantity * item.price,
        gstAmount: (item.quantity * item.price * item.gstRate) / 100,
        total: calculateItemTotal(item),
      }));

      const invoiceData = {
        invoiceNumber,
        invoiceDate: new Date().toISOString(),
        customer: {
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone,
          address: data.customerAddress,
          city: data.customerCity,
          state: data.customerState,
          pincode: data.customerPincode,
        },
        items: itemsWithTotals,
        subtotal: items.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
        ),
        totalGst: items.reduce(
          (sum, item) =>
            sum + (item.quantity * item.price * item.gstRate) / 100,
          0
        ),
        grandTotal: calculateGrandTotal(),
        additionalNotes: data.additionalNotes,
      };

      // Send request to generate PDF
      const response = await fetch("/api/invoices/generate-custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
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
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

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
            <FileText className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                {...register("customerName", {
                  required: "Customer name is required",
                })}
                placeholder="Enter customer name"
              />
              {errors.customerName && (
                <p className="text-sm text-red-500">
                  {errors.customerName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                {...register("customerEmail", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                placeholder="customer@example.com"
              />
              {errors.customerEmail && (
                <p className="text-sm text-red-500">
                  {errors.customerEmail.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input
                id="customerPhone"
                {...register("customerPhone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Phone number must be 10 digits",
                  },
                })}
                placeholder="10-digit phone number"
                maxLength={10}
              />
              {errors.customerPhone && (
                <p className="text-sm text-red-500">
                  {errors.customerPhone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPincode">Pincode *</Label>
              <Input
                id="customerPincode"
                {...register("customerPincode", {
                  required: "Pincode is required",
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: "Pincode must be 6 digits",
                  },
                })}
                placeholder="6-digit pincode"
                maxLength={6}
              />
              {errors.customerPincode && (
                <p className="text-sm text-red-500">
                  {errors.customerPincode.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerAddress">Address *</Label>
            <Textarea
              id="customerAddress"
              {...register("customerAddress", {
                required: "Address is required",
              })}
              placeholder="Enter complete address"
              rows={2}
            />
            {errors.customerAddress && (
              <p className="text-sm text-red-500">
                {errors.customerAddress.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerCity">City *</Label>
              <Input
                id="customerCity"
                {...register("customerCity", { required: "City is required" })}
                placeholder="Enter city"
              />
              {errors.customerCity && (
                <p className="text-sm text-red-500">
                  {errors.customerCity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerState">State *</Label>
              <Input
                id="customerState"
                {...register("customerState", {
                  required: "State is required",
                })}
                placeholder="Enter state"
              />
              {errors.customerState && (
                <p className="text-sm text-red-500">
                  {errors.customerState.message}
                </p>
              )}
            </div>
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
                  price: 0,
                  gstRate: 18,
                  mrp: 0,
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor={`items.${index}.productId`}>Product *</Label>
                  <Select
                    value={items[index]?.productId?.toString() || ""}
                    onValueChange={(value) => handleProductSelect(index, value)}
                    disabled={loadingProducts}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingProducts
                            ? "Loading products..."
                            : "Select a product"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id.toString()}
                        >
                          {product.name} - ₹{product.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.items?.[index]?.productId && (
                    <p className="text-sm text-red-500">Product is required</p>
                  )}
                  {/* Hidden fields for productName and mrp */}
                  <input
                    type="hidden"
                    {...register(`items.${index}.productName`)}
                  />
                  <input
                    type="hidden"
                    {...register(`items.${index}.mrp`, { valueAsNumber: true })}
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

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.price`}>Price (₹)</Label>
                  <Input
                    id={`items.${index}.price`}
                    type="number"
                    min="0"
                    step="0.01"
                    {...register(`items.${index}.price`, {
                      valueAsNumber: true,
                    })}
                    placeholder="0.00"
                    readOnly
                    className="bg-gray-50"
                  />
                  {errors.items?.[index]?.price && (
                    <p className="text-sm text-red-500">
                      {errors.items[index]?.price?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.gstRate`}>GST Rate (%)</Label>
                  <Input
                    id={`items.${index}.gstRate`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    {...register(`items.${index}.gstRate`, {
                      valueAsNumber: true,
                    })}
                    placeholder="18"
                    readOnly
                    className="bg-gray-50"
                  />
                  {errors.items?.[index]?.gstRate && (
                    <p className="text-sm text-red-500">
                      {errors.items[index]?.gstRate?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-muted p-3 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>
                    ₹
                    {(
                      items[index]?.quantity * items[index]?.price || 0
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST ({items[index]?.gstRate || 0}%):</span>
                  <span>
                    ₹
                    {(
                      (items[index]?.quantity *
                        items[index]?.price *
                        items[index]?.gstRate) /
                        100 || 0
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold border-t mt-2 pt-2">
                  <span>Total:</span>
                  <span>
                    ₹
                    {calculateItemTotal(
                      items[index] || { quantity: 0, price: 0, gstRate: 0 }
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span className="font-medium">Subtotal:</span>
                <span>
                  ₹
                  {items
                    .reduce((sum, item) => sum + item.quantity * item.price, 0)
                    .toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-medium">Total GST:</span>
                <span>
                  ₹
                  {items
                    .reduce(
                      (sum, item) =>
                        sum + (item.quantity * item.price * item.gstRate) / 100,
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t-2 pt-2">
                <span>Grand Total:</span>
                <span className="text-primary">
                  ₹{calculateGrandTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register("additionalNotes")}
            placeholder="Any additional notes or terms & conditions..."
            rows={4}
          />
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
              <Download className="h-4 w-4 mr-2" />
              Generate Invoice
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
