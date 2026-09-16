import { PrismaClient } from "@prisma/client";

declare global {
  // `var` is required here so the declaration attaches to `globalThis`.
  var prismaClientSingleton: PrismaClient | undefined;
}

export const db = globalThis.prismaClientSingleton ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaClientSingleton = db;
}
