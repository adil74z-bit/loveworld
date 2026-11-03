# Love World — Free Firebase Security MVP

## What changed
- Removed the hardcoded client-side gate hash and weak fallback hash.
- Added a cryptographically random 192-bit URL-safe invitation generator.
- The room key is derived with SHA-256; the raw invitation is not stored in localStorage.
- Added scoped Realtime Database rules for authenticated room access, per-UID player writes, chat author/length validation, and a maximum of two live presence children.
- Kept database rules separate from GitHub Pages deployment. They are not published to Firebase automatically.

## Threat model and limits
This is a best-effort free client-only MVP, not a server-trusted access-control system. The invitation is a bearer secret: anyone who gets it can enter. Firebase rules can validate authenticated UID and data shape, but cannot reliably implement server-issued invitations, revocation, moderation, or robust rate limits without trusted backend code. Realtime Database Rules cannot reliably enforce a two-player presence cap because the rule language has no supported child-count function. Emulator tests explicitly demonstrate that a third authenticated participant can write presence. Treat the two-player limit as a UI convention only until a trusted server can reserve slots atomically.

## Before enabling
1. Keep production RTDB rules locked.
2. Run Firebase Emulator Suite / Rules Unit Testing against database.rules.json.
3. Test anonymous auth, two simultaneous joins, a third join, cross-UID player writes, chat spoofing, oversized chat, and unauthorized reads/writes.
4. Publish rules only after all tests pass.
5. Optionally configure Firebase App Check with reCAPTCHA v3, start in monitoring mode, then enforce after verifying legitimate clients.

## Secrets
Firebase web config and web API key are public client configuration. Restrict the API key to exact web referrers and required Firebase APIs in Google Cloud Console. Never commit Firebase Admin SDK service-account credentials, private reCAPTCHA secret keys, or other server secrets.

## Deployment
This work is on security/free-firebase-mvp; GitHub Pages production remains on main until the branch is merged. RTDB rules are a separate manual Firebase Console action.
