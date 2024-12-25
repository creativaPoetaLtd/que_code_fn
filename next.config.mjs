/** @type {import('next').NextConfig} */
const nextConfig = {
    images:
    {
        domains: ['deploy-preview-7--qcode-staging.netlify.app'],
        unoptimized: true,
    },
    trailingSlash: true,
    eslint: {
        ignoreDuringBuilds: true,
    }
};

export default nextConfig;
