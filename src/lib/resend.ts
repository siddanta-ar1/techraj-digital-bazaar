import { Resend } from "resend";

// Use the key provided. In production, use process.env.RESEND_API_KEY
export const resend = new Resend("re_WFLXDRqa_73DFEKT5zxQjjr9GJ6HCcbRz");

export const sendOrderEmail = async (
  email: string,
  orderNumber: string,
  amount: number,
) => {
  try {
    await resend.emails.send({
      from: "TechRaj Digital <onboarding@resend.dev>", // Change to your verified domain later
      to: email,
      subject: `Order Confirmed: ${orderNumber}`,
      html: `
        <h1>Order Confirmation</h1>
        <p>Thank you for your purchase!</p>
        <p><strong>Order ID:</strong> ${orderNumber}</p>
        <p><strong>Total Amount:</strong> Rs. ${amount}</p>
        <p>We will notify you once your order is processed.</p>
      `,
    });
  } catch (error) {
    console.error("Email Error:", error);
  }
};
