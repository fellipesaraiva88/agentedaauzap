#!/bin/bash

TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"feee@saraiva.ai","password":"Sucesso2025$"}' | jq -r '.tokens.accessToken')

echo "Creating settings for company 4..."
curl -s -X POST http://localhost:3000/api/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": 4,
    "company_name": "Test Company",
    "agent_name": "AI Assistant",
    "opening_time": "09:00",
    "closing_time": "18:00",
    "max_concurrent_capacity": 5,
    "timezone": "America/Sao_Paulo",
    "reminder_d1_active": true,
    "reminder_12h_active": true,
    "reminder_4h_active": true,
    "reminder_1h_active": true
  }' | jq '.'
