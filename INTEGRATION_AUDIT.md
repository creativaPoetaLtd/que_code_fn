# Integration Audit — Poeta (que_code_fn ↔ que_code_bn)

Date: 2026-06-24
Branch: `fx-act`

This document tracks two integration gaps:
1. **Frontend features that are NOT wired to the backend.**
2. **Backend features that have NO frontend consumer.**

Items are listed by priority within each section.

---

## Part 1 — Frontend Features Missing Backend Integration

### High Priority

1. **Privacy Settings**
   - File: [components/settings/PrivacyTab.tsx](components/settings/PrivacyTab.tsx#L33)
   - Issue: No-op save (simulated 1000 ms delay only). Handlers exist but no API call.
   - Missing: `PATCH /users/privacy-settings` (or equivalent) integration.
   - Impact: User privacy preferences are not persisted.

2. **Payment Methods & Bank Accounts**
   - File: [components/settings/PaymentTab.tsx](components/settings/PaymentTab.tsx#L50)
   - Issue: Hardcoded payment methods/bank accounts; handlers are non-functional.
   - Missing: `setDefaultPaymentMethod()`, `setDefaultBankAccount()`, `increaseLimits()` API calls.
   - Impact: Entire payment-management UI is dead.

3. **Invite Page**
   - File: [app/invite/page.tsx](app/invite/page.tsx#L8-L13)
   - Issue: Uses hardcoded sample invitation data (Miss Rwanda, John Doe, dummy email/dates).
   - Missing: Dynamic loading of actual invitation from URL params or API.
   - Impact: Cannot accept/decline real invitations.

4. **Organization Wallet Demo**
   - File: [app/organization-wallet-demo/page.tsx](app/organization-wallet-demo/page.tsx#L12)
   - Issue: Mock organizations array with `// in real app, this would come from API`.
   - Missing: `getOrganizations()` API call.
   - Impact: Demo page does not reflect the user's actual organizations.

### Medium Priority

5. **Account Deletion Workflow**
   - File: [components/settings/PrivacyTab.tsx](components/settings/PrivacyTab.tsx#L52)
   - Issue: `TODO` comment; shows a toast instead of executing the workflow.
   - Missing: Account deletion API endpoint and confirmation flow.
   - Impact: Users cannot delete their accounts.

6. **Notification Preferences**
   - File: [components/settings/NotificationsTab.tsx](components/settings/NotificationsTab.tsx#L91)
   - Issue: Sound/vibration saved to localStorage; transaction/group toggles never sync.
   - Missing: `PATCH /users/notification-preferences` call.
   - Impact: Email/SMS/push preferences not saved server-side.

7. **Profile Verification (KYC)**
   - File: [components/settings/ProfileTab.tsx](components/settings/ProfileTab.tsx)
   - Issue: ID and address verification buttons carry `TODO: Implement`.
   - Missing: KYC API endpoints and verification flow.
   - Impact: KYC/verification features non-functional.

### Low Priority

8. **Category Transaction Drill-down**
   - File: [components/analytics/CategoryTransactionPopover.tsx](components/analytics/CategoryTransactionPopover.tsx)
   - Issue: `TODO` on click handler; no route/API for per-category transaction list.
   - Missing: Detailed transaction analytics by category.
   - Impact: Clicking category breakdown items is a no-op.

> **Already integrated (no action needed):** auth, transactions, chat, actions, analytics, and groups — all wired through ~62 helpers in [helpers/api.ts](helpers/api.ts). The currently opened [app/action/[userId]/page.tsx](app/action/[userId]/page.tsx) is part of that integrated set.

---

## Part 2 — Backend Features Missing Frontend Consumer

### High Priority

1. **Admin Notifications Broadcast**
   - Endpoint: `POST /api/v1/admin/notifications/broadcast`
   - File: [../que_code_bn/src/routes/admin.notifications.routes.ts](../que_code_bn/src/routes/admin.notifications.routes.ts)
   - What: Send broadcast notifications to all/selected users.
   - Why: Critical admin capability for platform-wide announcements.

2. **Contact Invitations by Public ID (QR)**
   - Endpoint: `POST /api/v1/contact-invitations/by-public-id`
   - File: [../que_code_bn/src/routes/contactInvitation.routes.ts](../que_code_bn/src/routes/contactInvitation.routes.ts)
   - What: Send contact invitations via QR-code scans.
   - Why: Core social feature; pairs directly with the Invite page already flagged in Part 1.

3. **Support Chat Admin Panel**
   - Endpoints: `GET/POST /api/v1/admin/support/chats`, `GET/POST /api/v1/admin/support/chats/:chatId/messages`
   - File: [../que_code_bn/src/routes/admin.support.routes.ts](../que_code_bn/src/routes/admin.support.routes.ts)
   - What: Operator UI to manage user support chats.
   - Why: Operators cannot reply to user support without this.

4. **Admin Dashboard Statistics**
   - Endpoint: `GET /api/v1/admin/dashboard/statistics`
   - File: [../que_code_bn/src/routes/admin.dashboard.routes.ts](../que_code_bn/src/routes/admin.dashboard.routes.ts)
   - What: Platform-wide statistics for the admin dashboard.
   - Why: Essential admin landing data.

### Medium Priority

5. **Roles & Permissions Management**
   - Endpoints: `GET/POST/PUT/DELETE /api/v1/roles` and `/api/v1/permissions`
   - Files: [../que_code_bn/src/routes/role.routes.ts](../que_code_bn/src/routes/role.routes.ts), [permission.routes.ts](../que_code_bn/src/routes/permission.routes.ts)
   - What: Manage user roles and access-control permissions.
   - Why: Admin RBAC management.

6. **Audit Logs**
   - Endpoints: `GET /api/v1/admin/audit-logs[/:id|/user/:userId]`
   - File: [../que_code_bn/src/routes/auditLog.routes.ts](../que_code_bn/src/routes/auditLog.routes.ts)
   - What: Track admin/system actions.
   - Why: Compliance and security review.

7. **Admin Action Moderation**
   - Endpoints: `PUT /api/v1/admin/actions/:id/suspend`, `…/status`
   - File: [../que_code_bn/src/routes/admin.action.routes.ts](../que_code_bn/src/routes/admin.action.routes.ts)
   - What: Suspend/manage actions for policy violations.
   - Why: Moderation capability.

8. **Admin Group Management**
   - Endpoints: `DELETE /api/v1/admin/groups/:id`, `…/members/:userId`
   - File: [../que_code_bn/src/routes/admin.groups.routes.ts](../que_code_bn/src/routes/admin.groups.routes.ts)
   - What: Admin-level group deletion and member removal.
   - Why: Compliance/moderation.

9. **Platform Analytics**
   - Endpoint: `GET /api/v1/admin/analytics/platform`
   - File: [../que_code_bn/src/routes/admin.analytics.routes.ts](../que_code_bn/src/routes/admin.analytics.routes.ts)
   - What: Aggregated platform metrics.
   - Why: Business intelligence.

### Low Priority

10. **Wallet Admin Controls**
    - Endpoint: `PUT /api/v1/admin/wallets/:id/status`
    - File: [../que_code_bn/src/routes/admin.wallets.routes.ts](../que_code_bn/src/routes/admin.wallets.routes.ts)
    - What: Enable/disable wallets for compliance.
    - Why: Edge-case admin operation.

11. **Push Subscriptions**
    - Endpoints: `POST/DELETE /api/v1/push-subscriptions`
    - File: [../que_code_bn/src/routes/pushSubscription.routes.ts](../que_code_bn/src/routes/pushSubscription.routes.ts)
    - What: Manage PWA push-notification subscriptions.
    - Why: Required only if PWA push is on the roadmap.

12. **Link Preview**
    - Endpoint: `GET /api/v1/link-preview?url=...`
    - File: [../que_code_bn/src/routes/link-preview.routes.ts](../que_code_bn/src/routes/link-preview.routes.ts)
    - What: Generate OG metadata previews for chat links.
    - Why: Nice-to-have chat enhancement.

13. **Outside Messages**
    - Endpoints: `POST /api/v1/outside-messages`, `GET /api/v1/outside-messages/inbox`
    - File: [../que_code_bn/src/routes/outsideMessage.routes.ts](../que_code_bn/src/routes/outsideMessage.routes.ts)
    - What: Messages from non-registered users.
    - Why: Niche feature.

---

## Summary

- **Frontend gaps (8):** mostly in Settings (privacy, payments, notifications, KYC, deletion) plus the Invite and Organization-Wallet pages.
- **Backend gaps (13):** overwhelmingly the **admin/operator surface** — no admin UI exists to consume dashboard stats, support chat, broadcasts, RBAC, audit logs, moderation, or platform analytics. Only the QR contact-invitation endpoint sits on the user-facing side and ties into the Invite page already flagged in Part 1.

**Recommended next steps:**
1. Wire the Part-1 High-priority items (Privacy → Payments → Invite → Org Wallet).
2. Scaffold an `/admin` section starting with Dashboard Statistics + Support Chat, then layer in Broadcasts and RBAC.
