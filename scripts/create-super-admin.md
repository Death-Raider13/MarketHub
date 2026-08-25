# Secure First Super-Admin Bootstrap

MarketHub requires both a Firestore profile role and a Firebase Authentication custom claim. **Do not edit only `users/{uid}.role`**, because protected API requests may still reject the account until the custom claim is synchronized.

## Prerequisites

Create or confirm the target account through the website and confirm that it appears in Firebase Authentication. The current first-super-admin target is:

```text
lateefedidi526@gmail.com
```

You need a Firebase service-account credential for the correct project. Never paste that credential into chat, browser code, GitHub, or a `NEXT_PUBLIC_*` environment variable.

## One-time bootstrap

From a trusted local machine, set the service-account JSON only for the current shell and run the repository script:

```bash
export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ...}'
node scripts/bootstrap-super-admin.mjs lateefedidi526@gmail.com
unset FIREBASE_SERVICE_ACCOUNT_JSON
```

The script is located at:

```text
scripts/bootstrap-super-admin.mjs
```

It performs these operations atomically as far as Firebase permits:

1. Finds the existing Firebase Authentication account by email.
2. Refuses to run if a `super_admin` already exists.
3. Sets the Firebase Authentication custom claim `role: super_admin`.
4. Synchronizes `users/{uid}` with `role: super_admin`, `status: active`, and the current Firebase `emailVerified` value.
5. Prints no password and does not create a password.

After successful use, unset the environment variable and rotate or revoke any temporary credential used for the operation.

## Refresh the account

The account owner must sign out and sign in again, or force an ID-token refresh, because custom claims are loaded into a new Firebase ID token. Then open:

```text
https://www.fero-elibrary.shop/admin/super-admin
```

## Verify the result

Confirm all of the following:

```text
Firebase Authentication → Users → lateefedidi526@gmail.com
Custom claims: role = super_admin
```

```text
Firestore → users → [the account UID]
role: super_admin
status: active
emailVerified: matches Firebase Authentication
```

The account should be able to access `/admin/super-admin`, create administrators, manage platform settings, and perform the protected super-admin operations.

## Ongoing administration

After the first super-admin exists, use the protected Super Admin dashboard to promote ordinary users to `admin`, `moderator`, or `support`. Do not run the bootstrap script again. Keep the number of super-admin accounts very small, enable multi-factor authentication where available, and review access regularly.

## Troubleshooting

If the dashboard still denies access after promotion, sign out completely, clear the old session, sign in again, and verify that the Firebase ID token was refreshed. If the Firestore role is correct but the custom claim is missing, rerun the protected synchronization process—not a Firestore-only edit.

If the email verification field is stale, sign in after the email is verified. MarketHub synchronizes Firebase Authentication’s `emailVerified` value into the Firestore profile during authentication-state refresh.
