"use client";

import { Send } from "lucide-react";

interface Props {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    isEditing: boolean;
}

export default function AnswerForm({ value, onChange, onSubmit, onCancel, isEditing }: Props) {
    return (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
                {isEditing ? "답변 수정하기" : "답변 작성하기"}
            </h3>

            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden mb-4 shadow-sm">
        <textarea
            className="w-full p-4 border-none focus:ring-0 outline-none resize-none min-h-[200px] text-gray-900 leading-relaxed"
            placeholder="답변을 작성해주세요"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
            </div>

            <div className="flex justify-end gap-2">
                {isEditing && (
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium transition"
                    >
                        취소
                    </button>
                )}
                <button
                    onClick={onSubmit}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 font-medium shadow-sm"
                >
                    <Send size={18} />
                    {isEditing ? "수정 완료" : "답변 등록"}
                </button>
            </div>
        </div>
    );
}