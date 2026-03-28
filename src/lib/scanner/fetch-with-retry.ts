/**
 * Shared retry utility for all scanner agents.
 * Wraps fetch() with exponential backoff on transient failures.
 */

export interface RetryOptions {
  /** Max number of attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in ms — doubles each retry (default: 1000) */
  baseDelayMs?: number;
  /** Request timeout in ms (default: 15000) */
  timeoutMs?: number;
  /** Label for logging (e.g. URL or description) */
  label?: string;
}

/**
 * Returns true if the error/status is transient and worth retrying.
 * Retries: timeouts, network errors, 5xx, 429 (rate limit).
 * Does NOT retry: 400, 401, 403, 404 (these are real responses).
 *
 * Exception: 403 gets ONE retry (some WAFs are transient), controlled
 * by the caller via maxAttempts.
 */
function isRetryable(error: unknown, status?: number): boolean {
  // Network/timeout errors are always retryable
  if (error) return true;

  if (status === undefined) return false;

  // 429 = "try again later" — always retry
  if (status === 429) return true;

  // 5xx = server error — retry
  if (status >= 500) return true;

  return false;
}

/**
 * Fetch with automatic retry on transient failures.
 * Returns the Response on success, or null if all attempts fail.
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response | null> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const baseDelay = options?.baseDelayMs ?? 1000;
  const timeoutMs = options?.timeoutMs ?? 15000;
  const label = options?.label ?? url;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Build signal: merge caller's signal with our timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Respect Retry-After header on 429
      if (response.status === 429 && attempt < maxAttempts) {
        const retryAfter = response.headers.get("Retry-After");
        const waitMs = retryAfter
          ? (parseInt(retryAfter, 10) || 1) * 1000
          : baseDelay * Math.pow(2, attempt - 1);
        console.log(
          `[Retry ${attempt}/${maxAttempts}] ${label} — 429 Too Many Requests, waiting ${waitMs}ms`
        );
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      // 5xx — retry with backoff
      if (response.status >= 500 && attempt < maxAttempts) {
        const waitMs = baseDelay * Math.pow(2, attempt - 1);
        console.log(
          `[Retry ${attempt}/${maxAttempts}] ${label} — HTTP ${response.status}, retrying in ${waitMs}ms`
        );
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      // All other statuses (including 403, 404) — return as-is
      return response;
    } catch (e) {
      lastError = e;
      const isTimeout =
        e instanceof DOMException && e.name === "AbortError";
      const reason = isTimeout ? "timeout" : "network error";

      if (attempt < maxAttempts) {
        const waitMs = baseDelay * Math.pow(2, attempt - 1);
        console.log(
          `[Retry ${attempt}/${maxAttempts}] ${label} — ${reason}, retrying in ${waitMs}ms`
        );
        await new Promise((r) => setTimeout(r, waitMs));
      } else {
        console.error(
          `[Retry ${attempt}/${maxAttempts}] ${label} — ${reason}, all attempts exhausted`
        );
      }
    }
  }

  return null;
}
