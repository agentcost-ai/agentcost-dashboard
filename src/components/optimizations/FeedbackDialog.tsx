"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";

interface FeedbackDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: string) => void;
    isLoading: boolean;
}

/**
 * Dialog for collecting user feedback when dismissing a recommendation.
 * Feedback is used to improve future recommendations through the learning system.
 */
export function FeedbackDialog({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
}: FeedbackDialogProps) {
    const [feedback, setFeedback] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit(feedback);
        setFeedback(""); // Reset for next use
    };

    const handleClose = () => {
        setFeedback(""); // Reset on close
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleClose}
        >
            <div
                className="w-full max-w-md rounded-xl bg-neutral-900 shadow-2xl border border-neutral-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800">
                            <MessageSquare size={18} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-medium text-white">Dismiss Recommendation</h3>
                            <p className="text-xs text-neutral-500">Help us improve</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="text-neutral-400 hover:text-white transition-colors p-1"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className="text-sm text-neutral-400 mb-3">
                        Your feedback helps us provide better recommendations in the future.
                    </p>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Why doesn't this suggestion work for you? (optional)"
                        className="w-full rounded-lg bg-neutral-800 border border-neutral-600 p-3 text-white text-sm placeholder-neutral-500 focus:border-blue-500 focus:outline-none resize-none"
                        rows={3}
                        disabled={isLoading}
                    />

                    {/* Quick options */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        {[
                            "Not applicable to my use case",
                            "Quality concerns",
                            "Already optimized",
                            "Too risky",
                        ].map((option) => (
                            <button
                                key={option}
                                onClick={() => setFeedback(prev => prev ? `${prev}. ${option}` : option)}
                                disabled={isLoading}
                                className="px-3 py-1 text-xs rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors border border-neutral-700"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t border-neutral-800">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? "Dismissing..." : "Dismiss Recommendation"}
                    </button>
                </div>
            </div>
        </div>
    );
}
