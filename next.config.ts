import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // [추가] 도커 빌드를 위해 필수인 설정
    output: "standalone",

    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: `${process.env.SOURCE_API_URL || 'http://localhost:8080'}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;