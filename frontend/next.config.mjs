// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true
// };

// export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;