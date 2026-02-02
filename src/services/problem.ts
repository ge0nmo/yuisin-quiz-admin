import { fetcher } from "./fetcher";
import { Problem, ProblemSaveV2Request, GlobalResponse } from "@/src/types";

const DOMAIN = "/v2/admin/problem";

export const getProblemsV2 = async (examId: number): Promise<Problem[]> => {
    const res = await fetcher<GlobalResponse<Problem[]>>(`${DOMAIN}?examId=${examId}`);
    return res.data;
};

export const getProblemDetailV2 = async (id: number): Promise<Problem> => {
    const res = await fetcher<GlobalResponse<Problem>>(`${DOMAIN}/${id}`);
    return res.data;
};

export const saveProblemV2 = async (examId: number, data: ProblemSaveV2Request) => {
    const res = await fetcher<GlobalResponse<number>>(`${DOMAIN}?examId=${examId}`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return res.data;
};

export const deleteProblem = (id: number) =>
    fetcher<void>(`/api/admin/problem/${id}`, { method: "DELETE" });