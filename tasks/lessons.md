# Lessons

- Create this file at session start when missing.
- Keep cloud environment changes minimal and verifiable.
- Always exclude webhook routes from auth middleware. Stripe webhooks have no session cookies - auth middleware just adds latency and timeout risk.
- Guard env vars with early returns and clear log messages before passing them to SDK methods. Passing `undefined` to typed SDK functions produces cryptic errors.
- Never leak internal error messages (err.message, stack traces, URLs) in API responses. Log them server-side, return generic messages to callers.
