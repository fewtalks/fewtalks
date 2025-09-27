import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock modules before importing
vi.mock("@/lib/openai", () => ({
  openai: {
    responses: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/usage", () => ({
  getUsageForUser: vi.fn(),
  isPaidUser: vi.fn(),
  decrementFreeRun: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/history", () => ({
  recordGeneration: vi.fn(),
}));

import { POST as generateRoute } from "@/app/api/generate/route";
import * as openaiModule from "@/lib/openai";
import * as usageModule from "@/lib/usage";
import * as supabaseModule from "@/lib/supabase/server";
import * as historyModule from "@/lib/history";

describe("/api/generate POST", () => {
  const mockCreate = vi.fn();
  const mockRecord = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (supabaseModule.createSupabaseServerClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
    });

    (usageModule.getUsageForUser as any).mockResolvedValue({
      plan: "free",
      remainingFreeRuns: 3,
    });
    (usageModule.isPaidUser as any).mockResolvedValue(false);
    (usageModule.decrementFreeRun as any).mockResolvedValue();

    mockCreate.mockResolvedValue({
      output_text: "1. Tweet one\n2. Tweet two\n3. Tweet three",
    });

    mockRecord.mockResolvedValue(undefined);
  });

  it("returns tweets when prompt is provided", async () => {
    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: "My ideas" }),
    });

    const response = await generateRoute(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tweets).toHaveLength(3);
    expect(openaiModule.openai.responses.create).toHaveBeenCalled();
    expect(historyModule.recordGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", tweets: expect.any(Array) })
    );
  });

  it("returns 400 when prompt missing", async () => {
    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: "   " }),
    });

    const response = await generateRoute(request);
    expect(response.status).toBe(400);
  });
});

