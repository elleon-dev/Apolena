import { MetadataRoute } from "next";
import { resolveAppUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveAppUrl();

  const privatePaths = [
    "/admin",
    "/admin/*",
    "/dashboard",
    "/dashboard/*",
    "/api/*",
    "/auth/callback",
    "/auth/reset-password",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/products/*", "/track", "/llms.txt", "/llms-full.txt"],
        disallow: privatePaths,
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/products/*", "/track", "/llms.txt", "/llms-full.txt"],
        disallow: privatePaths,
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/products/*", "/track", "/llms.txt", "/llms-full.txt"],
        disallow: privatePaths,
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/products/*", "/track", "/llms.txt", "/llms-full.txt"],
        disallow: privatePaths,
      },
      {
        userAgent: "Applebot-Extended",
        allow: ["/", "/products/*", "/track", "/llms.txt", "/llms-full.txt"],
        disallow: privatePaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
