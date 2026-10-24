import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.SONIX_STATIC_EXPORT === "1"
    ? { output: "export" as const, basePath: "/Music-Converter" }
    : {}),
  ...(process.env.SONIX_STATIC_EXPORT === "1"
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                {
                  key: "Referrer-Policy",
                  value: "strict-origin-when-cross-origin",
                },
                { key: "X-Frame-Options", value: "DENY" },
                {
                  key: "Permissions-Policy",
                  value: "camera=(), microphone=(), geolocation=()",
                },
              ],
            },
          ];
        },
      }),
};
export default nextConfig;
