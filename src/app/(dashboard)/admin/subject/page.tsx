"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit } from "lucide-react";
import Modal from "@/src/components/ui/Modal";
import { getSubjects, saveSubject, updateSubject, deleteSubject } from "@/src/services/subject";
import { Subject } from "@/src/types";

export default function SubjectPage() {
    const router = useRouter();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "update">("create");

    const [targetId, setTargetId] = useState<number | null>(null);
    const [inputName, setInputName] = useState("");

    // 1. 함수 정의 (useCallback 제거하고 일반 함수로 선언)
    const loadSubjects = async () => {
        try {
            const data = await getSubjects();
            setSubjects(data);
        } catch (e) {
            console.error(e);
        }
    };

    // 2. 초기 로딩 (의존성 배열을 빈 배열 []로 유지)
    useEffect(() => {
        loadSubjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // ↑ 위 주석은 "이 useEffect는 정말로 최초 1회만 실행할 거니까 경고 끄라"는 명령어입니다.

    const goToExamPage = (subject: Subject) => {
        sessionStorage.setItem("subjectId", String(subject.id));
        sessionStorage.setItem("subjectName", subject.name);
        router.push("/admin/exam");
    };

    const openCreateModal = () => {
        setModalMode("create");
        setInputName("");
        setIsModalOpen(true);
    };

    const openUpdateModal = (sub: Subject) => {
        setModalMode("update");
        setTargetId(sub.id);
        setInputName(sub.name);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!inputName.trim()) return alert("과목명을 입력하세요.");
        try {
            if (modalMode === "create") {
                await saveSubject(inputName);
            } else {
                if (targetId) await updateSubject(targetId, inputName);
            }
            setIsModalOpen(false);
            loadSubjects(); // 저장 후 목록 갱신
        } catch (e) {
            alert("저장 실패");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("해당 과목을 삭제하시겠습니까?\n연결된 시험과 문제가 모두 영향을 받을 수 있습니다.")) return;
        try {
            await deleteSubject(id);
            loadSubjects(); // 삭제 후 목록 갱신
        } catch (e) {
            alert("삭제 실패");
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">과목 관리</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-md font-medium"
                >
                    <Plus size={20} /> 과목 추가
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 text-sm uppercase">
                    <tr>
                        <th className="p-5 w-24 text-center font-bold">ID</th>
                        <th className="p-5 font-bold">과목명</th>
                        <th className="p-5 w-32 text-center font-bold">관리</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {subjects.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="p-10 text-center text-gray-400">
                                등록된 과목이 없습니다.
                            </td>
                        </tr>
                    ) : (
                        subjects.map((sub) => (
                            <tr key={sub.id} className="hover:bg-gray-50 transition group">
                                <td className="p-5 text-center text-gray-500">{sub.id}</td>
                                <td className="p-5">
                                    <button
                                        onClick={() => goToExamPage(sub)}
                                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 hover:underline transition-colors text-left"
                                    >
                                        {sub.name}
                                    </button>
                                </td>
                                <td className="p-5 text-center">
                                    <div className="flex justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openUpdateModal(sub)}
                                            className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition"
                                            title="수정"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(sub.id)}
                                            className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                                            title="삭제"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === "create" ? "과목 추가" : "과목 수정"}
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1">과목명</label>
                        <input
                            type="text"
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium placeholder-gray-400"
                            placeholder="예: 회계학, 세법"
                            value={inputName}
                            onChange={(e) => setInputName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition shadow-sm"
                        >
                            저장
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}