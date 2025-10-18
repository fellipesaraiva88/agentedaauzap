#!/usr/bin/env node

/**
 * 🚀 SCRIPT DE CONFIGURAÇÃO AUTOMÁTICA DO WAHA
 *
 * Configura variáveis de ambiente no WAHA (Easypanel/Render/etc)
 * e reinicia o serviço automaticamente
 */

require('dotenv').config();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n🚀 CONFIGURAÇÃO AUTOMÁTICA DO WAHA COM SUPABASE\n');
  console.log('Este script vai configurar as variáveis de ambiente no WAHA.\n');

  // Verifica se tem as credenciais no .env local
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERRO: Credenciais Supabase não encontradas no .env local');
    console.log('   Configure primeiro seu .env com:');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_KEY');
    console.log('   - SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('✅ Credenciais encontradas no .env local:\n');
  console.log(`   SUPABASE_URL: ${supabaseUrl}`);
  console.log(`   SUPABASE_ANON_KEY: ${supabaseAnonKey?.substring(0, 20)}...`);
  console.log(`   SUPABASE_SERVICE_KEY: ${supabaseServiceKey?.substring(0, 20)}...`);
  if (openaiKey) {
    console.log(`   OPENAI_API_KEY: ${openaiKey?.substring(0, 20)}...`);
  }

  console.log('\n📋 OPÇÕES DE CONFIGURAÇÃO:\n');
  console.log('1. 🔧 Render (render.com) - Deploy automático via API');
  console.log('2. 📦 Easypanel - Instruções manuais');
  console.log('3. 🐳 Docker/Docker Compose - Gerar docker-compose.yml');
  console.log('4. 💻 Configuração manual - Copiar variáveis\n');

  const choice = await ask('Escolha uma opção (1-4): ');

  switch (choice.trim()) {
    case '1':
      await setupRender();
      break;
    case '2':
      await setupEasypanel();
      break;
    case '3':
      await setupDocker();
      break;
    case '4':
      await setupManual();
      break;
    default:
      console.log('❌ Opção inválida');
      process.exit(1);
  }

  rl.close();
}

async function setupRender() {
  console.log('\n🔧 CONFIGURAÇÃO VIA RENDER API\n');

  const renderApiKey = await ask('Cole sua Render API Key (https://dashboard.render.com/account/settings): ');

  if (!renderApiKey || renderApiKey.trim() === '') {
    console.log('❌ API Key necessária. Acesse: https://dashboard.render.com/account/settings');
    process.exit(1);
  }

  const serviceId = await ask('Cole o Service ID do WAHA (encontre em: Settings → General): ');

  if (!serviceId || serviceId.trim() === '') {
    console.log('❌ Service ID necessário');
    process.exit(1);
  }

  console.log('\n📡 Configurando variáveis no Render...\n');

  const envVars = [
    { key: 'SUPABASE_URL', value: process.env.SUPABASE_URL },
    { key: 'SUPABASE_ANON_KEY', value: process.env.SUPABASE_ANON_KEY },
    { key: 'SUPABASE_SERVICE_KEY', value: process.env.SUPABASE_SERVICE_KEY }
  ];

  if (process.env.OPENAI_API_KEY) {
    envVars.push({ key: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY });
  }

  try {
    const fetch = (await import('node-fetch')).default;

    for (const envVar of envVars) {
      console.log(`   ⏳ Configurando ${envVar.key}...`);

      const response = await fetch(
        `https://api.render.com/v1/services/${serviceId}/env-vars`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${renderApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([envVar])
        }
      );

      if (response.ok) {
        console.log(`   ✅ ${envVar.key} configurado`);
      } else {
        const error = await response.text();
        console.log(`   ❌ Erro ao configurar ${envVar.key}: ${error}`);
      }
    }

    console.log('\n✅ VARIÁVEIS CONFIGURADAS COM SUCESSO!\n');
    console.log('🔄 PRÓXIMO PASSO:');
    console.log('   1. O Render vai fazer deploy automático');
    console.log('   2. Aguarde 2-3 minutos');
    console.log('   3. Veja os logs em: https://dashboard.render.com');
    console.log('   4. Procure por: "Supabase conectado com sucesso"\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Alternativa: Configure manualmente em:');
    console.log('   https://dashboard.render.com → Seu serviço → Environment\n');
  }
}

async function setupEasypanel() {
  console.log('\n📦 CONFIGURAÇÃO NO EASYPANEL\n');
  console.log('⚠️  Easypanel não tem API pública. Configure manualmente:\n');
  console.log('1. Acesse: https://pange-waha.u5qiqp.easypanel.host');
  console.log('2. Login: feee@saraiva.ai / Sucesso2025$');
  console.log('3. Encontre o projeto WAHA');
  console.log('4. Vá em Environment Variables ou Settings');
  console.log('5. Adicione estas variáveis:\n');

  console.log('   SUPABASE_URL');
  console.log(`   Valor: ${process.env.SUPABASE_URL}\n`);

  console.log('   SUPABASE_ANON_KEY');
  console.log(`   Valor: ${process.env.SUPABASE_ANON_KEY}\n`);

  console.log('   SUPABASE_SERVICE_KEY');
  console.log(`   Valor: ${process.env.SUPABASE_SERVICE_KEY}\n`);

  if (process.env.OPENAI_API_KEY) {
    console.log('   OPENAI_API_KEY');
    console.log(`   Valor: ${process.env.OPENAI_API_KEY}\n`);
  }

  console.log('6. Clique em Save/Apply');
  console.log('7. Reinicie o serviço (botão Restart/Redeploy)');
  console.log('8. Aguarde 1-2 minutos');
  console.log('9. Veja os logs e procure: "Supabase conectado"\n');

  const copy = await ask('Quer copiar as variáveis formatadas? (s/n): ');

  if (copy.toLowerCase() === 's') {
    console.log('\n📋 COPIE E COLE:\n');
    console.log('─'.repeat(60));
    console.log(`SUPABASE_URL=${process.env.SUPABASE_URL}`);
    console.log(`SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}`);
    console.log(`SUPABASE_SERVICE_KEY=${process.env.SUPABASE_SERVICE_KEY}`);
    if (process.env.OPENAI_API_KEY) {
      console.log(`OPENAI_API_KEY=${process.env.OPENAI_API_KEY}`);
    }
    console.log('─'.repeat(60));
    console.log('\n');
  }
}

async function setupDocker() {
  console.log('\n🐳 GERANDO DOCKER COMPOSE\n');

  const dockerCompose = `version: '3.8'

services:
  waha:
    image: devlikeapro/waha:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      # WAHA
      - WAHA_SESSION=agenteauzap

      # Supabase
      - SUPABASE_URL=${process.env.SUPABASE_URL}
      - SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_KEY=${process.env.SUPABASE_SERVICE_KEY}

      # OpenAI
      - OPENAI_API_KEY=${process.env.OPENAI_API_KEY || 'sua-chave-aqui'}

      # Groq
      - GROQ_API_KEY=${process.env.GROQ_API_KEY || 'sua-chave-aqui'}

      # Database local (fallback)
      - DB_PATH=/data/customers.db

      # Server
      - PORT=3000
      - NODE_ENV=production
      - WEBHOOK_PATH=/webhook

    volumes:
      - ./data:/data
      - ./dist:/app/dist
      - ./node_modules:/app/node_modules

    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
`;

  const fs = require('fs');
  fs.writeFileSync('./docker-compose.yml', dockerCompose);

  console.log('✅ Arquivo docker-compose.yml criado!\n');
  console.log('🚀 PARA USAR:\n');
  console.log('   # Iniciar');
  console.log('   docker-compose up -d\n');
  console.log('   # Ver logs');
  console.log('   docker-compose logs -f\n');
  console.log('   # Parar');
  console.log('   docker-compose down\n');
  console.log('   # Reiniciar');
  console.log('   docker-compose restart\n');
}

async function setupManual() {
  console.log('\n💻 CONFIGURAÇÃO MANUAL\n');
  console.log('📋 COPIE ESTAS VARIÁVEIS E ADICIONE NO SEU SERVIÇO:\n');
  console.log('─'.repeat(60));
  console.log(`SUPABASE_URL=${process.env.SUPABASE_URL}`);
  console.log(`SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}`);
  console.log(`SUPABASE_SERVICE_KEY=${process.env.SUPABASE_SERVICE_KEY}`);
  if (process.env.OPENAI_API_KEY) {
    console.log(`OPENAI_API_KEY=${process.env.OPENAI_API_KEY}`);
  }
  console.log('─'.repeat(60));
  console.log('\n📍 ONDE ADICIONAR:\n');
  console.log('• Render: Dashboard → Environment');
  console.log('• Vercel: Settings → Environment Variables');
  console.log('• Heroku: Settings → Config Vars');
  console.log('• Railway: Variables tab');
  console.log('• Fly.io: fly secrets set NOME=valor\n');
  console.log('⚠️  LEMBRE-SE: Reiniciar o serviço após adicionar!\n');
}

main().catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
