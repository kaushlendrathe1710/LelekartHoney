/**
 * Example API Route for Tax Invoice Generation
 *
 * Add this route to server/routes.ts to enable tax invoice generation with GST breakdown
 */

import { generateInvoiceData } from "./services/invoice-service";
import { generatePdfBuffer, TEMPLATES } from "./services/pdf-generator";

// Add this route to your Express app
export function addTaxInvoiceRoute(app: Express) {
  /**
   * GET /api/orders/:id/tax-invoice
   * Generate GST-compliant tax invoice for an order
   */
  app.get("/api/orders/:id/tax-invoice", async (req, res) => {
    // Authentication check
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const orderId = parseInt(req.params.id);

      console.log(
        `Generating tax invoice with GST breakdown for order ${orderId}`
      );

      // Check if the current user has access to this order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Access control checks
      const isAdmin = req.user.role === "admin";
      const isBuyer = order.userId === req.user.id;
      const isSeller =
        req.user.role === "seller" &&
        (await storage.orderHasSellerProducts(orderId, req.user.id));

      if (!isAdmin && !isBuyer && !isSeller) {
        return res
          .status(403)
          .json({ error: "Not authorized to access this order" });
      }

      // Generate invoice data with complete GST breakdown
      const invoiceData = await generateInvoiceData(orderId);

      // Generate PDF from template
      const pdfBuffer = await generatePdfBuffer(
        TEMPLATES.TAX_INVOICE,
        invoiceData
      );

      // Send PDF as response
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="tax-invoice-${orderId}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating tax invoice:", error);
      res.status(500).json({
        error: "Failed to generate tax invoice",
        details: error.message,
      });
    }
  });

  /**
   * GET /api/orders/:id/invoice-data
   * Get invoice data as JSON (for preview or custom rendering)
   */
  app.get("/api/orders/:id/invoice-data", async (req, res) => {
    // Authentication check
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const orderId = parseInt(req.params.id);

      // Check if the current user has access to this order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Access control checks
      const isAdmin = req.user.role === "admin";
      const isBuyer = order.userId === req.user.id;
      const isSeller =
        req.user.role === "seller" &&
        (await storage.orderHasSellerProducts(orderId, req.user.id));

      if (!isAdmin && !isBuyer && !isSeller) {
        return res
          .status(403)
          .json({ error: "Not authorized to access this order" });
      }

      // Generate and return invoice data with GST breakdown
      const invoiceData = await generateInvoiceData(orderId);
      res.json(invoiceData);
    } catch (error) {
      console.error("Error getting invoice data:", error);
      res.status(500).json({
        error: "Failed to get invoice data",
        details: error.message,
      });
    }
  });
}

/**
 * Usage in server/routes.ts:
 *
 * import { addTaxInvoiceRoute } from './routes/tax-invoice-route';
 *
 * export function registerRoutes(app: Express): Server {
 *   // ... existing routes ...
 *
 *   // Add tax invoice routes
 *   addTaxInvoiceRoute(app);
 *
 *   // ... rest of routes ...
 * }
 */
