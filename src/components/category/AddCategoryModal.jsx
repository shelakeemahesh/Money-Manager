import React, { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { X } from "lucide-react";

export default function AddCategoryModal({ initial, onClose, onSave }) {
    const [name, setName] = useState(initial?.name || "");
    const [type, setType] = useState(initial?.type || "Income");
    const [icon, setIcon] = useState(initial?.icon || "💼");
    const [showPicker, setShowPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const pickerRef = useRef(null);

    // Close picker on outside click
    useEffect(() => {
        const handler = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setShowPicker(false);
            }
        };
        if (showPicker) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showPicker]);

    const handleEmojiClick = (emojiData) => {
        setIcon(emojiData.emoji);
        setShowPicker(false);
    };

    const handleSubmit = async () => {
        if (!name.trim()) { setError("Category name is required"); return; }
        setError("");
        setLoading(true);
        try {
            await onSave({ name: name.trim(), type, icon });
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to save category");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div style={styles.header}>
                    <h2 style={styles.title}>{initial ? "Edit Category" : "Add Category"}</h2>
                    <button style={styles.closeBtn} onClick={onClose}><X size={18} /></button>
                </div>

                {/* Emoji Picker Section */}
                <div style={styles.iconSection}>
                    <div style={{ position: "relative" }} ref={pickerRef}>
                        <button
                            style={styles.iconTrigger}
                            onClick={() => setShowPicker((v) => !v)}
                            type="button"
                        >
                            <span style={styles.iconDisplay}>{icon}</span>
                            <span style={styles.changeIconText}>
                                {showPicker ? "Pick Icon" : "Change icon"}
                            </span>
                        </button>

                        {showPicker && (
                            <div style={styles.pickerWrapper}>
                                <EmojiPicker
                                    onEmojiClick={handleEmojiClick}
                                    searchPlaceholder="Search emojis..."
                                    height={380}
                                    width={320}
                                    previewConfig={{ showPreview: true }}
                                    skinTonesDisabled
                                    autoFocusSearch
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Name */}
                <div style={styles.field}>
                    <label style={styles.label}>Category Name</label>
                    <input
                        style={styles.input}
                        placeholder="e.g., Freelance, Salary, Groceries"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(""); }}
                        autoFocus={!showPicker}
                    />
                </div>

                {/* Category Type */}
                <div style={styles.field}>
                    <label style={styles.label}>Category Type</label>
                    <select
                        style={styles.select}
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="Income">Income</option>
                        <option value="Expense">Expense</option>
                    </select>
                </div>

                {error && <p style={styles.error}>{error}</p>}

                {/* Footer */}
                <div style={styles.footer}>
                    <button
                        style={{ ...styles.addBtn, opacity: loading ? 0.7 : 1 }}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : initial ? "Update Category" : "Add Category"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
    },
    modal: {
        background: "#fff",
        borderRadius: 12,
        padding: "24px 28px",
        width: "100%",
        maxWidth: 440,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        maxHeight: "95vh",
        overflowY: "auto",
        position: "relative",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
        color: "#111827",
        fontFamily: "'Inter', sans-serif",
    },
    closeBtn: {
        background: "none",
        border: "none",
        color: "#9ca3af",
        cursor: "pointer",
        padding: 4,
        display: "flex",
        alignItems: "center",
    },
    iconSection: {
        marginBottom: 20,
    },
    iconTrigger: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
    },
    iconDisplay: {
        fontSize: 36,
        lineHeight: 1,
    },
    changeIconText: {
        fontSize: 13,
        color: "#6b7280",
        fontFamily: "'Inter', sans-serif",
    },
    pickerWrapper: {
        position: "absolute",
        top: 44,
        left: 0,
        zIndex: 200,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        borderRadius: 12,
        overflow: "hidden",
    },
    field: {
        marginBottom: 16,
    },
    label: {
        display: "block",
        fontSize: 13,
        fontWeight: 500,
        color: "#374151",
        marginBottom: 6,
        fontFamily: "'Inter', sans-serif",
    },
    input: {
        width: "100%",
        padding: "10px 14px",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        fontSize: 14,
        color: "#111827",
        outline: "none",
        fontFamily: "'Inter', sans-serif",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
    },
    select: {
        width: "100%",
        padding: "10px 14px",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        fontSize: 14,
        color: "#111827",
        outline: "none",
        fontFamily: "'Inter', sans-serif",
        boxSizing: "border-box",
        background: "#fff",
        cursor: "pointer",
        appearance: "auto",
    },
    error: {
        color: "#ef4444",
        fontSize: 13,
        marginBottom: 12,
        background: "#fef2f2",
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #fecaca",
        fontFamily: "'Inter', sans-serif",
    },
    footer: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: 8,
    },
    addBtn: {
        padding: "10px 24px",
        background: "#7c3aed",
        border: "none",
        borderRadius: 8,
        color: "#fff",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        transition: "background 0.2s",
    },
};
