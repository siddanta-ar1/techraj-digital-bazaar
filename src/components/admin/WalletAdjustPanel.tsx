"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Minus,
  Search,
  Loader2,
  User,
  Wallet,
  CheckCircle2,
  X,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useModal } from "@/hooks/useModal";
import { useRouter } from "next/navigation";

interface UserResult {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  wallet_balance: number;
}

export function WalletAdjustPanel() {
  const router = useRouter();
  const { modalState, closeModal, showSuccess, showError, showConfirm } = useModal();

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);

  const [type, setType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced user search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (search.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/admin/wallet/adjust?search=${encodeURIComponent(search)}`,
        );
        const data = await res.json();
        setSearchResults(data.users || []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [search]);

  const selectUser = (user: UserResult) => {
    setSelectedUser(user);
    setSearch(user.full_name);
    setShowDropdown(false);
  };

  const clearUser = () => {
    setSelectedUser(null);
    setSearch("");
    setAmount("");
    setNote("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showError("Invalid Amount", "Please enter a valid amount greater than 0.");
      return;
    }
    if (type === "debit" && numAmount > selectedUser.wallet_balance) {
      showError(
        "Insufficient Balance",
        `${selectedUser.full_name} only has Rs. ${selectedUser.wallet_balance.toLocaleString()} in their wallet.`,
      );
      return;
    }

    const newBal =
      type === "credit"
        ? selectedUser.wallet_balance + numAmount
        : selectedUser.wallet_balance - numAmount;

    showConfirm(
      `Confirm ${type === "credit" ? "Credit" : "Debit"}`,
      `${type === "credit" ? "Add" : "Remove"} Rs. ${numAmount.toLocaleString()} ${type === "credit" ? "to" : "from"} ${selectedUser.full_name}'s wallet?\n\nCurrent balance: Rs. ${selectedUser.wallet_balance.toLocaleString()}\nNew balance: Rs. ${newBal.toLocaleString()}${note ? `\n\nNote: ${note}` : ""}`,
      async () => {
        setSubmitting(true);
        try {
          const res = await fetch("/api/admin/wallet/adjust", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: selectedUser.id,
              type,
              amount: numAmount,
              note,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to adjust wallet");

          showSuccess(
            type === "credit" ? "Wallet Credited" : "Wallet Debited",
            data.message,
          );

          // Update local user balance for display
          setSelectedUser((prev) =>
            prev ? { ...prev, wallet_balance: data.newBalance } : prev,
          );
          setAmount("");
          setNote("");
          router.refresh();
        } catch (err: any) {
          showError("Adjustment Failed", err.message);
        } finally {
          setSubmitting(false);
        }
      },
    );
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-white border-b border-violet-100 flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Wallet className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Direct Wallet Adjustment</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Credit or debit any user's wallet — use for WhatsApp/direct payments
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* User Search */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Search User
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (selectedUser) setSelectedUser(null);
                }}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-sm"
              />
              {(searching) && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
              )}
              {selectedUser && !searching && (
                <button
                  type="button"
                  onClick={clearUser}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectUser(u)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-violet-50 transition-colors text-left border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-slate-100 rounded-lg">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{u.full_name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-emerald-600 shrink-0">
                      Rs. {Number(u.wallet_balance).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && searchResults.length === 0 && !searching && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm text-slate-500">
                No users found.
              </div>
            )}
          </div>

          {/* Selected user info */}
          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-violet-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{selectedUser.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{selectedUser.email}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-500">Current Balance</p>
                <p className="text-sm font-bold text-emerald-600">
                  Rs. {Number(selectedUser.wallet_balance).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Credit / Debit toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("credit")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                  type === "credit"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
              >
                <Plus className="h-4 w-4" />
                Credit
              </button>
              <button
                type="button"
                onClick={() => setType("debit")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                  type === "debit"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
              >
                <Minus className="h-4 w-4" />
                Debit
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Amount (Rs.)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-sm"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Note / Reason <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. WhatsApp payment received"
              maxLength={200}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedUser || !amount || submitting}
            className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
              type === "credit"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : type === "credit" ? (
              <Plus className="h-4 w-4" />
            ) : (
              <Minus className="h-4 w-4" />
            )}
            {submitting
              ? "Processing..."
              : `${type === "credit" ? "Credit" : "Debit"} Wallet`}
          </button>
        </form>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        showConfirmButton={modalState.showConfirmButton}
      />
    </>
  );
}
