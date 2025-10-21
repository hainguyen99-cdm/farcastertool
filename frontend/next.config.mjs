/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Remove NEXT_PUBLIC_API_URL to prevent client-side CORS issues
    // Use BACKEND_URL or API_BASE_URL for server-side only
  },
};

export default nextConfig;


