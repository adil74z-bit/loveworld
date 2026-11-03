# Love World — Free Firebase Security MVP

## What changed
- Removed the hardcoded client-side gate hash and weak fallback hash.
- Added a cryptographically random 192-bit URL-safe invitation generator.
- The room key is derived with SHA-256; the raw invitation is not stored in localStorage.
- Added scoped Realtime Database rules for authenticated room access, per-UID player writes, and chat author/length validation.
- Kept database rules separate from GitHub Pages deployment. They are not published to Firebase automatically.

## Threat model and limits
This is a best-effort free client-only MVP, not a server-trusted access-control system. The invitation is a bearer secret: anyone who gets it can enter. Firebase rules can validate authenticated UID and data shape, but cannot reliably implement server-issued invitations, revocation, moderation, or robust rate limits without trusted backend code. Realtime Database Rules cannot reliably enforce a strict two-player presence cap because the rule language has no supported child-count function. Emulator tests explicitly demonstrate that a third authenticated participant can write presence. Treat the two-player limit as a UI convention only until a trusted server can reserve slots atomically.

## Automated verification
GitHub Actions runs the Firebase Database Emulator test suite. The latest successful run reports 7/7 tests passing and `npm audit` reports 0 vulnerabilities in the committed project dependency tree. The Firebase CLI is installed separately in CI and is not part of the app dependency tree. This does not mean the isolated CLI's transitive dependency tree or the production web app has been fully security-audited.

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
