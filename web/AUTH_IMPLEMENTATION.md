# Authentication Implementation

## Overview
The login page has been updated to use real JWT-based authentication with the backend API.

## Files Modified

### 1. `/Users/saraiva/agentedaauzap/web/app/login/page.tsx`
- Integrated `useAuth` hook for real authentication
- Added `react-hot-toast` for error/success notifications
- Implemented proper error handling for different error scenarios:
  - 401: Invalid credentials
  - 403: Inactive company
  - Other errors: Generic error message
- Updated demo button to fill in credentials: `feee@saraiva.ai` / `Sucesso2025$`

### 2. `/Users/saraiva/agentedaauzap/web/contexts/AuthContext.tsx` (NEW)
- Created AuthContext to manage authentication state globally
- Provides `useAuth` hook with the following:
  - `user`: Current user object or null
  - `loading`: Loading state
  - `login(email, password)`: Login method
  - `logout()`: Logout method
  - `isAuthenticated`: Boolean flag
- Automatically loads user on mount from localStorage tokens
- Configures axios interceptor to attach auth token to all requests
- Stores JWT tokens in localStorage

### 3. `/Users/saraiva/agentedaauzap/web/app/providers.tsx`
- Added `AuthProvider` wrapper
- Added `Toaster` component from react-hot-toast
- Configured toast styling (dark theme, position, duration)

### 4. `/Users/saraiva/agentedaauzap/web/.env.local` (NEW)
- Added `NEXT_PUBLIC_API_URL=http://localhost:3000`

## Dependencies Added
```bash
npm install react-hot-toast
```

## How It Works

### Login Flow
1. User enters email and password
2. Form submits to `handleLogin`
3. `useAuth().login()` is called
4. AuthContext makes POST request to `/api/auth/login`
5. Backend validates credentials and returns JWT tokens + user data
6. Tokens stored in localStorage
7. User state updated in context
8. Success toast shown
9. Redirect to `/dashboard`

### Error Handling
- Network errors: Generic error toast
- 401 Unauthorized: "Email ou senha inválidos"
- 403 Forbidden: "Empresa inativa. Entre em contato com o suporte."
- Custom backend errors: Shows error.response.data.message

### Token Management
- Access token stored in `localStorage.accessToken`
- Refresh token stored in `localStorage.refreshToken`
- Axios interceptor automatically adds `Authorization: Bearer <token>` to requests
- On mount, AuthContext attempts to load user from `/api/auth/me`

### Logout Flow
1. User calls `logout()`
2. POST request to `/api/auth/logout` (optional, for server-side tracking)
3. Clear tokens from localStorage
4. Clear user state
5. User redirected to login

## Demo Credentials
The demo button fills in the following credentials:
- **Email:** feee@saraiva.ai
- **Password:** Sucesso2025$

## API Endpoints Used
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

## Next Steps
Consider implementing:
1. Protected route wrapper to redirect unauthenticated users
2. Token refresh logic when access token expires
3. Remember me functionality
4. Password reset flow
5. Session timeout handling

## TypeScript Interfaces

### User
```typescript
interface User {
  id: number
  email: string
  name: string
  phone?: string
  role: string
  companyId: number
  companyName?: string
  companySlug?: string
  createdAt?: string
}
```

### AuthTokens
```typescript
interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
```

## Usage Example

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) {
    return <div>Please login</div>
  }

  return (
    <div>
      Welcome, {user?.name}!
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

## Testing
1. Start backend: `cd /Users/saraiva/agentedaauzap && npm run dev`
2. Start frontend: `cd /Users/saraiva/agentedaauzap/web && npm run dev`
3. Navigate to http://localhost:3001/login
4. Click "Preencher com Credenciais Demo"
5. Click "Entrar"
6. Should see success toast and redirect to dashboard

## Troubleshooting

### Error: "Cannot find module 'react-hot-toast'"
Run: `npm install react-hot-toast`

### Error: Network request failed
- Ensure backend is running on port 3000
- Check NEXT_PUBLIC_API_URL in .env.local

### Error: CORS issues
- Backend should have CORS enabled for http://localhost:3001
- Check backend CORS configuration

### Tokens not persisting
- Check browser localStorage
- Ensure third-party cookies are not blocked
- Check browser console for errors
