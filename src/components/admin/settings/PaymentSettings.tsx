"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Smartphone,
    Building,
    Upload,
    Save,
    Loader2,
    Trash2,
    Wallet,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { useModal } from "@/hooks/useModal";
import Modal from "@/components/ui/Modal";

interface PaymentMethodConfig {
    enabled: boolean;
    qr_image_url?: string;
    account_id?: string;
    account_name?: string;
    bank_name?: string;
    account_number?: string;
    branch?: string;
}

interface PaymentSettingsProps {
    initialSettings?: {
        esewa?: PaymentMethodConfig;
        khalti?: PaymentMethodConfig;
        bank_transfer?: PaymentMethodConfig;
    };
    onSave: (key: string, value: any) => Promise<void>;
}

export function PaymentSettings({
    initialSettings,
    onSave,
}: PaymentSettingsProps) {
    const [settings, setSettings] = useState(
        initialSettings || {
            esewa: { enabled: true },
            khalti: { enabled: true },
            bank_transfer: { enabled: true },
        },
    );
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // Modal Hooks
    const { modalState, closeModal, showError, showSuccess } = useModal();
    const supabase = createClient();

    const handleUpdate = (
        method: "esewa" | "khalti" | "bank_transfer",
        field: string,
        value: any,
    ) => {
        setSettings((prev: any) => ({
            ...prev,
            [method]: {
                ...prev[method],
                [field]: value,
            },
        }));
    };

    const handleImageUpload = async (
        method: "esewa" | "khalti" | "bank_transfer",
        file: File,
    ) => {
        try {
            setUploading(method);

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split(".").pop();
            const fileName = `${method}_qr_${Date.now()}.${fileExt}`;
            const filePath = `qr-codes/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("payment-screenshots") // Reusing payment-screenshots or create new public bucket 'assets' if preferred, but let's stick to existing
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const {
                data: { publicUrl },
            } = supabase.storage.from("payment-screenshots").getPublicUrl(filePath);

            // 3. Update State
            handleUpdate(method, "qr_image_url", publicUrl);
            showSuccess("Upload Successful", "QR code image has been uploaded.");
        } catch (error: any) {
            console.error("Upload error:", error);
            showError("Upload Failed", error.message || "Failed to upload image.");
        } finally {
            setUploading(null);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            await onSave("payment_methods", settings);
            showSuccess("Settings Saved", "Payment configuration updated successfully.");
        } catch (error: any) {
            showError("Save Failed", "Could not save payment settings.");
        } finally {
            setSaving(false);
        }
    };

    const renderToggle = (
        method: "esewa" | "khalti" | "bank_transfer",
        label: string,
    ) => {
        const isEnabled = settings[method]?.enabled;
        return (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`p-2 rounded-lg ${isEnabled ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-500"}`}
                    >
                        {isEnabled ? (
                            <CheckCircle2 className="h-5 w-5" />
                        ) : (
                            <XCircle className="h-5 w-5" />
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900">{label}</h4>
                        <p className="text-xs text-slate-500">
                            {isEnabled ? "Currently active at checkout" : "Disabled at checkout"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => handleUpdate(method, "enabled", !isEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isEnabled ? "bg-indigo-600" : "bg-slate-300"
                        }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${isEnabled ? "translate-x-6" : "translate-x-1"
                            }`}
                    />
                </button>
            </div>
        );
    };

    return (
        <>
            <div className="space-y-6">
                {/* Esewa / Khalti Settings */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* ESEWA */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-white border-b border-green-100 flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Smartphone className="h-5 w-5 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-slate-800">Esewa / Wallets</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {renderToggle("esewa", "Enable Esewa Payment")}

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Wallet ID / Phone
                                </label>
                                <input
                                    type="text"
                                    value={settings.esewa?.account_id || ""}
                                    onChange={(e) =>
                                        handleUpdate("esewa", "account_id", e.target.value)
                                    }
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    placeholder="e.g. 9846908072"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    QR Code Image
                                </label>
                                <div className="flex items-start gap-4">
                                    {settings.esewa?.qr_image_url ? (
                                        <div className="relative group w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                                            <img
                                                src={settings.esewa.qr_image_url}
                                                alt="Esewa QR"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => handleUpdate("esewa", "qr_image_url", null)}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRefs.current["esewa"]?.click()}
                                            className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer"
                                        >
                                            {uploading === "esewa" ? (
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            ) : (
                                                <Upload className="h-6 w-6" />
                                            )}
                                            <span className="text-[10px] mt-1 font-medium">Upload</span>
                                        </div>
                                    )}
                                    <div className="flex-1 text-xs text-slate-500">
                                        Upload the QR code image for Esewa. This will be shown to
                                        customers during checkout.
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={(el) => (fileInputRefs.current["esewa"] = el)}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageUpload("esewa", file);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* KHALTI (Optional - can be merged or separate) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-white border-b border-purple-100 flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Wallet className="h-5 w-5 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-slate-800">Khalti / Other</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {renderToggle("khalti", "Enable Khalti Payment")}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Wallet ID / Phone
                                </label>
                                <input
                                    type="text"
                                    value={settings.khalti?.account_id || ""}
                                    onChange={(e) =>
                                        handleUpdate("khalti", "account_id", e.target.value)
                                    }
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                                    placeholder="e.g. 9846908072"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    QR Code Image
                                </label>
                                <div className="flex items-start gap-4">
                                    {settings.khalti?.qr_image_url ? (
                                        <div className="relative group w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                                            <img
                                                src={settings.khalti.qr_image_url}
                                                alt="Khalti QR"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => handleUpdate("khalti", "qr_image_url", null)}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRefs.current["khalti"]?.click()}
                                            className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer"
                                        >
                                            {uploading === "khalti" ? (
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            ) : (
                                                <Upload className="h-6 w-6" />
                                            )}
                                            <span className="text-[10px] mt-1 font-medium">Upload</span>
                                        </div>
                                    )}
                                    <div className="flex-1 text-xs text-slate-500">
                                        Upload the QR code image for Khalti.
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={(el) => (fileInputRefs.current["khalti"] = el)}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageUpload("khalti", file);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Transfer Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Building className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800">Bank Transfer Details</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {renderToggle("bank_transfer", "Enable Bank Transfer")}

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    value={settings.bank_transfer?.bank_name || ""}
                                    onChange={(e) =>
                                        handleUpdate("bank_transfer", "bank_name", e.target.value)
                                    }
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="e.g. Nabil Bank"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    value={settings.bank_transfer?.account_number || ""}
                                    onChange={(e) =>
                                        handleUpdate(
                                            "bank_transfer",
                                            "account_number",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="0000-0000-0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Account Holder Name
                                </label>
                                <input
                                    type="text"
                                    value={settings.bank_transfer?.account_name || ""}
                                    onChange={(e) =>
                                        handleUpdate(
                                            "bank_transfer",
                                            "account_name",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    Branch (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={settings.bank_transfer?.branch || ""}
                                    onChange={(e) =>
                                        handleUpdate("bank_transfer", "branch", e.target.value)
                                    }
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="e.g. Kathmandu Branch"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 mt-4">
                            <label className="text-sm font-semibold text-slate-700">
                                Bank QR Code (Optional)
                            </label>
                            <div className="flex items-start gap-4">
                                {settings.bank_transfer?.qr_image_url ? (
                                    <div className="relative group w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                                        <img
                                            src={settings.bank_transfer.qr_image_url}
                                            alt="Bank QR"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => handleUpdate("bank_transfer", "qr_image_url", null)}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRefs.current["bank_transfer"]?.click()}
                                        className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer"
                                    >
                                        {uploading === "bank_transfer" ? (
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        ) : (
                                            <Upload className="h-6 w-6" />
                                        )}
                                        <span className="text-[10px] mt-1 font-medium">Upload</span>
                                    </div>
                                )}
                                <div className="flex-1 text-xs text-slate-500">
                                    Upload the QR code image for direct bank transfer.
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={(el) => (fileInputRefs.current["bank_transfer"] = el)}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload("bank_transfer", file);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Save Footer */}
                <div className="flex items-center justify-end pt-6 border-t border-slate-200">
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Save className="h-5 w-5" />
                        )}
                        Save Payment Settings
                    </button>
                </div>
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
