import type { NextConfig } from "next";
import os from "node:os";

// Ambil semua IPv4 non-internal dari laptop (Wi-Fi, Ethernet, dll).
// Ini membuat akses dev dari HP tetap diizinkan meskipun IP laptop berubah.
const localAddresses = Object.values(os.networkInterfaces())
  .flatMap((interfaces) => interfaces ?? [])
  .filter((item) => item.family === "IPv4" && !item.internal)
  .map((item) => item.address);

// Sertakan IP persis dan wildcard subnet (contoh: 192.168.101.*)
const allowedDevOrigins = [
  ...new Set(
    localAddresses.flatMap((address) => [
      address,
      address.replace(/\.\d+$/, ".*"),
    ]),
  ),
];

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  allowedDevOrigins,
};

export default nextConfig;
