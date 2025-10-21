#!/bin/bash
# Start script para servir arquivos estáticos do Next.js no Render
# Usa a variável PORT do Render ou fallback para 3001

PORT=${PORT:-3001}
echo "Starting serve on port $PORT..."
npx serve@latest out -l $PORT
