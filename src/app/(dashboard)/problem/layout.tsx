// src/app/(dashboard)/problem/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "문제 관리",
    description: "문제 관리 페이지",
};

export default function SubjectLayout(
    {children,
    }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}