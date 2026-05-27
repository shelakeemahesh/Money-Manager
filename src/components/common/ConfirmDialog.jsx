import { X } from "lucide-react";

/**
 * Reusable confirmation dialog.
 * Props:
 *   open        - boolean to show/hide
 *   title       - dialog title string
 *   message     - body text
 *   confirmLabel - button label (default "Confirm")
 *   confirmClass - extra classes for custom coloring
 *   onConfirm   - called on confirm click
 *   onCancel    - called on cancel / × click
 */
const ConfirmDialog = ({
    open,
    title = "Are you sure?",
    message,
    confirmLabel = "Confirm",
    confirmClass = "",
    onConfirm,
    onCancel,
}) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center px-4 animate-fade-in">
            <div className="card w-full max-w-sm p-6 animate-scale-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
                    <button onClick={onCancel} className="transition cursor-pointer" style={{ color: "var(--text-muted)" }}>
                        <X size={16} />
                    </button>
                </div>
                <p className="text-xs mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{message}</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-xs font-semibold rounded-[var(--radius-sm)] cursor-pointer transition-all duration-120 ${
                            confirmClass.includes("bg-rose") || confirmClass.includes("bg-red")
                                ? "bg-rose-600 hover:bg-rose-700 text-white border border-rose-700"
                                : "btn-brand"
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
