import { describe, it, expect, beforeEach } from "vitest";
import { trackRequest, getUsage, setTier, resetUsageStore } from "../src/usage.js";

describe("usage tracking", () => {
  beforeEach(() => {
    resetUsageStore();
  });

  it("allows requests within free tier limit", () => {
    const result = trackRequest("test-key");
    expect(result.allowed).toBe(true);
    expect(result.tier).toBe("free");
    expect(result.remaining).toBe(49);
  });

  it("blocks after 50 free tier requests", () => {
    for (let i = 0; i < 50; i++) {
      trackRequest("heavy-user");
    }
    const result = trackRequest("heavy-user");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Free tier limit reached");
    expect(result.remaining).toBe(0);
  });

  it("allows unlimited requests for pro tier", () => {
    setTier("pro-user", "pro");
    for (let i = 0; i < 100; i++) {
      const result = trackRequest("pro-user");
      expect(result.allowed).toBe(true);
      expect(result.tier).toBe("pro");
    }
  });

  it("reports correct usage stats", () => {
    trackRequest("stats-user");
    trackRequest("stats-user");
    trackRequest("stats-user");

    const usage = getUsage("stats-user");
    expect(usage.tier).toBe("free");
    expect(usage.requestsThisMonth).toBe(3);
    expect(usage.limit).toBe(50);
    expect(usage.remaining).toBe(47);
  });

  it("reports unlimited for pro tier", () => {
    setTier("pro", "pro");
    trackRequest("pro");

    const usage = getUsage("pro");
    expect(usage.tier).toBe("pro");
    expect(usage.limit).toBe("unlimited");
    expect(usage.remaining).toBe("unlimited");
  });

  it("handles anonymous (no API key) users", () => {
    const result = trackRequest(undefined);
    expect(result.allowed).toBe(true);
    expect(result.tier).toBe("free");
  });
});
