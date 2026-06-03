import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "Clerk Publishable Key is required"),
  NEXT_PUBLIC_API_URL: z.string().url("API URL must be a valid absolute endpoint URL"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Supabase URL must be a valid endpoint"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase Anon Key is required"),
  NEXT_PUBLIC_WSS_URL: z.string().url("WebSocket Server URL must be valid")
});

export function validateEnv() {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_Y2xlcmsubWluZHJpZmYuYXBwJA",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase.mindrift.app",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    NEXT_PUBLIC_WSS_URL: process.env.NEXT_PUBLIC_WSS_URL || "ws://localhost:8080/ws"
  });

  if (!result.success) {
    console.error("❌ Environment validation failed during build boot:", result.error.format());
    throw new Error("Invalid production environment configurations");
  }

  return result.data;
}

export const envConfig = validateEnv();
export default envConfig;
