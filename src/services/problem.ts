import { fetcher } from "./fetcher";
import { Problem, ProblemRequest, GlobalResponse } from "@/src/types";

// 백엔드 컨트롤러 경로: /api/admin/problem
// fetcher가 /api를 붙이므로 여기서는 /admin/problem만 적음
const DOMAIN = "/admin/problem";

// 1. 문제 목록 조회
// GET /api/admin/problem?examId={id}
export const getProblems = async (examId: number): Promise<Problem[]> => {
    const res = await fetcher<GlobalResponse<Problem[]>>(`${DOMAIN}?examId=${examId}`);
    return res.data;
};

// 2. 문제 생성/수정
export const saveProblem = (examId: number, data: ProblemRequest) => {
    // ID가 있으면 수정(PATCH), 없으면 생성(POST)
    const isUpdate = !!data.id;
    const method = isUpdate ? "PATCH" : "POST";

    // [수정] 백엔드 스펙에 따라, 수정 시에도 URL에 ID를 넣지 않고 쿼리 파라미터만 사용
    // POST: /api/admin/problem?examId=...
    // PATCH: /api/admin/problem?examId=...
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