#!/usr/bin/env node

/**
 * 🚀 CONFIGURAÇÃO AUTOMÁTICA RENDER
 * Configura Supabase no Render via API
 */

require('dotenv').config();

const SERVICE_ID = 'srv-d3nv898dl3ps73dmr180'; // Extraído da URL

async function configureRender() {
  console.log('\n🚀 CONFIGURAÇÃO AUTOMÁTICA DO RENDER\n');

  // Verifica credenciais locais
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERRO: Credenciais Supabase não encontradas no .env');
    process.exit(1);
  }

  console.log('✅ Credenciais encontradas:\n');
  console.log(`   Service ID: ${SERVICE_ID}`);
  console.log(`   SUPABASE_URL: ${supabaseUrl}`);
  console.log(`   SUPABASE_ANON_KEY: ${supabaseAnonKey?.substring(0, 20)}...`);
  console.log(`   SUPABASE_SERVICE_KEY: ${supabaseServiceKey?.substring(0, 20)}...`);
  if (openaiKey) {
    console.log(`   OPENAI_API_KEY: ${openaiKey?.substring(0, 20)}...`);
  }

  // Lê API Key do Render
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (question) => new Promise(resolve => {
    rl.question(question, answer => resolve(answer));
  });

  console.log('\n📋 VOCÊ PRECISA DA RENDER API KEY:\n');
  console.log('1. Acesse: https://dashboard.render.com/account/settings');
  console.log('2. Em "API Keys", clique em "Create API Key"');
  console.log('3. Copie a key\n');

  const renderApiKey = await ask('Cole sua Render API Key aqui: ');

  if (!renderApiKey || renderApiKey.trim() === '') {
    console.log('\n❌ API Key necessária. Execute novamente quando tiver a key.');
    process.exit(1);
  }

  rl.close();

  console.log('\n📡 Configurando variáveis no Render...\n');

  // Variáveis para configurar
  const envVars = [
    { key: 'SUPABASE_URL', value: supabaseUrl },
    { key: 'SUPABASE_ANON_KEY', value: supabaseAnonKey },
    { key: 'SUPABASE_SERVICE_KEY', value: supabaseServiceKey }
  ];

  if (openaiKey && openaiKey !== 'sk-proj-your-key-here') {
    envVars.push({ key: 'OPENAI_API_KEY', value: openaiKey });
  }

  try {
    // Importa fetch dinamicamente
    const fetch = (await import('node-fetch')).default;

    // Busca variáveis existentes primeiro
    console.log('   🔍 Buscando variáveis existentes...\n');

    const getResponse = await fetch(
      `https://api.render.com/v1/services/${SERVICE_ID}/env-vars`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${renderApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!getResponse.ok) {
      const error = await getResponse.text();
      console.error(`❌ Erro ao buscar variáveis: ${error}`);
      console.log('\n💡 Verifique:');
      console.log('   - API Key está correta?');
      console.log('   - Service ID está correto?');
      console.log(`   - Acesse: https://dashboard.render.com/web/${SERVICE_ID}`);
      process.exit(1);
    }

    const existingVars = await getResponse.json();
    console.log(`   ✅ ${existingVars.length} variáveis existentes encontradas\n`);

    // Prepara lista completa de variáveis (mantém existentes + adiciona novas)
    const allVars = [...existingVars];

    // Atualiza ou adiciona novas variáveis
    for (const envVar of envVars) {
      const existingIndex = allVars.findIndex(v => v.key === envVar.key);

      if (existingIndex >= 0) {
        console.log(`   🔄 Atualizando ${envVar.key}...`);
        allVars[existingIndex].value = envVar.value;
      } else {
        console.log(`   ➕ Adicionando ${envVar.key}...`);
        allVars.push(envVar);
      }
    }

    // Envia todas as variáveis de uma vez
    console.log('\n   📤 Enviando configurações...\n');

    const putResponse = await fetch(
      `https://api.render.com/v1/services/${SERVICE_ID}/env-vars`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${renderApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(allVars)
      }
    );

    if (putResponse.ok) {
      console.log('✅ VARIÁVEIS CONFIGURADAS COM SUCESSO!\n');
      console.log('🔄 PRÓXIMOS PASSOS:\n');
      console.log('1. ✅ Render vai fazer deploy automático');
      console.log('2. ⏱️  Aguarde 2-3 minutos');
      console.log('3. 📊 Veja os logs em:');
      console.log(`   https://dashboard.render.com/web/${SERVICE_ID}/logs\n`);
      console.log('4. 🔍 Procure por:');
      console.log('   "📊 CustomerMemoryDB inicializado: SUPABASE (PostgreSQL)"');
      console.log('   "✅ Supabase conectado com sucesso"\n');
      console.log('Se ver essas mensagens, está FUNCIONANDO! 🎉\n');
    } else {
      const error = await putResponse.text();
      console.error(`❌ Erro ao configurar: ${error}\n`);
      console.log('💡 Alternativa: Configure manualmente em:');
      console.log(`   https://dashboard.render.com/web/${SERVICE_ID}/env\n`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Configure manualmente:');
    console.log(`1. Acesse: https://dashboard.render.com/web/${SERVICE_ID}/env`);
    console.log('2. Adicione as variáveis:');
    envVars.forEach(v => {
      console.log(`   ${v.key}=${v.value}`);
    });
    console.log('3. Clique em "Save Changes"');
    console.log('4. Render vai fazer redeploy automático\n');
  }
}

configureRender().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
