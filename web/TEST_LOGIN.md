# Login Page Testing Guide

## Pre-requisites
1. Backend server running on port 3000
2. Frontend server running on port 3001
3. Database is migrated and seeded with test user

## Test User Credentials
- **Email:** feee@saraiva.ai
- **Password:** Sucesso2025$

## Manual Testing Steps

### Test 1: Demo Button
1. Navigate to http://localhost:3001/login
2. Click "Preencher com Credenciais Demo" button
3. Verify email field shows: feee@saraiva.ai
4. Verify password field shows: Sucesso2025$

### Test 2: Successful Login
1. Navigate to http://localhost:3001/login
2. Click "Preencher com Credenciais Demo"
3. Click "Entrar"
4. Expected:
   - Button shows "Entrando..." state
   - Success toast appears: "Login realizado com sucesso!"
   - Redirects to /dashboard
   - User data stored in localStorage

### Test 3: Invalid Credentials
1. Navigate to http://localhost:3001/login
2. Enter invalid email/password
3. Click "Entrar"
4. Expected:
   - Error toast appears: "Email ou senha inválidos"
   - Stays on login page
   - No redirect

### Test 4: Empty Form Validation
1. Navigate to http://localhost:3001/login
2. Leave email and password empty
3. Try to submit
4. Expected:
   - Browser HTML5 validation prevents submit
   - Shows "Please fill out this field" messages

### Test 5: Backend Down
1. Stop backend server
2. Navigate to http://localhost:3001/login
3. Enter credentials and submit
4. Expected:
   - Error toast: "Erro ao fazer login. Tente novamente."
   - Console shows network error

### Test 6: Token Persistence
1. Login successfully
2. Open browser DevTools > Application > Local Storage
3. Verify presence of:
   - `accessToken`
   - `refreshToken`
4. Refresh page
5. Expected:
   - User remains logged in
   - Dashboard loads without redirect to login

## Automated Testing (Browser Console)

### Check if user is authenticated
```javascript
// Open browser console on any page
const accessToken = localStorage.getItem('accessToken')
const refreshToken = localStorage.getItem('refreshToken')
console.log('Access Token:', accessToken)
console.log('Refresh Token:', refreshToken)
```

### Manually test login API
```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'feee@saraiva.ai',
    password: 'Sucesso2025$'
  })
})
  .then(r => r.json())
  .then(data => console.log('Login response:', data))
  .catch(err => console.error('Login error:', err))
```

### Test /me endpoint
```javascript
const token = localStorage.getItem('accessToken')
fetch('http://localhost:3000/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => console.log('User data:', data))
  .catch(err => console.error('Error:', err))
```

## Common Issues

### Issue: "Cannot find module 'react-hot-toast'"
**Solution:** Run `npm install react-hot-toast` in web directory

### Issue: Network error / CORS
**Solution:**
- Ensure backend is running
- Check backend has CORS enabled for http://localhost:3001
- Verify NEXT_PUBLIC_API_URL in .env.local

### Issue: 404 on /api/auth/login
**Solution:**
- Verify backend auth routes are registered
- Check backend logs for route registration message
- Test directly: `curl http://localhost:3000/api/auth/login`

### Issue: User not found error
**Solution:**
- Ensure database has the test user
- Run migrations and seed data
- Or create user via /api/auth/register endpoint

## Success Criteria
- All 6 manual tests pass
- No console errors (except expected validation errors)
- Proper error handling for edge cases
- Smooth UX with loading states and toast notifications
- Tokens properly stored and persisted

## Next Steps After Testing
1. Implement protected routes
2. Add logout functionality to dashboard
3. Implement token refresh
4. Add password reset flow
5. Add registration flow
