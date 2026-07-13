import assert from "node:assert/strict";
import test from "node:test";
import {
  createConfirmationToken,
  createManageToken,
  hashToken,
  normalizeEmail,
  validateFilters,
  verifyManageToken,
} from "./email-subscriptions";

test("normalizes email addresses", () => {
  assert.equal(normalizeEmail("  Person@Example.COM "), "person@example.com");
});

test("validates subscription filters", () => {
  assert.deepEqual(validateFilters(["critical", "major"], ["aws"]), {
    severities: ["critical", "major"],
    sources: ["aws"],
  });
  assert.throws(() => validateFilters([], []));
  assert.throws(() => validateFilters(["urgent"], []));
  assert.throws(() => validateFilters(["major"], ["unknown-provider"]));
});

test("hashes confirmation tokens without storing the bearer token", () => {
  const { token, hash } = createConfirmationToken();
  assert.equal(hashToken(token), hash);
  assert.notEqual(token, hash);
});

test("signs and verifies manage tokens", () => {
  process.env.AUTH_SECRET = "test-only-secret";
  const token = createManageToken("subscription-1");
  assert.equal(verifyManageToken("subscription-1", token), true);
  assert.equal(verifyManageToken("subscription-2", token), false);
  assert.equal(verifyManageToken("subscription-1", `${token}x`), false);
});
