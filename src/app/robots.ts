import type { MetadataRoute } from 'next';
import { getPublicEnv } from "@/shared/lib/env/public";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicEnv().NEXT_PUBLIC_APP_URL;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/api/',
        '/callback',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
