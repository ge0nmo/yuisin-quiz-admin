"use client";

import { Edit, Trash2 } from "lucide-react";
import { Answer } from "@/src/types";

interface Props {
    answers: Answer[];
    onEdit: (answer: Answer) => void;
    onDelete: (id: number) => void;
}

export default function AnswerList({ answers, onEdit, onDelete }: Props) {
    return (
        <div className="space-y-6 mb-10">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                답변 <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-sm border border-gray-200">{answers.length}</span>
            </h3>

            {answers.map((ans) => (
                <div key={ans.id} className="bg-blue-50/30 rounded-xl border border-blue-100 p-6 relative group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                A
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 block">{ans.username}</span>
                                <span className="text-xs text-gray-500">{new Date(ans.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onEdit(ans)}
                                className="p-2 bg-white text-blue-600 rounded-lg border border-gray-100 hover:shadow-sm transition"
                                title="수정"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                onClick={() => onDelete(ans.id)}
                                className="p-2 bg-white text-red-500 rounded-lg border border-gray-100 hover:shadow-sm transition"
                                title="삭제"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="text-gray-900 bg-white p-5 rounded-xl border border-gray-200 shadow-sm whitespace-pre-wrap leading-relaxed">
                        {ans.content}
                    </div>
                </div>
            ))}
        </div>
    );
}