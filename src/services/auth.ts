// src/services/auth.ts
import { fetcher } from "./fetcher";
import { GlobalResponse, LoginResult } from "@/src/types";

export const login = async (email: string, password: string) => {
    return fetcher<GlobalResponse<LoginResult>>("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
};