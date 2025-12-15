import { fetcher } from "./fetcher";
import { Problem, ProblemRequest, GlobalResponse } from "@/src/types";

// 백엔드 컨트롤러 경로: /api/admin/problem
const DOMAIN = "/admin/problem";

// 1. 문제 목록 조회
// GET /api/admin/problem?examId={id}
export const getProblems = async (examId: number): Promise<Problem[]> => {
    const res = await fetcher<GlobalResponse<Problem[]>>(`${DOMAIN}?examId=${examId}`);
    return res.data;
};

// 2. 문제 생성/수정
export const saveProblem = (examId: number, data: ProblemRequest) => {
    const isUpdate = !!data.id;
    const method = isUpdate ? "PATCH" : "POST";
    const url = `${DOMAIN}?examId=${examId}`;

    return fetcher(url, {
        method,
        body: JSON.stringify(data),
    });
};

// 3. 문제 삭제
// DELETE /api/admin/problem/{id}
export const deleteProblem = (id: number) =>
    fetcher<void>(`${DOMAIN}/${id}`, { method: "DELETE" });

// [추가] 4. 문제 단건 상세 조회 (모달용)
// GET /api/admin/problem/{id}
export const getProblemDetail = async (id: number): Promise<Problem> => {
    const res = await fetcher<GlobalResponse<Problem>>(`${DOMAIN}/${id}`);
    return res.data;
};