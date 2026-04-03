# Full Architectural Pivot: creator to Creator

This plan completes the "Creator Identity" transition by replacing all internal "creator" terms with "Creator" at the database, role, and logic levels.

## Proposed Changes

### [Database & Security]

#### [MODIFY] [firestore.rules](file:///c:/Users/DELL/CascadeProjects/MarketHub/firestore.rules)
- Rename `iscreator()` to `isCreator()`.
- Rename `isVerifiedcreator()` to `isVerifiedCreator()`.
- Rename `iscreatorOwner()` to `isCreatorOwner()`.
- Change `match /creators/{creatorId}` to `match /creators/{creatorId}`.
- Update all collection references (e.g., `creatorBalances` -> `creatorBalances`).
- Relax `creators` creation rule to ensure new users can initialize their profile during onboarding.

### [Authentication & Authorization]

#### [MODIFY] [auth-context.tsx](file:///c:/Users/DELL/CascadeProjects/MarketHub/lib/firebase/auth-context.tsx)
- Update [UserRole](file:///c:/Users/DELL/CascadeProjects/MarketHub/lib/firebase/auth-context.tsx#34-35) type: replace `"creator"` with `"creator"`.
- Update [signUp](file:///c:/Users/DELL/CascadeProjects/MarketHub/lib/firebase/auth-context.tsx#146-196) and [signInWithGoogle](file:///c:/Users/DELL/CascadeProjects/MarketHub/lib/firebase/auth-context.tsx#197-269) to use the `"creator"` role identifier.
- Update profile loading logic to handle the new role.

### [Onboarding & Registration]

#### [MODIFY] [creator-register-new/page.tsx](file:///c:/Users/DELL/CascadeProjects/MarketHub/app/auth/creator-register-new/page.tsx)
- Rename route if possible, or update all logic to use `creators` collection.
- Fix broken email signup path to save the new `creators` document.
- Consolidate data into the `creators` collection with `ownerId` always set.

### [Storefront & Logic]

#### [MODIFY] [reputation.ts](file:///c:/Users/DELL/CascadeProjects/MarketHub/lib/services/reputation.ts)
- Update code to query the `creators` collection.
- Rename related variables (e.g., `creatorId` -> `creatorId`).

#### [MODIFY] [store/[creatorId]/page.tsx](file:///c:/Users/DELL/CascadeProjects/MarketHub/app/hub/[creatorId]/page.tsx)
- Update queries to use the `creators` collection.
- Update UI text and variables to reflect "Creator Hub."

## Verification Plan

### Automated Tests
- Run `grep -r "creator" .` to find all remaining legacy instances.
- Deploy updated [firestore.rules](file:///c:/Users/DELL/CascadeProjects/MarketHub/firestore.rules).
- Run `npm run build` to verify type safety after renaming.

### Manual Verification
- Complete the "Launch Creator Hub" flow: Verify document exists in `creators` collection.
- Log in as a Creator: Verify dashboard access with the new `"creator"` role.
- Verify "Missing or insufficient permissions" error is resolved.
