import assert from "node:assert/strict";
import test from "node:test";
import { PROVIDERS } from "./constants";
import { DUCKTYPED_GUIDES, getDuckTypedGuides } from "./ducktyped-guides";

const mappedSlugs = Object.keys(DUCKTYPED_GUIDES);

test("every mapped slug exists in the provider registry", () => {
  assert.ok(mappedSlugs.length > 0);
  for (const slug of mappedSlugs) {
    assert.ok(PROVIDERS[slug], `unknown provider slug: ${slug}`);
  }
});

test("every link is a labelled duckTyped URL", () => {
  for (const slug of mappedSlugs) {
    const links = getDuckTypedGuides(slug);
    assert.ok(links.length > 0, `${slug} has no links`);
    for (const link of links) {
      assert.ok(
        link.href.startsWith("https://ducktyped.xyz/"),
        `${slug}: ${link.href}`,
      );
      assert.ok(link.label.trim().length > 0, `${slug}: empty label for ${link.href}`);
    }
  }
});

test("no provider lists the same URL twice", () => {
  for (const slug of mappedSlugs) {
    const hrefs = getDuckTypedGuides(slug).map((link) => link.href);
    assert.equal(new Set(hrefs).size, hrefs.length, `${slug} has duplicate links`);
  }
});

test("unmapped slugs return no links", () => {
  assert.deepEqual(getDuckTypedGuides("slack"), []);
  assert.deepEqual(getDuckTypedGuides("not-a-provider"), []);
  assert.deepEqual(getDuckTypedGuides("toString"), []);
});
