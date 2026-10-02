import assert from "node:assert/strict";
import test from "node:test";
import { legalReady } from "../src/lib/site";

test("CMS publication approval requires company, address, contact and privacy settings", () => {
  const settings = {
    name: "Test",
    owner: "Test Owner",
    email: "test@example.com",
    street: "Test 1",
    postcode: "12345",
    city: "Test",
    country: "Deutschland",
    legalReviewed: true,
    privacyReviewed: true,
    databaseProvider: "Neon",
    databaseRegion: "Frankfurt",
    logRetention: "7 days",
    mailProvider: "Test",
    transfers: "Confirmed safeguards",
  };
  assert.equal(legalReady(settings), true);
  assert.equal(legalReady({ ...settings, legalReviewed: false }), false);
  assert.equal(legalReady({ ...settings, email: "" }), false);
  assert.equal(legalReady({ ...settings, transfers: " " }), false);
});
