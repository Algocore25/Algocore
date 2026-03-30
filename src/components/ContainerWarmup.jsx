"use client";

import { useEffect } from "react";

/**
 * Fires a single lightweight warmup request to the code-execution container
 * when the browser session starts.
 *
 * Uses sessionStorage so:
 *   - First tab open  → triggers the warmup
 *   - Page refresh    → does NOT trigger again
 *   - Route change    → does NOT trigger again
 *   - User closes tab and opens later → triggers again (new session)
 */

const WARMUP_KEY = "algocore_runner_warmed";
const RUNNER_URL =
  "https://algocore-runner.kindcliff-a86dac7a.southindia.azurecontainerapps.io/run";

const ContainerWarmup = () => {
  useEffect(() => {
    // Already warmed this session — skip
    if (sessionStorage.getItem(WARMUP_KEY)) return;

    // Mark immediately so concurrent renders / strict-mode double-fire
    // don't send duplicate requests.
    sessionStorage.setItem(WARMUP_KEY, Date.now().toString());

    const warmup = async () => {
      try {
        console.log("[Warmup] Pinging code-execution container…");
        await fetch(RUNNER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceCode: 'print("warmup")',
            language: 4,       // Python — lightest runtime
            input: "",
          }),
        });
        console.log("[Warmup] Container is warm ✓");
      } catch (err) {
        // Non-critical — failing silently is fine
        console.warn("[Warmup] Ping failed (container may still be cold):", err.message);
      }
    };

    warmup();
  }, []);

  return null; // Renders nothing
};

export default ContainerWarmup;
