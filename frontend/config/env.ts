import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:8080/api/v1'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).default('pk_test_bmV4dC1kaW5nby05Ni5jbGVyay5hY2NvdW50cy5kZXYk'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || undefined,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
});

if (!parsed.success) {
  console.warn('⚠️ Invalid environment variables:', parsed.error.format());
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ Missing required environment configuration in production');
  }
}

export const env = parsed.success
  ? parsed.data
  : {
      NEXT_PUBLIC_API_URL: 'http://localhost:8080/api/v1',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_bmV4dC1kaW5nby05Ni5jbGVyay5hY2NvdW50cy5kZXYk',
      NEXT_PUBLIC_SUPABASE_URL: undefined,
    };
export default env;
