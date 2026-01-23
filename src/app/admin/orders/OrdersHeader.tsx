"use client";

import { Download } from "lucide-react";

interface OrdersHeaderProps {
  orders: any[];
}

export default function OrdersHeader({ orders }: OrdersHeaderProps) {
  const exportToCSV = () => {
    const headers = [
      "Order Number",
      "Customer Name",
      "Email",
      "Phone",
      "Total Amount",
      "Final Amount",
      "Status",
      "Payment Method",
      "Payment Status",
      "Created Date",
      "Items",
    ];

    const csvData = orders.map((order) => {
      const items =
        order.order_items
          ?.map(
            (item: any) =>
              `${item.variant?.product?.name} - ${item.variant?.variant_name} (${item.quantity})`,
          )
          .join("; ") || "";

      return [
        order.order_number,
        order.user?.full_name || "Guest",
        order.user?.email || "",
        order.user?.phone || "",
        order.total_amount,
        order.final_amount,
        order.status,
        order.payment_method,
        order.payment_status,
        new Date(order.created_at).toLocaleDateString(),
        items,
      ];
    });

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `orders-export-${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={exportToCSV}
        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl font-medium"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </button>
    </div>
  );
}
