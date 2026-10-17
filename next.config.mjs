/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable the startup instrumentation hook (warms the Prisma pool).
    instrumentationHook: true,
    // Tree-shake barrel-file packages so dev compiles stay fast and the
    // client bundle only ships the icons/components actually used.
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "@react-pdf/renderer",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "coresg-normal.trae.ai",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
