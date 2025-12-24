import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['rxdb', 'rxdb-hooks', 'rxdb-supabase'],


};



export default nextConfig;
