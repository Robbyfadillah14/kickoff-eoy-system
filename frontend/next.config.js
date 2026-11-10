/** @type {import('next').NextConfig} */
module.exports = { 
  reactStrictMode: true,
  output: 'standalone', // Tambahan wajib untuk build Docker yang efisien
};