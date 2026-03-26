/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // ============================================
  // ARQUITECTURA API - Backend Proxy Pattern
  // ============================================
  // En desarrollo: El FE hace requests a /api/* (relative paths)
  // Next.js reescribe internamente a http://localhost:3001/api/*
  // Esto evita CORS porque el rewrite es server-side
  // En producción: Cambiar destination a tu dominio real
  // ============================================
  rewrites: async () => {
    const apiBackend = process.env.API_BACKEND_URL || 'http://localhost:3001';
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${apiBackend}/api/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
