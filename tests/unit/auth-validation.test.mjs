import { describe, it } from "node:test";
import assert from "node:assert/strict";

const PASSWORD_MIN_LENGTH = 9;

function checkPasswordComplexity(password) {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };
}

function validatePassword(password) {
  const checks = checkPasswordComplexity(password);
  const errors = [];
  if (!checks.minLength) errors.push("Password with 8 or fewer characters rejected");
  if (!checks.hasUpper) errors.push("Password without uppercase letter rejected");
  if (!checks.hasLower) errors.push("Password without lowercase letter rejected");
  if (!checks.hasSpecial) errors.push("Password without special character rejected");
  return {
    isValid: errors.length === 0,
    errors,
  };
}

describe("Password Complexity Policy Verification", () => {
  it("rejects passwords with 8 or fewer characters", () => {
    // 8 characters
    const res8 = validatePassword("Pass@123");
    assert.equal(res8.isValid, false);
    assert.ok(res8.errors.some((e) => e.includes("8 or fewer")));

    // 6 characters
    const res6 = validatePassword("P@ss1");
    assert.equal(res6.isValid, false);
    assert.ok(res6.errors.some((e) => e.includes("8 or fewer")));

    // Empty string
    const res0 = validatePassword("");
    assert.equal(res0.isValid, false);
  });

  it("rejects passwords without an uppercase letter", () => {
    const res = validatePassword("password@123"); // 12 chars, lower, special, numbers, but NO uppercase
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes("without uppercase letter")));
  });

  it("rejects passwords without a lowercase letter", () => {
    const res = validatePassword("PASSWORD@123"); // 12 chars, upper, special, numbers, but NO lowercase
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes("without lowercase letter")));
  });

  it("rejects passwords without a special character", () => {
    const res = validatePassword("Password123"); // 11 chars, upper, lower, numbers, but NO special char
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes("without special character")));
  });

  it("accepts compliant passwords meeting all 4 criteria", () => {
    const res1 = validatePassword("Password@123"); // 12 chars, Upper, Lower, Special
    assert.equal(res1.isValid, true);
    assert.equal(res1.errors.length, 0);

    const res2 = validatePassword("Secure#Key2026");
    assert.equal(res2.isValid, true);
    assert.equal(res2.errors.length, 0);
  });
});
