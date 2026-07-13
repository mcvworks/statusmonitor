import assert from "node:assert/strict";
import test from "node:test";
import { createWebhookManageToken, decryptWebhook, encryptWebhook, isSlackWebhook, verifyWebhookManageToken } from "./webhook-subscriptions";

test("accepts only Slack incoming webhook URLs", () => {
  assert.equal(isSlackWebhook("https://hooks.slack.com/services/T/B/secret"), true);
  assert.equal(isSlackWebhook("https://example.com/services/T/B/secret"), false);
  assert.equal(isSlackWebhook("http://hooks.slack.com/services/T/B/secret"), false);
});

test("encrypts Slack webhook secrets at rest", () => {
  process.env.AUTH_SECRET = "test-webhook-secret";
  const url = "https://hooks.slack.com/services/T/B/secret";
  const encrypted = encryptWebhook(url);
  assert.equal(encrypted.includes(url), false);
  assert.equal(decryptWebhook(encrypted), url);
});

test("signs webhook disconnect credentials", () => {
  process.env.AUTH_SECRET = "test-webhook-secret";
  const token = createWebhookManageToken("one");
  assert.equal(verifyWebhookManageToken("one", token), true);
  assert.equal(verifyWebhookManageToken("two", token), false);
});
