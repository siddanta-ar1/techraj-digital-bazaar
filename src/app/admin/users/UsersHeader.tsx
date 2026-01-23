"use client";

import { Download } from "lucide-react";

interface UsersHeaderProps {
  users: any[];
}

export default function UsersHeader({ users }: UsersHeaderProps) {
  const exportToCSV = () => {
    const headers = [
      "Full Name",
      "Email",
      "Phone",
      "Role",
      "Wallet Balance",
      "Referral Code",
      "Email Verified",
      "Created Date",
    ];

    const csvData = users.map((user) => [
      user.full_name || "",
      user.email || "",
      user.phone || "",
      user.role || "user",
      user.wallet_balance || 0,
      user.referral_code || "",
      user.email_verified ? "Yes" : "No",
      new Date(user.created_at).toLocaleDateString(),
    ]);

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
        `users-export-${new Date().toISOString().split("T")[0]}.csv`,
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
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </button>
    </div>
  );
}
