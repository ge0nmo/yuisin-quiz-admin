import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                // .env.local에 있는 값을 읽어옵니다. 없으면 기본값 localhost:8080
                destination: `${process.env.SOURCE_API_URL || 'http://localhost:8080'}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;