# Three-attempt sign-in lockout

School requirement: block login after three incorrect credential attempts. Frontend currently adds a browser-local 15-minute block and counts HTTP 401 responses. This is only a user-interface guard; clearing storage or using another device bypasses it. Do not claim account security enforcement until the backend implements it.

Enforce an atomic, shared account-level failure counter across login aliases, devices and application instances. After three invalid password attempts within 15 minutes, block further credential login for 15 minutes. Reset after successful authentication or expiry. Apply consistent policy to password and any alternate credential login routes; OTP/PIN need separate throttles. Do not count network/5xx failures or reject valid users because a service is unavailable.

Return generic invalid-credential responses without exposing whether the account exists. During lockout return HTTP 429 with Retry-After seconds and an agreed JSON lockout code. Enforce expiry server-side even if the client resubmits directly. Combine with IP/device rate limiting to reduce malicious account lockouts; audit attempts without storing passwords. Administrative unlock requires an authorized, audited operation.

Test three invalid attempts, blocked correct password during lockout, cross-device enforcement, concurrent requests, expiry, successful-login reset and service failures not incrementing counters. No backend enforcement has been implemented or live-tested in this frontend checkout.
