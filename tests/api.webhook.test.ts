import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock modules before importing
vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { POST as webhookRoute } from "@/app/api/stripe/webhook/route";
import * as stripeModule from "@/lib/stripe";
import * as adminModule from "@/lib/supabase/admin";

describe("/api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (stripeModule.stripe.webhooks.constructEvent as any).mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "user-1",
          customer: "cus_123",
          subscription: "sub_123",
        },
      },
    });

    (adminModule.supabaseAdmin.from as any).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "user-1" } }),
    });
  });

  it("handles checkout completion", async () => {
    const request = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "test" },
    });

    const response = await webhookRoute(request);
    expect(response.status).toBe(200);
  });
});

