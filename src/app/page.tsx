import { redirect } from "next/navigation";

// 루트('/')로 접속하면 바로 로그인 페이지('/login')로 보냄
export default function Home() {
    redirect("/login");

    // redirect가 실행되면 아래 코드는 실행되지 않음
    return null;
}