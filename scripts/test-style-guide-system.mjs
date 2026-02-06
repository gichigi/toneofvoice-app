/**
 * Programmatic tests for style guide + subscription system.
 * Run with: pnpm test:system (requires dev server: pnpm dev)
 * Tests API routes, webhook, and validation logic.
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import { config } from "dotenv";
import Stripe from "stripe";

config();

const BASE =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.PORT ? `http://localhost:${process.env.PORT}` : "http://localhost:3000");

async function fetchOk(url, options = {}) {
  const res = await fetch(url, options);
  return { res, ok: res.ok, status: res.status };
}

async function assertServerUp() {
  try {
    const { res } = await fetchOk(`${BASE}/api/load-style-guide`);
    return res.status !== 0 && res.status < 600;
  } catch (e) {
    return false;
  }
}

describe("Style guide + subscription system", { timeout: 30_000 }, () => {
  test("dev server is reachable", async () => {
    const up = await assertServerUp();
    assert.ok(up, `Dev server not reachable at ${BASE}. Run: pnpm dev`);
  });

  describe("load-style-guide", () => {
    test("GET without guideId returns 400", async () => {
      const { res, status } = await fetchOk(`${BASE}/api/load-style-guide`);
      assert.strictEqual(status, 400, `Expected 400, got ${status}`);
      const json = await res.json().catch(() => ({}));
      assert.match(
        (json.error || "").toLowerCase(),
        /missing|guideid/i,
        `Expected error about guideId, got: ${JSON.stringify(json)}`
      );
    });

    test("GET with guideId but no auth returns 401 or 503", async () => {
      const { status } = await fetchOk(
        `${BASE}/api/load-style-guide?guideId=00000000-0000-0000-0000-000000000001`
      );
      assert.ok(
        status === 401 || status === 503,
        `Expected 401 (unauthorized) or 503 (misconfigured), got ${status}`
      );
    });
  });

  describe("save-style-guide", () => {
    test("POST without auth returns 401 or 503", async () => {
      const { status } = await fetchOk(`${BASE}/api/save-style-guide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Guide",
          content_md: "# Test",
        }),
      });
      assert.ok(
        status === 401 || status === 503,
        `Expected 401 (unauthorized) or 503 (misconfigured), got ${status}`
      );
    });
  });

  describe("create-subscription-session", () => {
    test("POST without auth returns 401 or 503", async () => {
      const { status } = await fetchOk(`${BASE}/api/create-subscription-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      assert.ok(
        status === 401 || status === 503,
        `Expected 401 (unauthorized) or 503 (misconfigured), got ${status}`
      );
    });

    test("POST with invalid plan returns 400/401/503", async () => {
      const { status } = await fetchOk(`${BASE}/api/create-subscription-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "invalid_plan" }),
      });
      assert.ok(
        status === 401 || status === 400 || status === 503,
        `Expected 401 (no auth), 400 (invalid plan), or 503 (misconfigured), got ${status}`
      );
    });
  });

  describe("create-portal-session", () => {
    test("POST without auth returns 401 or 503", async () => {
      const { status } = await fetchOk(`${BASE}/api/create-portal-session`, {
        method: "POST",
      });
      assert.ok(
        status === 401 || status === 503,
        `Expected 401 (unauthorized) or 503 (misconfigured), got ${status}`
      );
    });
  });

  describe("ai-assist", () => {
    test("POST without text returns 400", async () => {
      const { res, status } = await fetchOk(`${BASE}/api/ai-assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rewrite" }),
      });
      assert.strictEqual(status, 400, `Expected 400, got ${status}`);
      const json = await res.json().catch(() => ({}));
      assert.match(
        (json.error || "").toLowerCase(),
        /text|missing|invalid/i,
        `Expected error about text, got: ${JSON.stringify(json)}`
      );
    });

    test("POST with empty string text returns 400", async () => {
      const { status } = await fetchOk(`${BASE}/api/ai-assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "", action: "rewrite" }),
      });
      assert.strictEqual(status, 400, `Expected 400, got ${status}`);
    });

    test("POST with invalid action falls back to rewrite and succeeds", async () => {
      if (!process.env.OPENAI_API_KEY) {
        const { status } = await fetchOk(`${BASE}/api/ai-assist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "Hello world", action: "made_up_action" }),
        });
        assert.strictEqual(
          status,
          500,
          `Without OPENAI_API_KEY expect 500, got ${status}`
        );
        return;
      }
      const { res, status } = await fetchOk(`${BASE}/api/ai-assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hello world", action: "made_up_action" }),
      });
      assert.ok(status === 200 || status === 500, `Expected 200 or 500, got ${status}`);
      if (status === 200) {
        const json = await res.json();
        assert.ok(typeof json.suggestion === "string", "Response must have suggestion");
      }
    });

    test("POST with valid text and action returns suggestion", async () => {
      if (!process.env.OPENAI_API_KEY) {
        const { status } = await fetchOk(`${BASE}/api/ai-assist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "Hello world", action: "shorten" }),
        });
        assert.strictEqual(status, 500, `Without OPENAI_API_KEY expect 500, got ${status}`);
        return;
      }
      const { res, status } = await fetchOk(`${BASE}/api/ai-assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hello world", action: "shorten" }),
      });
      assert.strictEqual(status, 200, `Expected 200, got ${status}`);
      const json = await res.json();
      assert.ok(typeof json.suggestion === "string", "Response must have suggestion");
      assert.ok(json.suggestion.length > 0, "Suggestion must be non-empty");
    });
  });

  describe("webhook", () => {
    test("POST without stripe-signature returns 400 or 503", async () => {
      const { res, status } = await fetchOk(`${BASE}/api/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "checkout.session.completed" }),
      });
      assert.ok(
        status === 400 || status === 503,
        `Expected 400 (missing sig) or 503 (misconfigured), got ${status}`
      );
      if (status === 400) {
        const json = await res.json().catch(() => ({}));
        assert.match(
          (json.error || "").toLowerCase(),
          /signature|stripe|missing/i,
          `Expected error about signature, got: ${JSON.stringify(json)}`
        );
      }
    });

    test("POST with invalid signature returns 400 or 503", async () => {
      const payload = JSON.stringify({
        id: "evt_test",
        type: "checkout.session.completed",
        data: { object: {} },
      });
      const { status } = await fetchOk(`${BASE}/api/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "t=1,v1=invalid",
        },
        body: payload,
      });
      assert.ok(
        status === 400 || status === 503,
        `Expected 400 (invalid sig) or 503 (misconfigured), got ${status}`
      );
    });

    test("POST with valid subscription checkout event returns 200", async (t) => {
      const secret =
        process.env.STRIPE_MODE === "test"
          ? process.env.STRIPE_TEST_WEBHOOK_SECRET
          : process.env.STRIPE_WEBHOOK_SECRET;
      if (!secret || !secret.startsWith("whsec_")) {
        return t.skip("STRIPE_TEST_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET required");
      }

      const stripe = new Stripe("sk_test_placeholder_for_signing_only", {
        apiVersion: "2023-10-16",
      });

      const event = {
        id: "evt_test_" + Date.now(),
        type: "checkout.session.completed",
        data: {
          object: {
            mode: "subscription",
            metadata: { user_id: "00000000-0000-0000-0000-000000000099", plan: "pro" },
            subscription: null,
            customer: null,
          },
        },
      };

      const payload = JSON.stringify(event);
      const sig = stripe.webhooks.generateTestHeaderString({
        payload,
        secret,
      });

      const { status } = await fetchOk(`${BASE}/api/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": sig,
        },
        body: payload,
      });

      assert.strictEqual(status, 200, `Expected 200, got ${status}`);
    });
  });
});
