// src/services/exam.ts
import { fetcher } from "./fetcher";
import { Exam, GlobalResponse } from "@/src/types";

// 컨트롤러 기본 경로: /api/admin
const BASE_PATH = "/admin";

// 1. 연도 목록 조회
// GET /api/admin/exam/year?subjectId={id}
export const getExamYears = async (subjectId: number) => {
    const res = await fetcher<GlobalResponse<number[]>>(`${BASE_PATH}/exam/year?subjectId=${subjectId}`);
    return res.data; // data 필드만 반환
};

// 2. 시험 목록 조회
// GET /api/admin/subject/{subjectId}/exam?year={year}
export const getExams = async (subjectId: number, year?: number) => {
    const query = year ? `?year=${year}` : "";
    const res = await fetcher<GlobalResponse<Exam[]>>(`${BASE_PATH}/subject/${subjectId}/exam${query}`);
    return res.data; // data 필드만 반환
};

// 3. 시험 생성
// POST /api/admin/exam?subjectId={id}
export const saveExam = (subjectId: number, name: string, year: number) =>
    fetcher<GlobalResponse<number>>(`${BASE_PATH}/exam?subjectId=${subjectId}`, {
        method: "POST",
        body: JSON.stringify({ name, year }),
    });

// 4. 시험 수정
// PATCH /api/admin/exam/{id}
export const updateExam = (id: number, name: string, year: number) =>
    fetcher<GlobalResponse<void>>(`${BASE_PATH}/exam/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, year }),
    });

// 5. 시험 삭제
// DELETE /api/admin/exam/{examId}
export const deleteExam = (id: number) =>
    fetcher<void>(`${BASE_PATH}/exam/${id}`, { method: "DELETE" });