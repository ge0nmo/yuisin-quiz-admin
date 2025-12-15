"use client";

import { CheckCircle2 } from "lucide-react";
import Modal from "@/src/components/ui/Modal";
import { Problem } from "@/src/types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    problem: Problem | null;
}

export default function RelatedProblemModal({ isOpen, onClose, problem }: Props) {
    if (!problem) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`관련 문제 (No. ${problem.number})`}
            size="xl"
        >
            <div className="space-y-6">
                {/* 지문 */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-500 mb-2">지문</h4>
                    <div
                        className="prose prose-sm max-w-none text-gray-900"
                        dangerouslySetInnerHTML={{ __html: problem.content }}
                    />
                </div>

                {/* 보기 */}
                <div className="space-y-2">
                    <h4 className="text-sm font-bold text-gray-500 mb-2">보기</h4>
                    {problem.choices.map((c) => (
                        <div key={c.number} className={`flex items-start p-3 rounded-lg border ${c.isAnswer ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${c.isAnswer ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {c.number}
              </span>
                            <span className={`text-sm ${c.isAnswer ? 'font-bold text-green-800' : 'text-gray-700'}`}>
                {c.content}
              </span>
                            {c.isAnswer && <CheckCircle2 size={16} className="ml-auto text-green-600" />}
                        </div>
                    ))}
                </div>

                {/* 해설 */}
                {problem.explanation && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <h4 className="text-sm font-bold text-amber-700 mb-2">해설</h4>
                        <div
                            className="prose prose-sm max-w-none text-gray-800"
                            dangerouslySetInnerHTML={{ __html: problem.explanation }}
                        />
                    </div>
                )}
            </div>

            <div className="mt-6 text-right">
                <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
                >
                    닫기
                </button>
            </div>
        </Modal>
    );
}