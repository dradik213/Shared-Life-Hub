# Security Specification & Test-Driven Hardening for Shared Couple Hub

## 1. Data Invariants
1. **Isolated Multi-Couple Boundaries**: Any hub sub-resource (`events`, `stays`, `templates`, `messages`) belongs strictly to a `/hubs/{hubId}` document. Users outside that hub's `memberUids` cannot read or write to it.
2. **Identity Integrity**: User documents at `/users/{userId}` can only be created or modified by the authenticated user whose `request.auth.uid == userId`.
3. **Hub Membership Validation**: Sub-collection access requires verifying that `request.auth.uid in get(/databases/$(database)/documents/hubs/$(hubId)).data.memberUids`.
4. **Invite Code Lookup**: Any authenticated user can read or query a hub by its `inviteCode` in order to join the partner's hub, but cannot mutate arbitrary hub properties unless joining or already a member.
5. **No Cross-Hub Orphaned Writes**: Events or stays cannot be written with mismatched `hubId` values.

## 2. The "Dirty Dozen" Threat Payloads
1. **Payload 1 (Identity Spoofing)**: Attacker attempts to write to `/users/{victimId}` while authenticated as `attackerId`. Expected: `PERMISSION_DENIED`.
2. **Payload 2 (Hub Hijacking)**: Non-member attempts to update `/hubs/{targetHubId}` without matching `inviteCode`. Expected: `PERMISSION_DENIED`.
3. **Payload 3 (Cross-Hub Event Injection)**: User of Hub A tries to insert an event into `/hubs/{hubB}/events/{evilEvent}`. Expected: `PERMISSION_DENIED`.
4. **Payload 4 (Event Mismatched HubId)**: User tries to write an event into `/hubs/{hubA}/events/e1` where `incoming().hubId != hubA`. Expected: `PERMISSION_DENIED`.
5. **Payload 5 (Unauthenticated Read)**: Unauthenticated visitor attempts to read `/hubs/{hubA}/events`. Expected: `PERMISSION_DENIED`.
6. **Payload 6 (Oversized Payload / Denial of Wallet)**: Event title exceeding maximum string limit (e.g. 500 characters) or massive array payload. Expected: `PERMISSION_DENIED`.
7. **Payload 7 (Path Traversal / Malformed Document ID)**: Creating an event with special characters or invalid ID format. Expected: `PERMISSION_DENIED`.
8. **Payload 8 (Chat Impersonation)**: Writing a message with `senderId` different from `request.auth.uid`. Expected: `PERMISSION_DENIED`.
9. **Payload 9 (Cross-Hub Stay Poisoning)**: Non-member user writing overnight stay record to another couple's hub `/hubs/{hubB}/stays/2026-10-10`. Expected: `PERMISSION_DENIED`.
10. **Payload 10 (Template Deletion by Outsider)**: Non-member deleting `/hubs/{hubB}/templates/{tmplId}`. Expected: `PERMISSION_DENIED`.
11. **Payload 11 (Blanket List Leak)**: User attempting to query all hubs without matching membership or invite code. Expected: `PERMISSION_DENIED`.
12. **Payload 12 (Member List Tampering)**: Non-member arbitrarily overwriting `memberUids` with foreign users. Expected: `PERMISSION_DENIED`.

## 3. Test Runner Invariant Verification
All 12 attacks are blocked deterministically by:
- Catch-all default deny: `match /{document=**} { allow read, write: if false; }`
- Strict ID format enforcement `isValidId()`
- Master Gate checks `isHubMember(hubId)`
- Entity validation helpers (`isValidUser`, `isValidHub`, `isValidEvent`, `isValidStay`, `isValidTemplate`, `isValidMessage`).
