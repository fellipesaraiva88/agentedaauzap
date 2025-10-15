#!/bin/bash

echo "🚀 =========================================="
echo "🚀 INSTALADOR AUTOMÁTICO DO BOT WHATSAPP"
echo "🚀 =========================================="
echo ""

# Verifica se Node.js está instalado
if ! command -v node &> /dev/null
then
    echo "❌ Node.js não está instalado!"
    echo "📥 Por favor, instale em: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"
echo ""

# Verifica se está na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado!"
    echo "Certifique-se de estar na pasta do projeto:"
    echo "cd /Users/saraiva/agentedaauzap"
    echo ""
    exit 1
fi

echo "📂 Pasta correta encontrada!"
echo ""

# Passo 1: Instalar dependências
echo "📦 PASSO 1/3: Instalando dependências..."
echo "⏳ Isso pode demorar alguns minutos..."
echo ""

npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependências instaladas com sucesso!"
    echo ""
else
    echo ""
    echo "❌ Erro ao instalar dependências!"
    echo "Tente rodar manualmente: npm install"
    echo ""
    exit 1
fi

# Passo 2: Compilar TypeScript
echo "🔨 PASSO 2/3: Compilando código TypeScript..."
echo ""

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Código compilado com sucesso!"
    echo ""
else
    echo ""
    echo "❌ Erro ao compilar código!"
    echo "Tente rodar manualmente: npm run build"
    echo ""
    exit 1
fi

# Passo 3: Verificar .env
echo "🔍 PASSO 3/3: Verificando configuração..."
echo ""

if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "Crie o arquivo .env com base no .env.example"
    echo ""
    exit 1
fi

echo "✅ Arquivo .env encontrado!"
echo ""

# Tudo pronto!
echo "🎉 =========================================="
echo "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "🎉 =========================================="
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. ✅ Instalação completa! (você está aqui)"
echo ""
echo "2. 🌐 Expor servidor para internet:"
echo "   Abra NOVA aba do Terminal (Cmd+T) e rode:"
echo "   npx ngrok http 3000"
echo ""
echo "3. 🔗 Configurar webhook:"
echo "   Copie a URL do ngrok e rode:"
echo "   ./scripts/configure-webhook.sh https://SUA-URL.ngrok.io/webhook"
echo ""
echo "4. 📱 Testar enviando mensagem no WhatsApp!"
echo ""
echo "🚀 Iniciando servidor agora..."
echo ""

# Inicia o servidor
npm start
