"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, MessageCircle, CheckCircle2, XCircle } from "lucide-react";
import { getQuestions, deleteQuestion } from "@/src/services/question";
import { Question, PageInfo } from "@/src/types";

export default function QuestionListPage() {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
    const [page, setPage] = useState(1);

    // [수정 1] useCallback 제거하고 일반 비동기 함수로 선언
    const loadQuestions = async (pageNum: number) => {
        try {
            const { data, pageInfo } = await getQuestions(pageNum);
            setQuestions(data);
            setPageInfo(pageInfo || null);
        } catch (e) {
            console.error(e);
        }
    };

    // [수정 2] useEffect에서 loadQuestions 호출
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        loadQuestions(page);
        // 의존성 배열에 'page'만 넣고, 함수(loadQuestions)는 제외하여 린트 에러 방지
    }, [page]);

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deleteQuestion(id);
            loadQuestions(page); // 삭제 후 현재 페이지 갱신
        } catch (e) {
            alert("삭제 실패");
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">질문 게시판</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 text-sm uppercase">
                    <tr>
                        <th className="p-4 w-16 text-center font-bold">ID</th>
                        <th className="p-4 w-32 text-center font-bold">상태</th>
                        <th className="p-4 font-bold">제목</th>
                        <th className="p-4 w-32 text-center font-bold">작성자</th>
                        <th className="p-4 w-32 text-center font-bold">작성일</th>
                        <th className="p-4 w-20 text-center font-bold">관리</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {questions.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-10 text-center text-gray-400">
                                등록된 질문이 없습니다.
                            </td>
                        </tr>
                    ) : (
                        questions.map((q) => (
                            <tr
                                key={q.id}
                                onClick={() => router.push(`/question/${q.id}`)}
                                className="hover:bg-gray-50 transition cursor-pointer"
                            >
                                <td className="p-4 text-center text-gray-500">{q.id}</td>
                                <td className="p-4 text-center">
                                    {q.answeredByAdmin ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        <CheckCircle2 size={12} /> 답변완료
                      </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                        <XCircle size={12} /> 대기중
                      </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-gray-900 mb-1">{q.title}</div>
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <MessageCircle size={12} /> 댓글 {q.answerCount}
                                    </div>
                                </td>
                                <td className="p-4 text-center text-gray-700 font-medium">{q.username}</td>
                                <td className="p-4 text-center text-gray-500 text-sm">
                                    {new Date(q.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={(e) => handleDelete(e, q.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {pageInfo && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                        이전
                    </button>
                    <span className="text-sm font-medium text-gray-900">
            {page} / {pageInfo.totalPages || 1}
          </span>
                    <button
                        disabled={page >= pageInfo.totalPages}
                        onClick={() => setPage(page + 1)}
                        className="px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                        다음
                    </button>
                </div>
            )}
        </div>
    );
}