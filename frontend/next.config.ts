import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images:{
    domains:['images.pexels.com', 'res.cloudinary.com']
  },
  
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
