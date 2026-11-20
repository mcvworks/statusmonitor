import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { initCache, SWRGlobalState } from "swr/_internal";
import { revalidateAlertQueries } from "../hooks/useSSE";
import {
  patchFilterParams,
  scheduleSearchUpdate,
} from "../components/dashboard/SearchFilter";

test("SSE revalidation retains the latest summary and error until the fetch settles", async () => {
  const key = "/api/alerts/summary";
  const state = {
    _k: key,
    data: { summary: { incidents: { total: 1 } } },
    error: new Error("previous refresh failed"),
  };
  const cache = new Map([[key, state]]);
  const [, mutate] = initCache(cache)!;
  const [revalidators] = SWRGlobalState.get(cache)!;
  let finish!: () => void;
  const fetchPending = new Promise<void>((resolve) => { finish = resolve; });
  let revalidated = false;
  // This fixture handles the mutation event used by revalidateAlertQueries.
  const onMutation = async () => {
    revalidated = true;
    await fetchPending;
    return true;
  };
  revalidators[key] = [onMutation as (typeof revalidators)[string][number]];

  const pending = revalidateAlertQueries(mutate);
  assert.equal(revalidated, true);
  assert.equal(cache.get(key), state);
  finish();
  await pending;
});

test("a pending search keeps the newer shortcut and provider selections", async () => {
  let params = new URLSearchParams("q=network&severity=minor");
  scheduleSearchUpdate(
    () => params.get("q"),
    () => { params = patchFilterParams(params, { search: "gateway" }); },
  );
  params = patchFilterParams(params, () => ({ severity: "critical" }));
  params = patchFilterParams(params, { source: "aws", sort: "severity" });

  await delay(350);
  assert.deepEqual(Object.fromEntries(params), {
    q: "gateway", severity: "critical", source: "aws", sort: "severity",
  });
});

test("clearing the filters cancels a queued search even when the URL has no q yet", async () => {
  let params = new URLSearchParams("severity=major&source=aws");
  const cancel = scheduleSearchUpdate(
    () => params.get("q"),
    () => { params = patchFilterParams(params, { search: "gateway" }); },
  );

  cancel();
  params = patchFilterParams(params, { search: "", severity: "", source: "" });
  await delay(350);
  assert.equal(params.toString(), "");
});

test("a queued search cannot overwrite a newer search from navigation", async () => {
  let search = "network";
  scheduleSearchUpdate(() => search, () => { search = "gateway"; });
  search = "proxy";
  await delay(350);
  assert.equal(search, "proxy");
});
