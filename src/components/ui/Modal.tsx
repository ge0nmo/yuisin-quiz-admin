"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: "md" | "lg" | "xl" | "2xl" | "full";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-4xl",
        "2xl": "max-w-6xl",
        full: "max-w-[95vw] h-[90vh]", // 꽉 차게
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={`w-full ${sizeClasses[size]} bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] transition-all`}
                role="dialog"
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 바디 (스크롤 가능) */}
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}