# Welcome Page — Backend API Gaps

Last updated: 2026-04-20

Purpose: this file is strictly for backend work needed by `/welcome/[userId]`.

Only missing backend APIs/fields are listed below.

---

## 1. Profile Visibility + Social Links

### Required request/persistence addition

Backend must accept and return welcome visibility flags on profile create/update and profile fetch responses:

```json
{
  "showPhoneOnWelcome": true,
  "showProfileImageOnWelcome": true,
  "showStatusMessageOnWelcome": true,
  "showProfileTypeOnWelcome": true,
  "showLocationOnWelcome": true,
  "showTinOnWelcome": true,
  "showLogoOnWelcome": true,
  "showCategoryOnWelcome": true,
  "showSocialLinksOnWelcome": true,
  "showGalleryOnWelcome": true,
  "showOrgStatsOnWelcome": true,
  "showActionsOnWelcome": true,
  "showSendMoneyOnWelcome": true,
  "showContactFormOnWelcome": true,
  "showOtherInfoOnWelcome": true,
  "showFriendRequestOnWelcome": true
}
```

### Notes for backend

- Persist these booleans with the profile record.
- Return them from `GET /profiles?userId=<id>&organizationId=<id>`.
- Default missing values to `true` so existing profiles keep current visibility.

### Required response addition

The profile payload returned by:

```
GET /profiles?userId=<id>&organizationId=<id>
```

should include:

```json
{
  "socialLinks": {
    "instagram": "https://instagram.com/...",
    "facebook": "https://facebook.com/...",
    "twitter": "https://twitter.com/...",
    "linkedin": "https://linkedin.com/..."
  }
}
```

### Notes for backend

- Return empty strings or omit keys consistently when not configured.
- Validate URLs server-side before persisting.

### Status

❌ Missing

---

## 2. Gallery Endpoints

### Required endpoints

```
GET /profiles/:userId/gallery
GET /organizations/:orgId/gallery
```

### Expected response

```json
{
  "items": [
    {
      "id": "string",
      "imageUrl": "string",
      "caption": "string",
      "createdAt": "ISO-8601"
    }
  ]
}
```

### Notes for backend

- Public read access is acceptable for welcome page usage.
- Return newest-first ordering.

### Status

❌ Missing

---

## 3. Organization Stats Endpoint

### Required endpoint

```
GET /organizations/:orgId/stats
```

### Expected response

```json
{
  "scansThisWeek": 0,
  "totalBookings": 0,
  "audienceRating": 0,
  "liveActionsCount": 0
}
```

### Notes for backend

- `audienceRating` should be numeric in range 0-5.
- Keep field names stable; frontend will map directly.

### Status

❌ Missing

---

## 4. Public Actions: minPrice Field

### Required response addition

The list returned by:

```
GET /organizations/:id/actions/public
```

should include on each action:

```json
{
  "minPrice": "45.00",
  "currency": "EUR"
}
```

### Notes for backend

- `minPrice` = lowest active sub-action price for that action.
- Keep `currency` consistent with action/sub-actions currency rules.

### Status

❌ Missing (for welcome grid pricing)

---

## 5. Operational Document Exposure Policy

### Decision required

`operationalDocument` is present in profile data, but backend policy should be explicit:

- Is this field public on welcome profiles?
- If sensitive, should it be hidden unless authenticated/authorized?

### Status

⚠️ Backend policy decision pending

---

## Backend Summary

| Item | API / Contract | Backend status |
|---|---|---|
| Welcome visibility flags | Persist and return per-section booleans on profile payload | ❌ Missing |
| Social links in profile | Add `socialLinks` to profile response | ❌ Missing |
| Profile gallery | `GET /profiles/:userId/gallery` | ❌ Missing |
| Organization gallery | `GET /organizations/:orgId/gallery` | ❌ Missing |
| Organization stats | `GET /organizations/:orgId/stats` | ❌ Missing |
| Action card min price | Add `minPrice` (+ currency consistency) in actions/public response | ❌ Missing |
| operationalDocument policy | Define public/private exposure rule | ⚠️ Decision pending |
