import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function evaluateBillingAuthorization({
  authHeader,
  cronHeader,
  configuredCronSecret,
  userSession,
}) {
  let providedToken = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    providedToken = authHeader.slice(7).trim();
  } else if (cronHeader) {
    providedToken = cronHeader.trim();
  }

  // Path 1: Bearer / Cron secret validation
  if (providedToken) {
    if (!configuredCronSecret || configuredCronSecret.trim().length === 0) {
      return {
        authorized: false,
        status: 401,
        error: "Unauthorized: Scheduled billing secret is not configured on the server.",
      };
    }
    if (safeCompare(providedToken, configuredCronSecret.trim())) {
      return { authorized: true, status: 200, triggerType: "scheduled" };
    }
    return {
      authorized: false,
      status: 401,
      error: "Unauthorized: Invalid bearer token.",
    };
  }

  // Path 2: User session verification
  if (!userSession) {
    return {
      authorized: false,
      status: 401,
      error: "Unauthorized: Authentication required. Provide a valid Bearer token or log in as an administrator.",
    };
  }

  if (userSession.role === "admin") {
    return { authorized: true, status: 200, triggerType: "manual" };
  }

  // Ordinary staff and customer accounts are forbidden
  return {
    authorized: false,
    status: 403,
    error: "Forbidden: Ordinary staff and customer accounts cannot trigger automated billing.",
  };
}

describe("POST /api/billing/run Authorization Engine", () => {
  const MOCK_CRON_SECRET = "subscriptiq_test_cron_secret_secure_key_123";

  it("rejects unauthenticated requests without headers or session with 401", () => {
    const res = evaluateBillingAuthorization({
      authHeader: null,
      cronHeader: null,
      configuredCronSecret: MOCK_CRON_SECRET,
      userSession: null,
    });
    assert.equal(res.authorized, false);
    assert.equal(res.status, 401);
    assert.match(res.error, /Authentication required/);
  });

  it("rejects invalid Bearer token with 401", () => {
    const res = evaluateBillingAuthorization({
      authHeader: "Bearer invalid_secret_token",
      cronHeader: null,
      configuredCronSecret: MOCK_CRON_SECRET,
      userSession: null,
    });
    assert.equal(res.authorized, false);
    assert.equal(res.status, 401);
    assert.match(res.error, /Invalid bearer token/);
  });

  it("authorizes valid Bearer token matching CRON_SECRET with 200", () => {
    const res = evaluateBillingAuthorization({
      authHeader: `Bearer ${MOCK_CRON_SECRET}`,
      cronHeader: null,
      configuredCronSecret: MOCK_CRON_SECRET,
      userSession: null,
    });
    assert.equal(res.authorized, true);
    assert.equal(res.status, 200);
    assert.equal(res.triggerType, "scheduled");
  });

  it("authorizes valid x-cron-secret header matching CRON_SECRET with 200", () => {
    const res = evaluateBillingAuthorization({
      authHeader: null,
      cronHeader: MOCK_CRON_SECRET,
      configuredCronSecret: MOCK_CRON_SECRET,
      userSession: null,
    });
    assert.equal(res.authorized, true);
    assert.equal(res.status, 200);
    assert.equal(res.triggerType, "scheduled");
  });

  it("blocks ordinary staff account sessions with 403 Forbidden", () => {
    const res = evaluateBillingAuthorization({
      authHeader: null,
      cronHeader: null,
      configuredCronSecret: MOCK_CRON_SECRET,
      userSession: { email: "staff@company.com", role: "staff" },
    });
    assert.equal(res.authorized, false);
    assert.equal(res.status, 403);
    assert.match(res.error, /Ordinary staff and customer accounts cannot trigger automated billing/);
  });

  it("blocks customer account sessions with 403 Forbidden", () => {
    const res = evaluateBillingAuthorization({
      authHeader: null,
      cronHeader: null,
      configuredCronSecret: MOCK_CRON_SECRET,
      userSession: { email: "client@acme.com", role: "customer" },
    });
    assert.equal(res.authorized, false);
    assert.equal(res.status, 403);
    assert.match(res.error, /Ordinary staff and customer accounts cannot trigger automated billing/);
  });

  it("authorizes verified admin session with 200 OK", () => {
    const res = evaluateBillingAuthorization({
      authHeader: null,
      cronHeader: null,
      configuredCronSecret: MOCK_CRON_SECRET,
      userSession: { email: "admin@subscriptiq.com", role: "admin" },
    });
    assert.equal(res.authorized, true);
    assert.equal(res.status, 200);
    assert.equal(res.triggerType, "manual");
  });
});
