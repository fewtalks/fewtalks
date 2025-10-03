import "@testing-library/jest-dom/vitest";

// Mock environment variables for tests
process.env.OPENAI_API_KEY = "sk-test-key";
process.env.STRIPE_SECRET_KEY = "sk_test_key";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

