/**
 * PDF Generator Service
 *
 * This file contains functions for generating PDF documents.
 */

import templateService from "./template-service";
import handlebars from "handlebars";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import { JSDOM } from "jsdom";
import htmlPdf from "html-pdf-node";
import QRCode from "qrcode";

// Template types - export for use in other modules
export const TEMPLATES = {
  INVOICE: "invoice",
  RETURN_LABEL: "return-label",
  RETURN_FORM: "return-form",
  SHIPPING_LABEL: "shipping-label",
  PACKING_SLIP: "packing-slip",
  TAX_INVOICE: "tax-invoice",
};

// PDF generation options
const PDF_OPTIONS = {
  format: "A4",
  margin: {
    top: "5mm",
    right: "5mm",
    bottom: "0mm", // remove extra bottom page margin
    left: "5mm",
  },
  printBackground: true,
  preferCSSPageSize: true,
};

// Half A4 PDF generation options
const HALF_A4_PDF_OPTIONS = {
  format: "A4",
  margin: {
    top: "3mm",
    right: "3mm",
    bottom: "0mm",
    left: "3mm",
  },
  printBackground: true,
  preferCSSPageSize: true,
};

/**
 * Generate a PDF document from a template
 * @param templateType Type of template to use
 * @param data Data to populate the template with
 */
export async function generatePdfBuffer(
  templateType: string,
  data: any
): Promise<Buffer> {
  try {
    // Get the template HTML
    const templateHtml = getPdfTemplate(templateType);

    // Render the template with data
    const html = await templateService.renderTemplate(templateHtml, data);

    // Generate PDF from HTML using html-pdf-node
    const file = { content: html };
    const pdfBuffer = await htmlPdf.generatePdf(file, PDF_OPTIONS);

    return pdfBuffer;
  } catch (error) {
    console.error("Error in PDF generation:", error);
    throw error;
  }
}

/**
 * Generate a half A4 PDF document from a template
 * @param templateType Type of template to use
 * @param data Data to populate the template with
 */
export async function generateHalfA4PdfBuffer(
  templateType: string,
  data: any
): Promise<Buffer> {
  try {
    // Get the template HTML
    const templateHtml = getPdfTemplate(templateType);

    // Render the template with data
    const html = await templateService.renderTemplate(templateHtml, data);

    // Generate PDF from HTML using html-pdf-node with half A4 options
    const file = { content: html };
    const pdfBuffer = await htmlPdf.generatePdf(file, HALF_A4_PDF_OPTIONS);

    return pdfBuffer;
  } catch (error) {
    console.error("Error in half A4 PDF generation:", error);
    throw error;
  }
}

/**
 * Generate a PDF document and send it as a response
 * @param res Express response object
 * @param html HTML content to convert to PDF
 * @param filename Name to use for the downloaded file
 */
export async function generatePdf(
  res: any,
  html: string,
  filename: string
): Promise<void> {
  try {
    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Log the first 500 characters of the HTML to debug template issues
    console.log("Generating PDF with HTML content (first 500 chars):", html);

    // Generate PDF from HTML
    const file = { content: html };
    const pdfBuffer = await htmlPdf.generatePdf(file, PDF_OPTIONS);

    // Send PDF buffer directly
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error in PDF generation:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}

/**
 * Get the HTML for a template with data already applied
 * @param templateType Type of template to use
 * @param data Data to populate the template with
 * @returns HTML string with data applied to template
 */
export function getPdfTemplateHtml(templateType: string, data: any): string {
  try {
    // Get the template HTML
    const template = handlebars.compile(getPdfTemplate(templateType));

    // Apply the data to the template
    return template(data);
  } catch (error) {
    console.error(`Error generating template HTML for ${templateType}:`, error);
    return `<html><body><h1>Error generating template</h1><p>${error}</p></body></html>`;
  }
}

/**
 * Get the PDF template based on template type
 * @param templateType Type of template to get
 */
function getPdfTemplate(templateType: string): string {
  switch (templateType) {
    case TEMPLATES.INVOICE:
      return getInvoiceTemplate();
    case TEMPLATES.RETURN_LABEL:
      return getReturnLabelTemplate();
    case TEMPLATES.RETURN_FORM:
      return getReturnFormTemplate();
    case TEMPLATES.SHIPPING_LABEL:
      return getShippingLabelTemplate();
    case TEMPLATES.PACKING_SLIP:
      return getPackingSlipTemplate();
    case TEMPLATES.TAX_INVOICE:
      return getTaxInvoiceTemplate();
    default:
      throw new Error(`Unknown template type: ${templateType}`);
  }
}

/**
 * Get the invoice template
 */
function getInvoiceTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice</title>
        <style>
          @page {
            size: A4;
            margin: 3mm;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            line-height: 1.2;
            color: #333;
            margin: 0;
            padding: 0;
          }
          
                     .container {
             width: 148.5mm;
             min-height: 210mm;
             margin: 0 auto;
             border: 1px solid #000;
             page-break-inside: avoid;
             overflow: visible;
             position: relative;
           }
          .invoice-header {
            text-align: center;
            margin-bottom: 10px;
            padding: 5px;
          }
          .invoice-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
                     .invoice-details {
             display: flex;
             justify-content: space-between;
             margin-bottom: 25px;
             font-size: 8px;
           }
           .invoice-details-left, .invoice-details-right {
             width: 45%;
           }
           .invoice-table {
             width: 100%;
             border-collapse: collapse;
             margin-bottom: 10px;
             font-size: 8px;
             margin-top: 15px;
           }
                     .invoice-table th, .invoice-table td {
             border: 1px solid #ddd;
             padding: 4px 3px;
             text-align: left;
           }
          .invoice-table th {
            background-color: #f2f2f2;
          }
          .invoice-total {
            text-align: right;
            margin-top: 10px;
            font-size: 8px;
          }
          .invoice-total-row {
            margin-bottom: 2px;
          }
          .invoice-footer {
            margin-top: 20px;
            text-align: center;
            font-size: 8px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="invoice-title">INVOICE</div>
          <div>Invoice #{{order.orderNumber}}</div>
          <div>Date: {{order.createdAt}}</div>
        </div>
        
        <div class="invoice-details">
          <div class="invoice-details-left">
            <h3>From:</h3>
            <div>LeleKart Marketplace</div>
            <div>123 Commerce Street</div>
            <div>Mumbai, Maharashtra 400001</div>
            <div>India</div>
            <div>GSTIN: 27AABCU9603R1ZX</div>
          </div>
          <div class="invoice-details-right">
            <h3>To:</h3>
            <div>{{order.shippingAddress.name}}</div>
            <div>{{order.shippingAddress.address1}}</div>
            <div>{{order.shippingAddress.address2}}</div>
            <div>{{order.shippingAddress.city}}, {{order.shippingAddress.state}} {{order.shippingAddress.pincode}}</div>
            <div>{{order.shippingAddress.country}}</div>
          </div>
        </div>
        
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>GST Rate</th>
              <th>GST Amount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {{#each order.orderItems}}
            <tr>
              <td>{{this.product.name}}</td>
              <td>{{this.product.description}}</td>
              <td>{{this.quantity}}</td>
              <td>{{this.price}}</td>
              <td>{{this.product.gstRate}}%</td>
              <td>{{this.gstAmount}}</td>
              <td>{{this.totalPrice}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
        
        <div class="invoice-total">
          <div class="invoice-total-row">Subtotal: {{order.subtotal}}</div>
          <div class="invoice-total-row">Shipping: {{order.shippingFee}}</div>
          <div class="invoice-total-row">GST: {{order.taxAmount}}</div>
          <div class="invoice-total-row">Discount: -{{order.discount}}</div>
          <div class="invoice-total-row"><strong>Total: {{order.total}}</strong></div>
          {{#if order.wallet_discount}}
          <div class="invoice-total-row">Paid with Wallet: -{{order.wallet_discount}}</div>
          <div class="invoice-total-row"><strong>Balance Paid: {{order.amountPaid}}</strong></div>
          {{/if}}
        </div>
        
        <div class="invoice-footer">
          <div>Thank you for shopping with LeleKart!</div>
          <div>For any questions regarding this invoice, please contact support@lelekart.com</div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get the return label template
 */
function getReturnLabelTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Return Label</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #333;
          }
          .label {
            border: 2px solid #000;
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
          }
          .label-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .label-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .section {
            margin-bottom: 20px;
          }
          .address-box {
            border: 1px solid #000;
            padding: 10px;
            margin-top: 5px;
          }
          .bold {
            font-weight: bold;
          }
          .barcode {
            text-align: center;
            margin: 20px 0;
          }
          .instructions {
            font-size: 12px;
            margin-top: 20px;
            padding: 10px;
            border: 1px dashed #ccc;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="label-header">
            <div class="label-title">RETURN SHIPPING LABEL</div>
            <div>Return #{{returnRequest.id}}</div>
          </div>
          
          <div class="section">
            <div class="bold">FROM:</div>
            <div class="address-box">
              {{returnRequest.buyerName}}<br>
              {{returnRequest.buyerAddress.address1}}<br>
              {{#if returnRequest.buyerAddress.address2}}{{returnRequest.buyerAddress.address2}}<br>{{/if}}
              {{returnRequest.buyerAddress.city}}, {{returnRequest.buyerAddress.state}} {{returnRequest.buyerAddress.pincode}}<br>
              {{returnRequest.buyerAddress.country}}
            </div>
          </div>
          
          <div class="section">
            <div class="bold">TO:</div>
            <div class="address-box">
              {{returnRequest.sellerName}}<br>
              {{returnRequest.sellerAddress.address1}}<br>
              {{#if returnRequest.sellerAddress.address2}}{{returnRequest.sellerAddress.address2}}<br>{{/if}}
              {{returnRequest.sellerAddress.city}}, {{returnRequest.sellerAddress.state}} {{returnRequest.sellerAddress.pincode}}<br>
              {{returnRequest.sellerAddress.country}}
            </div>
          </div>
          
          <div class="barcode">
            <!-- Barcode would be inserted here in a real implementation -->
            <div style="font-family: monospace; font-size: 16px;">*{{returnRequest.id}}*</div>
          </div>
          
          <div class="instructions">
            <div class="bold">Instructions:</div>
            <ol>
              <li>Print this label clearly on a plain white sheet of paper.</li>
              <li>Attach the label securely to your package.</li>
              <li>Drop off the package at your nearest courier service point.</li>
              <li>Keep the receipt as proof of return shipment.</li>
            </ol>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get the return form template
 */
function getReturnFormTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Return Form</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
          }
          .form {
            max-width: 700px;
            margin: 0 auto;
          }
          .form-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .form-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 5px;
            border-bottom: 1px solid #ddd;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .table th, .table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .table th {
            background-color: #f2f2f2;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #777;
          }
          .signature {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          .signature-line {
            width: 45%;
            border-top: 1px solid #000;
            padding-top: 5px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="form">
          <div class="form-header">
            <div class="form-title">PRODUCT RETURN FORM</div>
            <div>Return #{{returnRequest.id}}</div>
            <div>Date: {{date}}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div>Name: {{returnRequest.buyerName}}</div>
            <div>Email: {{returnRequest.buyerEmail}}</div>
            <div>Phone: {{returnRequest.buyerPhone}}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Order Information</div>
            <div>Order #: {{returnRequest.orderNumber}}</div>
            <div>Order Date: {{returnRequest.orderDate}}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Product Information</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Return Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{returnRequest.productName}}</td>
                  <td>{{returnRequest.productSku}}</td>
                  <td>{{returnRequest.quantity}}</td>
                  <td>{{returnRequest.reasonText}}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">Return Details</div>
            <div>Return Type: {{returnRequest.requestType}}</div>
            <div>Description: {{returnRequest.description}}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Instructions</div>
            <ol>
              <li>Please include this form with your return shipment.</li>
              <li>Pack the item(s) securely to prevent damage during transit.</li>
              <li>Use the provided return shipping label.</li>
              <li>Keep a copy of this form and shipping receipt for your records.</li>
            </ol>
          </div>
          
          <div class="signature">
            <div class="signature-line">Customer Signature</div>
            <div class="signature-line">Date</div>
          </div>
          
          <div class="footer">
            <div>LeleKart Return Department</div>
            <div>123 Commerce Street, Mumbai, Maharashtra 400001, India</div>
            <div>Email: returns@lelekart.com | Phone: +91-123-456-7890</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get the shipping label template
 */
export function getShippingLabelTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Shipping Label</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .shipping-label {
            border: 3px solid #000;
            padding: 20px;
            margin-bottom: 30px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 16px;
            margin-bottom: 10px;
          }
          .important {
            font-weight: bold;
            text-transform: uppercase;
          }
          .address-section {
            display: table;
            width: 100%;
            margin-bottom: 20px;
          }
          .address-box {
            display: table-cell;
            width: 50%;
            padding: 10px;
            vertical-align: top;
          }
          .address-box-inner {
            border: 1px solid #000;
            padding: 10px;
            min-height: 120px;
          }
          .address-label {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .barcode {
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            border: 1px solid #000;
            background: #f9f9f9;
          }
          .code {
            font-family: monospace;
            font-size: 18px;
            letter-spacing: 2px;
          }
          .footer {
            margin-top: 20px;
            font-size: 10px;
            text-align: center;
            color: #666;
          }
          .order-details {
            margin: 20px 0;
            border: 1px solid #ddd;
            padding: 10px;
            background: #f9f9f9;
          }
          .order-title {
            font-weight: bold;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .delivery-date {
            margin-top: 10px;
            font-style: italic;
          }
          .note {
            font-size: 12px;
            margin-top: 20px;
            padding: 10px;
            border: 1px dashed #ccc;
            background: #f5f5f5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="shipping-label">
            <div class="header">
              <div class="title">Shipping Label</div>
              <div class="subtitle">LeleKart E-Commerce Platform</div>
              <div>Order #: {{mainOrder.id}}</div>
              <div>Date: {{currentDate}}</div>
            </div>
            
            <div class="address-section">
              <div class="address-box">
                <div class="address-label">FROM:</div>
                <div class="address-box-inner">
                  <strong>{{seller.username}}</strong><br>
                  {{#if businessDetails}}
                  {{businessDetails.businessName}}<br>
                  {{/if}}
                  LeleKart Fulfillment Center<br>
                  123 Commerce Street<br>
                  Mumbai, Maharashtra 400001<br>
                  India
                </div>
              </div>
              
              <div class="address-box">
                <div class="address-label">TO:</div>
                <div class="address-box-inner">
                  {{#if shippingAddress}}
                  <strong>{{shippingAddress.name}}</strong><br>
                  {{shippingAddress.address1}}{{#if shippingAddress.address2}}<br>{{shippingAddress.address2}}{{/if}}<br>
                  {{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.pincode}}<br>
                  {{shippingAddress.country}}<br>
                  Phone: {{shippingAddress.phone}}
                  {{else}}
                  {{#if mainOrder.shippingDetails}}
                  <strong>{{mainOrder.shippingDetails.name}}</strong><br>
                  {{mainOrder.shippingDetails.address}}<br>
                  {{mainOrder.shippingDetails.city}}, {{mainOrder.shippingDetails.state}} {{mainOrder.shippingDetails.zipCode}}<br>
                  India<br>
                  Phone: {{mainOrder.shippingDetails.phone}}
                  {{else}}
                  <strong>Customer Address</strong><br>
                  Address information not available
                  {{/if}}
                  {{/if}}
                </div>
              </div>
            </div>
            
            <div class="order-details">
              <div class="order-title">Order Information</div>
              <div>Order ID: {{mainOrder.id}}</div>
              <div>Order Date: {{mainOrder.formattedDate}}</div>
              <div>Status: {{mainOrder.formattedStatus}}</div>
              <div>Payment Method: {{mainOrder.paymentMethod}}</div>
              {{#if mainOrder.estimatedDeliveryDate}}
              <div class="delivery-date">Estimated Delivery: {{mainOrder.estimatedDeliveryDate}}</div>
              {{/if}}
            </div>
            
            <div class="barcode">
              <div>Scan for order tracking</div>
              <div class="code">*{{mainOrder.id}}*</div>
            </div>
            
            <div class="note">
              <div class="important">Important:</div>
              <ul>
                <li>Please keep this label with your package.</li>
                <li>This shipping label is required for delivery.</li>
                <li>For any questions, contact LeleKart customer service.</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <div>Generated by LeleKart E-Commerce Platform</div>
            <div>This document is system-generated and doesn't require a signature.</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get the packing slip template
 */
function getPackingSlipTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Packing Slip</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
          }
          .packing-slip {
            max-width: 700px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .address-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .address-box {
            width: 45%;
          }
          .address-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .table th, .table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .table th {
            background-color: #f2f2f2;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="packing-slip">
          <div class="header">
            <div class="title">PACKING SLIP</div>
            <div>Order #{{order.orderNumber}}</div>
            <div>Date: {{order.createdAt}}</div>
          </div>
          
          <div class="address-section">
            <div class="address-box">
              <div class="address-title">Ship To:</div>
              <div>{{order.shippingAddress.name}}</div>
              <div>{{order.shippingAddress.address1}}</div>
              <div>{{order.shippingAddress.address2}}</div>
              <div>{{order.shippingAddress.city}}, {{order.shippingAddress.state}} {{order.shippingAddress.pincode}}</div>
              <div>{{order.shippingAddress.country}}</div>
              <div>Phone: {{order.shippingAddress.phone}}</div>
            </div>
            
            <div class="address-box">
              <div class="address-title">Order Information:</div>
              <div>Order Date: {{order.createdAt}}</div>
              <div>Payment Method: {{order.paymentMethod}}</div>
              <div>Shipping Method: {{order.shippingMethod}}</div>
            </div>
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {{#each order.orderItems}}
              <tr>
                <td>{{this.product.name}}</td>
                <td>{{this.product.sku}}</td>
                <td>{{this.quantity}}</td>
                <td>{{this.price}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
          
          <div class="footer">
            <div>This is not a receipt. Thank you for shopping with LeleKart!</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate invoice HTML with GST calculations
 * This function mirrors the generateInvoiceHtml from routes.ts (lines 14351-15203)
 */
export async function generateInvoiceHtml(data: any): Promise<string> {
  try {
    // Register Handlebars helpers
    handlebars.registerHelper("formatMoney", function (value: number) {
      return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
    });

    // Helper function to convert number to Indian Rupee words
    handlebars.registerHelper("amountInWords", function (amount: number) {
      const ones = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
      ];
      const tens = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
      ];
      const teens = [
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
      ];

      function convertLessThanThousand(n: number): string {
        if (n === 0) return "";

        let words = "";

        // Handle hundreds
        if (n >= 100) {
          words += ones[Math.floor(n / 100)] + " Hundred ";
          n %= 100;
        }

        // Handle tens and ones
        if (n > 0) {
          if (n < 10) {
            words += ones[n];
          } else if (n < 20) {
            words += teens[n - 10];
          } else {
            words += tens[Math.floor(n / 10)];
            if (n % 10 > 0) {
              words += " " + ones[n % 10];
            }
          }
        }

        return words.trim();
      }

      if (amount === 0) return "Zero Rupees";

      let rupees = Math.floor(amount);
      const paise = Math.round((amount - rupees) * 100);

      let words = "";

      // Handle crores
      if (rupees >= 10000000) {
        const crore = Math.floor(rupees / 10000000);
        words += convertLessThanThousand(crore) + " Crore ";
        rupees %= 10000000;
      }

      // Handle lakhs
      if (rupees >= 100000) {
        const lakh = Math.floor(rupees / 100000);
        words += convertLessThanThousand(lakh) + " Lakh ";
        rupees %= 100000;
      }

      // Handle thousands
      if (rupees >= 1000) {
        const thousand = Math.floor(rupees / 1000);
        words += convertLessThanThousand(thousand) + " Thousand ";
        rupees %= 1000;
      }

      // Handle remaining amount
      if (rupees > 0) {
        words += convertLessThanThousand(rupees);
      }

      // Add "Rupees" if there's any amount
      if (words) {
        words += " Rupees";
      }

      // Add paise if any
      if (paise > 0) {
        words += " and " + convertLessThanThousand(paise) + " Paise";
      }

      return words.trim();
    });

    handlebars.registerHelper(
      "calculateGST",
      function (price: number, quantity: number, gstRate: number) {
        const totalPrice = price * quantity;
        // GST is already included in the price, so we need to extract it
        const basePrice =
          gstRate > 0 ? (totalPrice * 100) / (100 + gstRate) : totalPrice;
        const gstAmount = totalPrice - basePrice;
        return gstAmount.toFixed(2);
      }
    );

    handlebars.registerHelper(
      "calculateTaxableValue",
      function (price: number, quantity: number, gstRate: number) {
        const totalPrice = price * quantity;
        const taxableValue = totalPrice / (1 + gstRate / 100);
        return taxableValue.toFixed(2);
      }
    );

    // Calculate taxable value from delivery charges (GST-inclusive)
    handlebars.registerHelper(
      "calculateDeliveryTaxable",
      function (deliveryCharges: number, quantity: number, gstRate: number) {
        if (!deliveryCharges || deliveryCharges === 0) return "Free";
        const totalDelivery = deliveryCharges * quantity;
        const taxableValue =
          gstRate > 0 ? totalDelivery / (1 + gstRate / 100) : totalDelivery;
        return taxableValue.toFixed(2);
      }
    );

    // Combined tax calculation for product + delivery charges
    handlebars.registerHelper(
      "calculateTaxesWithDelivery",
      function (
        price: number,
        quantity: number,
        deliveryCharges: number,
        gstRate: number,
        isSameState: boolean
      ) {
        // Calculate product tax
        const totalPrice = price * quantity;
        const productTaxableValue =
          gstRate > 0 ? totalPrice / (1 + gstRate / 100) : totalPrice;
        const productTax = totalPrice - productTaxableValue;

        // Calculate delivery tax
        const totalDelivery = (deliveryCharges || 0) * quantity;
        const deliveryTaxableValue =
          gstRate > 0 ? totalDelivery / (1 + gstRate / 100) : totalDelivery;
        const deliveryTax = totalDelivery - deliveryTaxableValue;

        // Total tax
        const totalTax = productTax + deliveryTax;

        // Build explicit breakdown
        let breakdown = "";

        // Split into CGST+SGST or show as IGST based on state
        if (isSameState) {
          // Same state: CGST + SGST
          const halfRate = gstRate / 2;
          const productCGST = productTax / 2;
          const productSGST = productTax / 2;
          const deliveryCGST = deliveryTax / 2;
          const deliverySGST = deliveryTax / 2;
          const totalCGST = productCGST + deliveryCGST;
          const totalSGST = productSGST + deliverySGST;

          breakdown = `Product: CGST ${halfRate}% = ${productCGST.toFixed(
            2
          )}, SGST ${halfRate}% = ${productSGST.toFixed(2)}`;
          if (deliveryTax > 0) {
            breakdown += `<br>Delivery: CGST ${halfRate}% = ${deliveryCGST.toFixed(
              2
            )}, SGST ${halfRate}% = ${deliverySGST.toFixed(2)}`;
          }
          breakdown += `<br><strong>Total: CGST = ${totalCGST.toFixed(
            2
          )}, SGST = ${totalSGST.toFixed(2)}</strong>`;
        } else {
          // Different state: IGST
          breakdown = `Product: IGST ${gstRate}% = ${productTax.toFixed(2)}`;
          if (deliveryTax > 0) {
            breakdown += `<br>Delivery: IGST ${gstRate}% = ${deliveryTax.toFixed(
              2
            )}`;
          }
          breakdown += `<br><strong>Total: IGST = ${totalTax.toFixed(
            2
          )}</strong>`;
        }

        return breakdown;
      }
    );

    handlebars.registerHelper(
      "calculateTaxes",
      function (
        price: number,
        quantity: number,
        gstRate: number,
        buyerState: any,
        sellerState: string
      ) {
        console.log("Buyer state received:", buyerState); // Debug log
        console.log("Seller state received:", sellerState); // Debug log
        const totalPrice = price * quantity;
        const basePrice =
          gstRate > 0 ? totalPrice / (1 + gstRate / 100) : totalPrice;
        const taxAmount = totalPrice - basePrice;

        // Helper function to normalize state names
        const normalizeState = (state: string): string => {
          if (!state) return "";

          // Convert to lowercase and remove special characters
          const normalized = state
            .trim()
            .toLowerCase()
            .replace(/[^a-z]/g, "");

          // Map of common state abbreviations to full names
          const stateMap: { [key: string]: string } = {
            hp: "himachalpradesh",
            mp: "madhyapradesh",
            up: "uttarpradesh",
            ap: "andhrapradesh",
            tn: "tamilnadu",
            ka: "karnataka",
            mh: "maharashtra",
            gj: "gujarat",
            rj: "rajasthan",
            wb: "westbengal",
            pb: "punjab",
            hr: "haryana",
            kl: "kerala",
            or: "odisha",
            br: "bihar",
            jh: "jharkhand",
            ct: "chhattisgarh",
            ga: "goa",
            mn: "manipur",
            ml: "meghalaya",
            tr: "tripura",
            ar: "arunachalpradesh",
            nl: "nagaland",
            mz: "mizoram",
            sk: "sikkim",
            dl: "delhi",
            ch: "chandigarh",
            py: "pondicherry",
            an: "andamanandnicobar",
            dn: "dadraandnagarhaveli",
            dd: "damananddiu",
            ld: "lakshadweep",
            jk: "jammukashmir",
            la: "ladakh",
            ut: "uttarakhand",
            ts: "telangana",
          };

          // Check if the normalized state is an abbreviation
          return stateMap[normalized] || normalized;
        };

        // Normalize both buyer and seller states
        const normalizedBuyerState = normalizeState(String(buyerState || ""));
        const normalizedSellerState = normalizeState(sellerState || "");

        // If buyer and seller are from the same state, split GST into CGST and SGST
        if (
          normalizedBuyerState &&
          normalizedSellerState &&
          normalizedBuyerState === normalizedSellerState
        ) {
          const halfAmount = taxAmount / 2;
          return `SGST @ ${gstRate / 2}% i.e. ${halfAmount.toFixed(
            2
          )}<br>CGST @ ${gstRate / 2}% i.e. ${halfAmount.toFixed(2)}`;
        } else {
          // If different states or state info not available, show as IGST
          return `IGST @ ${gstRate}% i.e. ${taxAmount.toFixed(2)}`;
        }
      }
    );

    // Function to convert image URL to base64
    const getBase64FromUrl = async (url: string): Promise<string> => {
      try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mimeType = response.headers.get("content-type") || "image/png";
        return `data:${mimeType};base64,${base64}`;
      } catch (error) {
        console.error("Error converting image to base64:", error);
        return ""; // Return empty string if conversion fails
      }
    };

    // Convert logo and signature images to base64
    const logoUrl =
      "https://chunumunu.s3.ap-northeast-1.amazonaws.com/brand/Logo/krpl+final+logo.png";

    const signatureUrl =
      data.seller?.pickupAddress?.authorizationSignature ||
      "https://drive.google.com/uc?export=view&id=1NC3MTl6qklBjamL3bhjRMdem6rQ0mB9F";

    const [logoBase64, signatureBase64] = await Promise.all([
      getBase64FromUrl(logoUrl),
      getBase64FromUrl(signatureUrl),
    ]);

    // Generate QR code with invoice details
    const qrData = `https://krpl.lelekart.in/orders/${data.order.id}`;

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 75,
    });

    // Add QR code to the data
    data.qrCodeDataUrl = qrCodeDataUrl;

    // Register QR code helper
    handlebars.registerHelper("qrCode", function () {
      return new handlebars.SafeString(
        `<img src="${qrCodeDataUrl}" alt="Invoice QR Code" style="width: 75px; height: 75px;">`
      );
    });

    // Register 'gt' helper for greater-than comparisons
    handlebars.registerHelper("gt", function (a, b) {
      return a > b;
    });

    // Invoice template with fixed header alignment - Half A4 size
    const invoiceTemplate = `
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <title>Tax Invoice</title>
  <style>
    @page {
      size: A4;
      margin: 3mm;
    }

    /* Half A4 container - width is half of A4, height is full A4 */
    .half-a4-container {
      width: 148.5mm;
      /* Half of A4 width (297mm) */
      height: 210mm;
      /* A4 height */
      margin: 0 auto;
      position: relative;
      overflow: hidden;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 9px;
      line-height: 1.2;
      color: #333;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .container {
      width: 148.5mm;
      height: auto;
      /* allow content-driven height to avoid extra bottom space */
      margin: 0 auto;
      border: 1px solid #000;
      page-break-inside: avoid;
      overflow: visible;
      position: relative;
    }

    .invoice-header {
      padding: 5px;
      background-color: #ffffff;
      margin-bottom: 0;
      border-bottom: 1px solid #eee;
      page-break-inside: avoid;
      display: table;
      width: 100%;
      box-sizing: border-box;
      height: 40px;
    }

    .header-left {
      display: table-cell;
      width: 35%;
      vertical-align: top;
      padding-top: 5px;
    }

    .header-right {
      display: table-cell;
      width: 65%;
      vertical-align: top;
      text-align: right;
    }

    .logo-crop {
      height: 70px;
      width: 160px;
      overflow: hidden;
      display: flex;
      align-items: center;
    }

    .invoice-logo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .invoice-title {
      font-weight: bold;
      font-size: 12px;
      color: #2c3e50;
      margin: 0 0 5px 0;
      text-align: right;
    }

    .header-info-table {
      border-collapse: collapse;
      float: right;
      clear: both;
      margin-top: 0;
    }

    .header-info-table td {
      padding: 1px 0;
      font-size: 8px;
      line-height: 1.1;
    }

    .header-info-table .label-col {
      text-align: left;
      padding-right: 8px;
      white-space: nowrap;
      min-width: 50px;
    }

    .header-info-table .value-col {
      text-align: left;
      white-space: nowrap;
    }

    .address-section {
      overflow: visible;
      font-size: 9px;
      padding: 4px;
      page-break-inside: avoid;
      min-height: 60px;
    }

    .bill-to,
    .ship-to {
      width: 48%;
      padding: 4px;
      box-sizing: border-box;
      min-height: 50px;
      vertical-align: top;
    }

    .bill-to {
      float: left;
    }

    .ship-to {
      float: right;
    }

    .business-section {
      overflow: visible;
      font-size: 9px;
      padding: 4px;
      page-break-inside: avoid;
      min-height: 50px;
      margin-bottom: 15px;
    }

    .bill-from,
    .ship-from {
      width: 48%;
      padding: 4px;
      box-sizing: border-box;
      min-height: 40px;
      vertical-align: top;
    }

    .bill-from {
      float: left;
    }

    .ship-from {
      float: right;
    }

    table.items {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1px solid #000;
      font-size: 8px;
      page-break-inside: avoid;
      margin-top: 10px;
    }

    table.items th {
      background-color: #f8f9fa;
      border: 1px solid #000;
      padding: 4px 3px;
      text-align: center;
      font-weight: bold;
      font-size: 8px;
      color: #2c3e50;
    }

    table.items td {
      border: 1px solid #000;
      padding: 4px 3px;
      text-align: center;
      font-size: 8px;
      vertical-align: top;
    }

    .description-cell {
      text-align: left !important;
      max-width: 90px;
      word-wrap: break-word;
      white-space: normal;
    }

    .amount-in-words {
      margin: 0;
      padding: 4px;
      background-color: #ffffff;
      font-family: 'Arial', sans-serif;
      font-size: 9px;
      line-height: 1.2;
      color: #2c3e50;
      page-break-inside: avoid;
      min-height: 30px;
    }

    .signature-section {
      background-color: #ffffff;
      padding: 4px;
      border-radius: 4px;
      overflow: visible;
      page-break-inside: avoid;
      margin-bottom: 2px;
      min-height: 40px;
    }

    .signature-content {
      width: 100%;
      overflow: hidden;
    }

    .qr-section {
      float: left;
      width: 30%;
      text-align: left;
    }

    .qr-section img,
    .qr-section svg {
      max-width: 35px;
      max-height: 35px;
    }

    .signature-box {
      float: right;
      width: 30%;
      text-align: center;
      font-size: 8px;
      color: #2c3e50;
    }

    .signature-box .bold {
      font-size: 9px;
      margin-bottom: 2px;
      font-weight: 600;
      color: #000000;
    }

    .signature-box img {
      height: 20px;
      margin: 3px auto;
      display: block;
      margin-left: auto;
      object-fit: contain;
    }

    .bold {
      font-weight: 600;
      color: #2c3e50;
    }

    .taxes-cell {
      font-size: 7px;
      line-height: 1.2;
    }

    /* Clear floats */
    .clearfix::after {
      content: "";
      display: table;
      clear: both;
    }

    /* Print-specific styles */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .container {
        page-break-inside: avoid;
      }

      table.items {
        page-break-inside: avoid;
      }

      .signature-section {
        page-break-inside: avoid;
      }

      .header-info-table {
        page-break-inside: avoid;
      }
    }

    /* Font loading fallbacks for consistent rendering */
    @font-face {
      font-family: 'Arial';
      src: local('Arial'), local('Helvetica Neue'), local('Helvetica'), local('sans-serif');
    }
  </style>
</head>

<body>
  <div class="container">
    <!-- Fixed Header Section with proper alignment -->
    <div class="invoice-header">
      <div class="header-left">
        <div class="logo-crop">
          <img src="${logoBase64}" alt="KRPL Logo" class="invoice-logo">
        </div>
      </div>

      <div class="header-right">
        <div class="invoice-title">Tax Invoice/Bill of Supply/Cash Memo</div>

        <table class="header-info-table">
          <tr>
            <td class="label-col bold">Invoice Date:</td>
            <td class="value-col">{{formatDate order.date " DD MMM YYYY,dddd"}}</td>
          </tr>
          <tr>
            <td class="label-col bold">Invoice No:</td>
            <td class="value-col">PPH-{{order.id}}</td>
          </tr>
          <tr>
            <td class="label-col bold">Order No:</td>
            <td class="value-col">{{order.orderNumber}}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="address-section clearfix">
      <div class="bill-to">
        <div class="bold">Billing Address</div>
        <br>
        {{#if order.shippingDetails}}
          <div>{{user.name}}</div>
          <div>{{order.shippingDetails.address}}</div>
          {{#if order.shippingDetails.address2}}
            <div>{{order.shippingDetails.address2}}</div>
          {{/if}}
          <div>{{order.shippingDetails.city}}, {{order.shippingDetails.state}} {{order.shippingDetails.zipCode}}</div>
        {{else}}
          <div>{{user.name}}</div>
          <div>{{user.email}}</div>
          <div>Address details not available</div>
        {{/if}}
        <div>GST Number: {{buyer.gstNumber}}</div>
      </div>
      <div class="ship-to">
        <div class="bold">Shipping Address</div>
        <br>
        {{#if order.shippingDetails}}
          <div>{{user.name}}</div>
          <div>{{order.shippingDetails.address}}</div>
          {{#if order.shippingDetails.address2}}
            <div>{{order.shippingDetails.address2}}</div>
          {{/if}}
          <div>{{order.shippingDetails.city}}, {{order.shippingDetails.state}} {{order.shippingDetails.zipCode}}</div>
        {{else}}
          <div>{{user.name}}</div>
          <div>{{user.email}}</div>
          <div>Address details not available</div>
        {{/if}}
        <div>GST Number: {{buyer.gstNumber}}</div>
      </div>
    </div>

    <div class="business-section clearfix">
      <div class="bill-from">
        <div class="bold">Bill From</div>
        <br>
        <div class="bold">Kaushal Ranjeet pvt. ltd.</div>
        <div>Building no 2072, Chandigarh Royale City</div>
        <div>Bollywood Gully</div>
        <div>Banur SAS Nagar</div>
        <div>140601</div>
        <div>GST Number: 03AAICK9276F1ZC</div>
      </div>
      <div class="ship-from">
        <div class="bold">Ship From</div>
        <br>
        <div class="bold">Kaushal Ranjeet pvt. ltd.</div>
        <div>Building no 2072, Chandigarh Royale City</div>
        <div>Bollywood Gully</div>
        <div>Banur SAS Nagar</div>
        <div>140601</div>
        <div>GST Number: 03AAICK9276F1ZC</div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Description</th>
          <th>Qty</th>
          <th>MRP</th>
          <th>Discount</th>
          <th>Taxable Value</th>
          <th>Delivery Charges</th>
          <th>Taxes</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each order.items}}
          <tr>
            <td>{{add @index 1}}</td>
            <td class="description-cell">{{this.product.name}}</td>
            <td>{{this.quantity}}</td>
            <td>{{formatMoney (multiply this.product.mrp this.quantity)}}</td>
            <td>{{formatMoney (multiply (subtract this.product.mrp this.price) this.quantity)}}</td>
            <td>{{calculateTaxableValue this.price this.quantity this.product.gstRate}}</td>
            <td>{{calculateDeliveryTaxable this.product.deliveryCharges this.quantity this.product.gstRate}}</td>
            <td class="taxes-cell">{{{calculateTaxesWithDelivery this.price this.quantity this.product.deliveryCharges this.product.gstRate ../isSameState}}}</td>
            <td>{{formatMoney (add (multiply this.price this.quantity) (multiply this.product.deliveryCharges this.quantity))}}</td>
          </tr>
        {{/each}}
      </tbody>
    </table>

    <div class="amount-in-words">
      <span class="bold">Amount in words:</span>
      <span style="font-style: italic; margin-left: 5px;">{{amountInWords total}} Only</span>
    </div>

    <div class="signature-section">
      <div class="signature-content clearfix">
        <div class="qr-section">
          <div style="margin-bottom: 5px; font-size: 10px; color: #666;">Scan to verify invoice</div>
          <div style="margin-top: 10px;">
            {{{qrCode}}}
          </div>
        </div>
        <div class="signature-box">
          <img src="${signatureBase64}" alt="Authorized Signature" />
          <div>KK</div>
          <div class="bold">(Authorized Signatory)</div>
        </div>
      </div>

      <!-- Declaration section inside container -->
      <div style="padding: 12px; font-size: 10px; line-height: 1.4; color: #333; background-color: #f9f9f9; border-top: 1px solid #000; margin-top: 2px; max-width: 800px;">

        <!-- Top Row -->
        <div style="display: flex; justify-content: space-between; gap: 20px;">

          <!-- (Left) -->
          <div style="flex: 1; padding-right: 15px;">
            <div style="font-weight: bold; font-size: 11px; color: #2c3e50;">
              Contact Us
            </div>
            <div style="text-align: justify;">
              For any questions, please call our customer care at +91 98774 54036. You can also use the Contact Us section in our App or visit krpl.lelekart.com/contact for assistance and support regarding your orders.
            </div>
          </div>

          <!-- (Right) -->
          <div style="flex: 1; padding-left: 15px;">
            <div style="font-weight: bold; font-size: 11px; color: #2c3e50;">
              Legal Jurisdiction
            </div>
            <div style="text-align: justify; margin-bottom: 6px;">
              All disputes are subject to Mohali, SAS Nagar Punjab jurisdiction only.
            </div>
            <div style="font-weight: bold; font-size: 11px; color: #2c3e50;">
              Returns & Claims
            </div>
            <div style="text-align: justify; margin-bottom: 6px;">
              Goods once sold will not be taken back.
            </div>
          </div>
        </div>
        <!-- Middle Row -->
        <div style="display: flex; justify-content: space-between; gap: 20px;">

          <!-- (Left) -->
          <div style="flex: 1; padding-right: 15px;">
            <div style="font-weight: bold; font-size: 11px; color: #2c3e50;">
              Delivery & Shipping
            </div>
            <div style="text-align: justify;">
              Delivery timelines vary based on order volume. We are not liable for delays caused by transport/logistics partners.
            </div>
          </div>

          <!-- (Right) -->
          <div style="flex: 1; padding-left: 15px;">
            <div style="font-weight: bold; font-size: 11px; color: #2c3e50;">
              Regd. Office
            </div>
            <div style="text-align: justify;">
              Building no 2072, Chandigarh Royale City, Bollywood Gully Banur, SAS Nagar, Punjab, India - 140601
            </div>
          </div>
        </div>
        <div style="display:flex; justify-content:center; align-items:center; font-weight:bold; margin-top:10px;">Thank you for doing business with us</div>
      </div>
    </div>
  </div>
</body>

</html>
`;

    handlebars.registerHelper("calculateTotal", function (items) {
      return items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );
    });

    // Additional helpers for math operations
    handlebars.registerHelper("multiply", function (a: number, b: number) {
      return a * b;
    });

    handlebars.registerHelper("add", function (a: number, b: number) {
      return a + b;
    });

    handlebars.registerHelper("subtract", function (a: number, b: number) {
      return a - b;
    });

    // Add formatDate helper if not already present
    handlebars.registerHelper(
      "formatDate",
      function (date: string, format: string) {
        // This is a placeholder - you'll need to implement proper date formatting
        // or use a library like moment.js or date-fns
        const d = new Date(date);
        return d.toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "2-digit",
        });
      }
    );

    // Register 'gt' helper for greater-than comparisons
    handlebars.registerHelper("gt", function (a, b) {
      return a > b;
    });

    const template = handlebars.compile(invoiceTemplate);
    return template(data);
  } catch (error) {
    console.error("Error generating invoice HTML:", error);
    throw error;
  }
}

/**
 * Get the tax invoice template - wrapper for backward compatibility
 */
function getTaxInvoiceTemplate(): string {
  // This is now just a placeholder - actual generation happens in generateInvoiceHtml
  return "";
}
