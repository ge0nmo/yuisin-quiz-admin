"use client";

import { FileText, Trash2, CheckCircle2 } from "lucide-react";
import { Question } from "@/src/types";

interface Props {
    question: Question;
    onViewProblem: () => void;
    onDelete: () => void;
}

export default function QuestionCard({ question, onViewProblem, onDelete }: Props) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">{question.title}</h1>
                        <button
                            onClick={onViewProblem}
                            className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-100 transition"
                        >
                            <FileText size={16} /> 문제 보기
                        </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">작성자: {question.username}</span>
                        <span>{new Date(question.createdAt).toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {question.answeredByAdmin && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold border border-green-200">
              답변완료
            </span>
                    )}
                    <button
                        onClick={onDelete}
                        className="flex items-center gap-1.5 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                    >
                        <Trash2 size={16} /> 질문 삭제
                    </button>
                </div>
            </div>

            <div
                className="prose prose-lg max-w-none text-gray-900"
                dangerouslySetInnerHTML={{ __html: question.content }}
            />
        </div>
    );
}