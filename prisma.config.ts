import { defineConfig } from "prisma/config";

if (!process.env["DATABASE_URL"]) {
  try {
    process.loadEnvFile();
  } catch (e) {
    // ignore if .env file is missing
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env["DATABASE_URL"] ?? "",
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
