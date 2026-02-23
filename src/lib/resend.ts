import { Resend } from "resend";

// In production, strictly use process.env.RESEND_API_KEY
export const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = "TechRaj Digital <onboarding@resend.dev>";

export const sendOrderEmail = async (
  email: string,
  orderNumber: string,
  amount: number,
  items: any[],
) => {
  if (!email) return;
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Order Confirmed: ${orderNumber}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
          <h1 style="color: #4f46e5; text-align: center; margin-bottom: 20px;">Order Confirmed!</h1>

          <p style="text-align: center; color: #666;">Thank you for your purchase. Your order <strong>${orderNumber}</strong> has been received.</p>

          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #666;">Total Amount Paid</p>
            <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #111;">Rs. ${amount.toFixed(2)}</p>
          </div>

          <h3 style="border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">Order Summary</h3>
          <ul style="list-style: none; padding: 0;">
            ${items
          .map(
            (item) => `
              <li style="border-bottom: 1px solid #f3f4f6; padding: 15px 0;">
                <div style="font-weight: bold; font-size: 16px;">
                  ${item.productName || item.variant?.product?.name || "Product"}
                </div>
                <div style="color: #6b7280; font-size: 14px; margin-top: 4px;">
                  Variant: ${item.variantName || item.variant?.variant_name || "Standard"} | Qty: ${item.quantity}
                </div>

                ${item.optionSelections && Object.keys(item.optionSelections).length > 0
                ? `
                  <div style="margin-top: 8px; background: #f5f3ff; padding: 10px; border-radius: 6px; border: 1px solid #e9d5ff;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #7c3aed; margin-bottom: 4px; font-weight: bold;">Customizations</div>
                    ${Object.entries(item.optionSelections).map(([key, value]: [string, any]) =>
                  `<div style="font-size: 13px; color: #6d28d9; margin-top: 2px;">
                        <strong>${key}:</strong> ${Array.isArray(value) ? value.join(", ") : String(value)}
                      </div>`
                ).join("")}
                  </div>
                `
                : ""
              }

                ${item.delivered_code
                ? `
                  <div style="margin-top: 12px; background: #ecfdf5; padding: 15px; border: 1px dashed #10b981; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; text-transform: uppercase; color: #047857; margin-bottom: 6px; font-weight: bold;">Your Digital Code</div>
                    <div style="font-family: monospace; font-size: 20px; letter-spacing: 2px; font-weight: bold; color: #065f46; background: white; padding: 8px; border-radius: 4px;">
                      ${item.delivered_code}
                    </div>
                    <div style="font-size: 11px; color: #059669; margin-top: 6px;">
                      Please redeem this code on the respective platform.
                    </div>
                  </div>
                `
                : ""
              }
              </li>
            `,
          )
          .join("")}
          </ul>

          <div style="margin-top: 30px; text-align: center;">
            <a href="https://www.techrajshop.com/dashboard/orders" style="background: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">View Order in Dashboard</a>
          </div>

          <p style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">
            If you have any questions, reply to this email or contact support.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Order Email Error:", error);
  }
};

export const sendTopupApprovedEmail = async (
  email: string,
  amount: number,
  newBalance: number,
) => {
  if (!email) return;
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Wallet Top-up Approved! (+Rs. ${amount})`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #d1fae5; border-radius: 12px; padding: 20px;">
          <h1 style="color: #10b981; text-align: center;">Top-up Successful!</h1>

          <p style="text-align: center; color: #666;">Your wallet top-up request has been approved by the admin.</p>

          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border: 1px solid #d1fae5; text-align: center; margin: 20px 0;">
            <p style="margin: 0; color: #047857; font-size: 14px; text-transform: uppercase;">Amount Added</p>
            <p style="margin: 5px 0 0; color: #047857; font-size: 32px; font-weight: bold;">+ Rs. ${amount.toFixed(2)}</p>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <p style="font-size: 16px;"><strong>New Wallet Balance:</strong> Rs. ${newBalance.toFixed(2)}</p>
            <p style="color: #666; font-size: 14px;">You can now use these funds to purchase products.</p>
          </div>

          <div style="text-align: center;">
            <a href="https://www.techrajshop.com/products" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Shop Now</a>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Topup Email Error:", error);
  }
};

export const sendOrderStatusEmail = async (
  email: string,
  orderNumber: string,
  status: string,
  amount: number,
) => {
  if (!email) return;

  const statusConfig: Record<string, { title: string; color: string; message: string; icon: string }> = {
    completed: {
      title: "Order Completed!",
      color: "#10b981",
      message: "Great news! Your order has been completed and delivered.",
      icon: "✅",
    },
    processing: {
      title: "Order Being Processed",
      color: "#3b82f6",
      message: "Your order is now being processed. We'll notify you once it's ready.",
      icon: "⏳",
    },
    cancelled: {
      title: "Order Cancelled",
      color: "#ef4444",
      message: "Your order has been cancelled. If you didn't request this, please contact support.",
      icon: "❌",
    },
  };

  const config = statusConfig[status];
  if (!config) return; // Don't send email for unknown statuses

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `${config.icon} ${config.title} — ${orderNumber}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
          <h1 style="color: ${config.color}; text-align: center; margin-bottom: 10px;">${config.title}</h1>

          <p style="text-align: center; color: #666; margin-bottom: 20px;">${config.message}</p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Number</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #111;">${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #111;">Rs. ${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status</td>
                <td style="padding: 8px 0; text-align: right;">
                  <span style="background: ${config.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${status}</span>
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.techrajshop.com/dashboard/orders" style="background: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">View Order Details</a>
          </div>

          <p style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">
            If you have any questions, reply to this email or contact support.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Order Status Email Error:", error);
  }
};
