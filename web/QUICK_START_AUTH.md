# Quick Start - Authentication

## TL;DR

The login page now uses real JWT authentication. Click the demo button and login!

## Start the App

```bash
# Terminal 1 - Backend
cd /Users/saraiva/agentedaauzap
npm run dev

# Terminal 2 - Frontend
cd /Users/saraiva/agentedaauzap/web
npm run dev
```

## Test Login

1. Open: http://localhost:3001/login
2. Click: "Preencher com Credenciais Demo"
3. Click: "Entrar"
4. Success! You're now logged in.

## Demo Credentials

```
Email: feee@saraiva.ai
Password: Sucesso2025$
```

## Using Authentication in Components

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) {
    return <div>Please login</div>
  }

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

## Check If Logged In (Browser Console)

```javascript
// Check tokens
localStorage.getItem('accessToken')
localStorage.getItem('refreshToken')
```

## What Changed?

### Before
```tsx
// Mock login with setTimeout
setTimeout(() => {
  router.push('/dashboard')
}, 1000)
```

### After
```tsx
// Real authentication
try {
  await login(email, password)
  toast.success('Login realizado com sucesso!')
  router.push('/dashboard')
} catch (error) {
  toast.error('Email ou senha inválidos')
}
```

## Key Features

- ✅ Real JWT authentication
- ✅ Error handling with toast notifications
- ✅ Loading states
- ✅ Token persistence
- ✅ Auto-login on page refresh
- ✅ Demo button with real credentials

## File Structure

```
web/
├── contexts/
│   └── AuthContext.tsx          # Auth state management
├── app/
│   ├── login/
│   │   └── page.tsx             # Login page (updated)
│   └── providers.tsx            # App providers (updated)
└── .env.local                   # API URL config (new)
```

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| POST /api/auth/login | Login |
| GET /api/auth/me | Get user |
| POST /api/auth/logout | Logout |

## Troubleshooting

### Network Error
- Start backend: `cd /Users/saraiva/agentedaauzap && npm run dev`
- Check backend is on port 3000

### "Cannot find module 'react-hot-toast'"
```bash
cd /Users/saraiva/agentedaauzap/web
npm install react-hot-toast
```

### Invalid Credentials
- Use demo button
- Or check backend for existing users

## Documentation

- Full docs: `AUTH_IMPLEMENTATION.md`
- Testing guide: `TEST_LOGIN.md`
- Summary: `LOGIN_IMPLEMENTATION_SUMMARY.md`

## Status

✅ **Ready to use!**

---

Happy coding! 🚀
