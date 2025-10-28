# JWT Token Auto-Expiration Implementation

## Overview

This implementation provides automatic JWT token expiration handling with redirect to login when the token expires. It includes multiple approaches for different use cases.

## Components

### 1. Enhanced `useAuthToken` Hook

The main hook now includes JWT validation and automatic expiration handling:

```typescript
import { useAuthToken } from '@/hooks/use-auth-token';

// Basic usage with auto-redirect enabled (default)
const { getToken, setToken, removeToken, isTokenValid } = useAuthToken();

// Disable auto-redirect if you want manual control
const { getToken, checkTokenExpiration } = useAuthToken(false);
```

**Features:**
- JWT token validation using `jwtUtils`
- Automatic removal of expired tokens from cookies
- Periodic token checking (every 30 seconds)
- Auto-redirect to login on expiration
- Focus and visibility change detection

### 2. Token Expiration Hook

For more granular control over token expiration:

```typescript
import { useTokenExpiration } from '@/hooks/use-token-expiration';

const { checkToken, isTokenExpired } = useTokenExpiration({
  enabled: true,
  checkInterval: 30000, // 30 seconds
  warningThreshold: 300, // 5 minutes
  redirectPath: '/auth/login',
  onTokenExpired: () => {
    // Custom callback when token expires
    console.log('Token expired!');
  },
  onTokenWarning: (timeLeft) => {
    // Custom callback when token is about to expire
    console.log(`Token expires in ${timeLeft} seconds`);
  }
});
```

### 3. Auth Provider

Global authentication state management:

```typescript
import { AuthProvider } from '@/components/providers/AuthProvider';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider
      enableAutoRedirect={true}
      checkInterval={30000}
      warningThreshold={300}
      redirectPath="/auth/login"
      showToastWarnings={true}
    >
      <Component {...pageProps} />
    </AuthProvider>
  );
}
```

### 4. Auth Guard Component

Protect specific routes:

```typescript
import { AuthGuard } from '@/components/AuthGuard';

export default function ProtectedPage() {
  return (
    <AuthGuard redirectTo="/auth/login">
      <div>This content is protected</div>
    </AuthGuard>
  );
}
```

## Usage Examples

### Protecting Your App Layout

Wrap your main layout with the AuthProvider:

```typescript
// app/layout.tsx
import { AuthProvider } from '@/components/providers/AuthProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Individual Page Protection

```typescript
// app/dashboard/page.tsx
import { AuthGuard } from '@/components/AuthGuard';

export default function Dashboard() {
  return (
    <AuthGuard>
      <div>Dashboard content</div>
    </AuthGuard>
  );
}
```

### Manual Token Checking

```typescript
import { useAuthToken } from '@/hooks/use-auth-token';

export default function MyComponent() {
  const { getToken, isTokenValid, checkTokenExpiration } = useAuthToken(false);

  const handleApiCall = async () => {
    // Check token before making API call
    if (!isTokenValid()) {
      router.push('/auth/login');
      return;
    }

    const token = getToken();
    // Make API call with token
  };

  return (
    <button onClick={handleApiCall}>
      Make API Call
    </button>
  );
}
```

## Configuration

### Default Settings

- **Check Interval**: 30 seconds
- **Warning Threshold**: 5 minutes before expiration  
- **Redirect Path**: `/auth/login`
- **Auto-redirect**: Enabled by default

### Customization

You can customize the behavior by passing options to the hooks:

```typescript
const { getToken } = useAuthToken(true); // Enable auto-redirect

const { checkToken } = useTokenExpiration({
  checkInterval: 60000, // Check every minute
  warningThreshold: 600, // Warn 10 minutes before expiration
  redirectPath: '/custom-login',
});
```

## Error Handling

The implementation includes comprehensive error handling:

- Invalid JWT tokens are automatically removed
- Network issues don't crash the app
- Failed redirects are logged but don't block the UI
- Malformed cookies are cleaned up automatically

## Security Features

- JWT signature validation (client-side basic validation)
- Automatic cleanup of expired tokens
- Secure cookie settings with SameSite and Secure flags
- Protection against token reuse after expiration
- Prevents multiple simultaneous redirects

## Browser Event Handling

The system responds to various browser events:

- **Tab Focus**: Checks token when user returns to tab
- **Visibility Change**: Validates token when page becomes visible
- **Periodic Checks**: Regular interval-based validation
- **Manual Triggers**: API call validations and user actions

This provides a robust, user-friendly authentication experience that automatically handles token expiration while keeping the user informed and securely logged in.