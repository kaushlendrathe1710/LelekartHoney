import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomInvoiceForm } from "@/components/invoice/custom-invoice-form";
import { FileText } from "lucide-react";

export default function AdminCustomInvoicePage() {
  return (
    <AdminLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Custom Invoice Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Create professional invoices with custom details and items
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Custom Invoice</CardTitle>
            <CardDescription>
              Fill in the customer details and invoice items below. The invoice
              will be generated using your configured template with all business
              details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomInvoiceForm />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
