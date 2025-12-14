"use client";

import { useEffect, useState, use } from "react"; // useCallback 제거
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Trash2, Edit } from "lucide-react";
import TiptapEditor from "@/src/components/editor/TiptapEditor";

import { getQuestionDetail } from "@/src/services/question";
import { getAnswers, saveAnswer, deleteAnswer, updateAnswer } from "@/src/services/answer";
import { Question, Answer } from "@/src/types";

export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const questionId = Number(id);

    const [question, setQuestion] = useState<Question | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);

    const [answerContent, setAnswerContent] = useState("");
    const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);

    // [수정] useCallback 제거하고 일반 비동기 함수로 선언
    const loadData = async () => {
        try {
            const q = await getQuestionDetail(questionId);
            setQuestion(q);
            const aList = await getAnswers(questionId);
            setAnswers(aList);
        } catch (e) {
            console.error(e);
            alert("데이터를 불러오는데 실패했습니다.");
            router.back();
        }
    };

    // [수정] useEffect에서 호출 (의존성 배열에는 ID만 포함)
    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionId]);

    const handleSubmitAnswer = async () => {
        const stripped = answerContent.replace(/<[^>]*>?/gm, '').trim();
        if (!stripped && !answerContent.includes("<img")) return alert("내용을 입력하세요.");

        try {
            if (editingAnswerId) {
                await updateAnswer(editingAnswerId, answerContent);
            } else {
                await saveAnswer(questionId, answerContent);
            }
            setAnswerContent("");
            setEditingAnswerId(null);
            loadData(); // 갱신
        } catch (e) {
            alert("저장 실패");
        }
    };

    const handleDeleteAnswer = async (answerId: number) => {
        if (!confirm("답변을 삭제하시겠습니까?")) return;
        try {
            await deleteAnswer(answerId);
            loadData(); // 갱신
        } catch (e) {
            alert("삭제 실패");
        }
    };

    const handleEditClick = (answer: Answer) => {
        setEditingAnswerId(answer.id);
        setAnswerContent(answer.content);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    if (!question) return <div className="p-10 text-center text-gray-500">로딩 중...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 pb-20">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition font-medium"
            >
                <ArrowLeft size={20} /> 목록으로 돌아가기
            </button>

            {/* 질문 내용 카드 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                <div className="flex justify-between items-start mb-6 border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{question.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">작성자: {question.username}</span>
                            <span>{new Date(question.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                    {question.answeredByAdmin && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold border border-green-200">
              답변완료
            </span>
                    )}
                </div>
                <div
                    className="prose prose-lg max-w-none text-gray-900" // 본문 글자색 명시
                    dangerouslySetInnerHTML={{ __html: question.content }}
                />
            </div>

            {/* 답변 리스트 */}
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
                                    onClick={() => handleEditClick(ans)}
                                    className="p-2 bg-white text-blue-600 rounded-lg border border-gray-100 hover:shadow-sm transition"
                                    title="수정"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteAnswer(ans.id)}
                                    className="p-2 bg-white text-red-500 rounded-lg border border-gray-100 hover:shadow-sm transition"
                                    title="삭제"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div
                            className="prose prose-sm max-w-none text-gray-900 bg-white p-5 rounded-xl border border-gray-200 shadow-sm"
                            dangerouslySetInnerHTML={{ __html: ans.content }}
                        />
                    </div>
                ))}
            </div>

            {/* 답변 작성 에디터 */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {editingAnswerId ? "답변 수정하기" : "답변 작성하기"}
                </h3>
                <div className="bg-white rounded-lg border border-gray-300 overflow-hidden mb-4 shadow-sm">
                    <TiptapEditor
                        value={answerContent}
                        onChange={setAnswerContent}
                        placeholder="답변 내용을 친절하게 작성해주세요..."
                        minHeight="200px"
                    />
                </div>
                <div className="flex justify-end gap-2">
                    {editingAnswerId && (
                        <button
                            onClick={() => { setEditingAnswerId(null); setAnswerContent(""); }}
                            className="px-6 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium transition"
                        >
                            취소
                        </button>
                    )}
                    <button
                        onClick={handleSubmitAnswer}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 font-medium shadow-sm"
                    >
                        <Send size={18} />
                        {editingAnswerId ? "수정 완료" : "답변 등록"}
                    </button>
                </div>
            </div>
        </div>
    );
}