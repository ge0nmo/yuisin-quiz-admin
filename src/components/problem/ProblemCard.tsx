import { Edit, Trash2 } from "lucide-react";
import BlockRenderer from "@/src/components/ui/BlockRenderer";
import { Problem, Choice } from "@/src/types";

// Note: I'm assuming BlockRenderer is exported as named or default. Checking page.tsx, it was `import BlockRenderer from ...` so it's default.
// But wait, in the file lookup earlier it was imported as `import BlockRenderer from "@/src/components/ui/BlockRenderer";`.
// I will use default import to match.

interface Props {
    problem: Problem;
    onEdit: (p: Problem) => void;
    onDelete: (id: number) => void;
}

export default function ProblemCard({ problem, onEdit, onDelete }: Props) {
    return (
        <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex justify-between items-center transition-colors group-hover:bg-blue-50/50">
                <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg text-sm shadow-sm">
                    No. {problem.number}
                </span>
                <div className="flex gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                    <button
                        onClick={() => onEdit(problem)}
                        className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-100 transition"
                        title="수정"
                    >
                        <Edit size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(problem.id)}
                        className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-100 transition"
                        title="삭제"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
            <div className="p-6">
                <div className="mb-6 prose prose-sm max-w-none text-gray-800">
                    <BlockRenderer blocks={problem.content} />
                </div>

                <div className="grid grid-cols-1 gap-2 mb-4">
                    {problem.choices.map((c: Choice) => (
                        <div
                            key={c.number}
                            className={`flex items-start p-3 rounded-xl border transition-all ${c.isAnswer
                                ? 'bg-green-50 border-green-200 shadow-sm'
                                : 'bg-white border-gray-100 hover:bg-gray-50'
                                }`}
                        >
                            <span
                                className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${c.isAnswer
                                    ? 'bg-green-500 text-white shadow-sm'
                                    : 'bg-gray-200 text-gray-600'
                                    }`}
                            >
                                {c.number}
                            </span>
                            <span
                                className={`text-sm ${c.isAnswer ? 'font-bold text-green-800' : 'text-gray-700'
                                    }`}
                            >
                                {c.content}
                            </span>
                        </div>
                    ))}
                </div>

                {problem.explanation && problem.explanation.length > 0 && (
                    <div className="bg-amber-50 p-5 rounded-2xl text-sm text-gray-800 border border-amber-100 mt-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-200"></div>
                        <strong className="block text-amber-800 mb-2 font-bold flex items-center gap-2">
                            💡 해설
                        </strong>
                        <div className="opacity-90">
                            <BlockRenderer blocks={problem.explanation} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
