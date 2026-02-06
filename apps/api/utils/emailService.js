import { createTransport } from "nodemailer";

// Create transporter for sending emails with App Password
const createTransporter = () => {
  return createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.SENDER_EMAIL_ADDRESS,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Format currency helper
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Generate beautiful HTML email template
const generateOrderEmailHTML = (userName, order) => {
  // Determine email type based on order status
  const isDelivered = order.status === "delivered";
  const emailTitle = isDelivered ? "Order Delivered" : "Order Confirmation";
  const emailMessage =
    order.status === "delivered"
      ? `Great news! Your order #${order._id} has been delivered.`
      : `Thank you for your order! Your order #${order._id} has been confirmed.`;

  // Calculate order breakdown (same logic as in orderController)
  const subtotal = order.items.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  const freeDeliveryThreshold = parseFloat(
    process.env.FREE_DELIVERY_THRESHOLD || "999"
  );
  const shipping = subtotal > freeDeliveryThreshold ? 0 : 15;
  const taxRate = parseFloat(process.env.TAX_RATE || "0");
  const tax = subtotal * taxRate;

  const itemsHTML = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
        <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">${
          item.name
        }</div>
        <div style="font-size: 14px; color: #666;">Quantity: ${
          item.quantity
        }</div>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 600; color: #2563eb;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - BabyMart</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
  
  <!-- Email Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Main Content Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
              <div style="background-color: white; display: inline-block; padding: 15px 25px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="margin: 0; color: #2563eb; font-size: 28px; font-weight: 700;">BabyMart</h1>
              </div>
              <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${emailTitle} ${order.status === "delivered" ? "🚚" : "🎉"}</h2>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">${order.status === "delivered" ? "Your order has been delivered!" : "Thank you for your purchase"}</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Hi ${userName}! 👋</h3>
              <p style="margin: 0; color: #666; font-size: 15px; line-height: 1.6;">
                ${emailMessage}
              </p>
            </td>
          </tr>

          <!-- Order Details Card -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Order Number</div>
                          <div style="font-size: 18px; font-weight: 700; color: #2563eb;">#${
                            order._id
                          }</div>
                        </td>
                        <td align="right">
                          <div style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Status</div>
                          <div style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                            ${order.status.toUpperCase()}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Items -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h4 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">Order Items</h4>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                ${itemsHTML}
                
                <!-- Subtotal -->
                <tr>
                  <td style="padding: 15px; background-color: #f8fafc; font-weight: 600; color: #666;">Subtotal</td>
                  <td style="padding: 15px; background-color: #f8fafc; text-align: right; font-weight: 600; color: #666;">${formatCurrency(
                    subtotal
                  )}</td>
                </tr>
                <tr>
                  <td style="padding: 15px; background-color: #f8fafc; font-weight: 600; color: #666;">Shipping</td>
                  <td style="padding: 15px; background-color: #f8fafc; text-align: right; font-weight: 600; color: #666;">${formatCurrency(
                    shipping
                  )}</td>
                </tr>
                <tr>
                  <td style="padding: 15px; background-color: #f8fafc; font-weight: 600; color: #666;">Tax</td>
                  <td style="padding: 15px; background-color: #f8fafc; text-align: right; font-weight: 600; color: #666;">${formatCurrency(
                    tax
                  )}</td>
                </tr>
                
                <!-- Total -->
                <tr style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                  <td style="padding: 20px; color: #ffffff; font-weight: 700; font-size: 16px;">TOTAL</td>
                  <td style="padding: 20px; text-align: right; color: #ffffff; font-weight: 700; font-size: 20px;">${formatCurrency(
                    order.total
                  )}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          ${
            order.shippingAddress
              ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h4 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">📦 Shipping Address</h4>
              <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <p style="margin: 0; color: #1a1a1a; line-height: 1.6; font-size: 15px;">
                  ${order.shippingAddress.street}<br>
                  ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
                  ${order.shippingAddress.country}
                </p>
              </div>
            </td>
          </tr>
          `
              : ""
          }

          <!-- What's Next Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 8px; padding: 25px; border-left: 4px solid #2563eb;">
                ${
                  order.status === "delivered"
                    ? `
                <h4 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px; font-weight: 600;">🎉 Order Delivered Successfully!</h4>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #1e40af; vertical-align: top; width: 30px;">
                      <div style="background-color: #059669; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">✓</div>
                    </td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px;">
                      <strong>Delivered</strong> - Your order has been successfully delivered!
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #1e40af; vertical-align: top;">
                      <div style="background-color: #2563eb; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">⭐</div>
                    </td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px;">
                      <strong>Leave a Review</strong> - Help other customers with your feedback
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #1e40af; vertical-align: top;">
                      <div style="background-color: #2563eb; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">🛒</div>
                    </td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px;">
                      <strong>Shop Again</strong> - Discover more amazing products
                    </td>
                  </tr>
                </table>
                <p style="margin: 15px 0 0 0; color: #1e40af; font-size: 13px; font-style: italic;">
                  😊 We hope you love your purchase!
                </p>
                `
                    : `
                <h4 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px; font-weight: 600;">📋 What Happens Next?</h4>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #1e40af; vertical-align: top; width: 30px;">
                      <div style="background-color: #2563eb; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">1</div>
                    </td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px;">
                      <strong>Processing</strong> - We're preparing your order for shipment
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #1e40af; vertical-align: top;">
                      <div style="background-color: #2563eb; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">2</div>
                    </td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px;">
                      <strong>Shipped</strong> - You'll receive tracking info via email
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #1e40af; vertical-align: top;">
                      <div style="background-color: #2563eb; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">3</div>
                    </td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px;">
                      <strong>In Transit</strong> - Track your package in real-time
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #1e40af; vertical-align: top;">
                      <div style="background-color: #2563eb; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">4</div>
                    </td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px;">
                      <strong>Delivered</strong> - Enjoy your purchase! 🎁
                    </td>
                  </tr>
                </table>
                <p style="margin: 15px 0 0 0; color: #1e40af; font-size: 13px; font-style: italic;">
                  ⏱️ Estimated delivery: 3-5 business days
                </p>
                `
                }
              </div>
            </td>
          </tr>

          <!-- Help Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #fde68a;">
                <p style="margin: 0 0 15px 0; color: #92400e; font-size: 15px; font-weight: 600;">Need Help? We're Here! 💬</p>
                <p style="margin: 0; color: #78350f; font-size: 14px;">
                  📧 <a href="mailto:support@babymart.com" style="color: #92400e; text-decoration: none; font-weight: 600;">support@babymart.com</a><br>
                  📞 +1 (555) 123-4567<br>
                  🕒 Mon-Fri: 9AM - 6PM EST
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="margin: 0 0 15px 0; color: #ffffff; font-size: 16px; font-weight: 600;">Thank you for choosing BabyMart!</p>
              <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px;">
                We appreciate your business and trust in our products.
              </p>
              <div style="margin: 0 0 15px 0;">
                <a href="#" style="display: inline-block; margin: 0 10px; color: #60a5fa; text-decoration: none; font-size: 14px;">Facebook</a>
                <span style="color: #4b5563;">|</span>
                <a href="#" style="display: inline-block; margin: 0 10px; color: #60a5fa; text-decoration: none; font-size: 14px;">Instagram</a>
                <span style="color: #4b5563;">|</span>
                <a href="#" style="display: inline-block; margin: 0 10px; color: #60a5fa; text-decoration: none; font-size: 14px;">Twitter</a>
              </div>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © 2025 BabyMart. All rights reserved.<br>
                123 Commerce Street, New York, NY 10001
              </p>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>
  `;
};

// Generate plain text version for email clients that don't support HTML
const generateOrderEmailContent = (userName, order) => {
  // Determine email type based on order status
  const isDelivered = order.status === "delivered";
  const emailTitle = isDelivered ? "Order Delivered" : "Order Confirmation";
  const emailMessage = isDelivered
    ? `Great news! Your order #${order._id} has been delivered! We hope you love your purchase.`
    : `Thank you for your order! Your order #${order._id} has been confirmed and is now being prepared for shipment. We'll keep you updated every step of the way.`;

  // Calculate order breakdown (same logic as in orderController)
  const subtotal = order.items.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  const freeDeliveryThreshold = parseFloat(
    process.env.FREE_DELIVERY_THRESHOLD || "999"
  );
  const shipping = subtotal > freeDeliveryThreshold ? 0 : 15;
  const taxRate = parseFloat(process.env.TAX_RATE || "0");
  const tax = subtotal * taxRate;

  const itemsList = order.items
    .map(
      (item) =>
        `• ${item.name} (Qty: ${item.quantity}) - ${formatCurrency(item.price * item.quantity)}`
    )
    .join("\n");

  return {
    subject: `${emailTitle} #${order._id} - BabyMart`,
    message: `
Hi ${userName},

${emailMessage}

Order Details:
- Order Number: #${order._id}
- Status: ${order.status}

Items Ordered:
${itemsList}

Order Summary:
- Subtotal: ${formatCurrency(subtotal)}
- Shipping: ${shipping === 0 ? "Free" : formatCurrency(shipping)}
- Tax: ${formatCurrency(tax)}
- Total: ${formatCurrency(order.total)}

${
  order.shippingAddress
    ? `
Shipping Address:
${order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}
${order.shippingAddress.country}
`
    : ""
}

${
  order.status === "delivered"
    ? `Your order has been successfully delivered! We hope you love your purchase.

What's Next?
- Leave a review to help other customers
- Contact us if anything doesn't meet your expectations
- Check out our latest products for your next order`
    : `What Happens Next?
1. Processing - We're preparing your order for shipment
2. Shipped - You'll receive tracking info via email
3. In Transit - Track your package in real-time
4. Delivered - Enjoy your purchase!

Estimated delivery: 3-5 business days`
}

Need Help?
Email: support@babymart.com
Phone: +1 (555) 123-4567
Hours: Mon-Fri: 9AM - 6PM EST

Thanks for choosing BabyMart!
    `,
  };
};

// Send order confirmation email
const sendOrderConfirmationEmail = async ({ userEmail, userName, order }) => {
  try {
    const emailContent = generateOrderEmailContent(userName, order);
    const htmlContent = generateOrderEmailHTML(userName, order);

    const transporter = createTransporter();

    const mailOptions = {
      from: `"BabyMart" <${
        process.env.SENDER_EMAIL_ADDRESS || "noor.jsdivs@gmail.com"
      }>`,
      to: userEmail,
      subject: emailContent.subject,
      text: emailContent.message, // Plain text fallback
      html: htmlContent, // Beautiful HTML version
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Failed to send order confirmation:", error.message);
    // Don't throw - we don't want order creation to fail if email fails
    return {
      success: false,
      error: error.message,
      message: "Email service unavailable - order created successfully",
    };
  }
};

// Send invoice email
const sendInvoiceEmail = async ({
  to,
  subject,
  message,
  invoiceHtml,
  invoiceNumber,
}) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"BabyMart" <${
        process.env.SENDER_EMAIL_ADDRESS || "reactjsbd@gmail.com"
      }>`,
      to,
      subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin: 0;">Babymart - Invoice</h2>
          </div>
          
          <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">
              ${message.replace(/\n/g, "<br>")}
            </p>
          </div>
          
          <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            ${invoiceHtml}
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Thank you for choosing Babymart!<br>
              If you have any questions, please contact us at support@babymart.com
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// Send general email
const sendEmail = async ({ to, subject, message, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"BabyMart" <${
        process.env.SENDER_EMAIL_ADDRESS || "reactjsbd@gmail.com"
      }>`,
      to,
      subject,
      text: message,
      html:
        html ||
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin: 0;">Babymart</h2>
          </div>
          
          <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <p style="color: #374151; line-height: 1.6;">
              ${message.replace(/\n/g, "<br>")}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Thank you for choosing Babymart!<br>
              If you have any questions, please contact us at support@babymart.com
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, userName, resetUrl) => {
  const transporter = createTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - BabyMart</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #29beb3 0%, #a96bde 100%); padding: 40px 30px; text-align: center;">
              <div style="background-color: white; display: inline-block; padding: 15px 25px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="margin: 0; color: #29beb3; font-size: 28px; font-weight: 700;">BabyMart</h1>
              </div>
              <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">🔐 Reset Your Password</h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Hi ${userName}! 👋</h3>
              <p style="margin: 0 0 20px 0; color: #666; font-size: 15px; line-height: 1.6;">
                We received a request to reset your password for your BabyMart account. If you didn't make this request, you can safely ignore this email.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #666; font-size: 15px; line-height: 1.6;">
                To reset your password, click the button below:
              </p>

              <!-- Reset Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #29beb3 0%, #a96bde 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(41, 190, 179, 0.2);">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                  <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
                </p>
              </div>

              <p style="margin: 0 0 15px 0; color: #666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px 0; word-break: break-all;">
                <a href="${resetUrl}" style="color: #29beb3; text-decoration: none; font-size: 14px;">${resetUrl}</a>
              </p>

              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 13px;">
                Best regards,<br>
                <strong>The BabyMart Team</strong>
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} BabyMart. All rights reserved.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;

  const mailOptions = {
    from: `"BabyMart" <${process.env.SENDER_EMAIL_ADDRESS}>`,
    to: email,
    subject: "Reset Your Password - BabyMart",
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

export {
  sendInvoiceEmail,
  sendEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
};
