# 🚀 Quick Start - Dashboard Pet Shop

Comece a usar o dashboard em 3 passos simples!

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Backend API rodando em `http://localhost:3000`

## ⚡ Start em 3 Passos

### 1. Instalar Dependências

```bash
cd web
npm install
```

### 2. Configurar Ambiente

Crie o arquivo `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_COMPANY_ID=1
```

### 3. Iniciar o Servidor

```bash
npm run dev
```

Acesse: **http://localhost:3001**

## 🎉 Pronto!

Você verá o dashboard completo com:

- ✅ Visão geral de métricas
- ✅ Lista de agendamentos
- ✅ Gestão de serviços
- ✅ CRM de clientes
- ✅ Estatísticas em tempo real
- ✅ Gerador de QR Code

## 📱 Navegação

### Menu Lateral

1. **Dashboard** - Visão geral e métricas
2. **Agendamentos** - Gerenciar todos os agendamentos
3. **Serviços** - Ver catálogo de serviços
4. **Clientes** - CRM e histórico de clientes
5. **Estatísticas** - Análise de desempenho
6. **QR Code** - Gerar QR Code para WhatsApp
7. **Conversas** - (Em breve)
8. **Configurações** - Ajustes do sistema

## 🎯 Primeiros Passos

### Criar um Agendamento

1. Clique em **Agendamentos** no menu
2. Clique em **Novo Agendamento**
3. Preencha os dados:
   - Nome do tutor
   - Nome do pet
   - Porte do pet
   - Serviço desejado
   - Data e horário
4. Clique em **Criar Agendamento**

### Gerar QR Code

1. Clique em **QR Code** no menu
2. Configure o número do WhatsApp (formato: 5511999999999)
3. Personalize a mensagem inicial
4. Clique em **Baixar PNG**
5. Use o QR Code em materiais de divulgação

### Ver Estatísticas

1. Clique em **Estatísticas** no menu
2. Visualize:
   - Receita total e ticket médio
   - Taxa de conclusão e cancelamento
   - Serviços mais populares
   - Distribuição por status

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start

# Verificar tipos TypeScript
npm run type-check

# Lint
npm run lint
```

## ⚠️ Troubleshooting

### Erro: "Failed to fetch"

**Causa**: Backend não está rodando

**Solução**:
```bash
cd ..
npm run dev
```

### Erro: "Cannot connect to API"

**Causa**: URL da API incorreta

**Solução**: Verifique o `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Página em branco

**Causa**: Erro de compilação

**Solução**:
```bash
# Limpar cache
rm -rf .next
npm run dev
```

## 📚 Próximos Passos

- [ ] Explore todas as páginas do menu
- [ ] Crie alguns agendamentos de teste
- [ ] Configure o QR Code com seu número
- [ ] Personalize as configurações
- [ ] Consulte a documentação completa em `README.md`

## 💡 Dicas

1. **Filtros**: Use os filtros na página de agendamentos para encontrar rapidamente
2. **Busca**: A barra de busca do header funciona em tempo real
3. **Ações rápidas**: Clique nos 3 pontinhos (...) para ações em cada agendamento
4. **Responsivo**: O dashboard funciona em mobile, tablet e desktop

## 🎨 Personalização

### Mudar Porta

```bash
# next.config.js
npm run dev -- -p 3002
```

### Alterar Tema (em breve)

Tema escuro será implementado nas próximas versões.

---

**Tudo pronto!** 🚀

Se precisar de ajuda, consulte:
- `README.md` - Documentação completa
- `../API_DOCUMENTATION.md` - API endpoints
- `../DEPLOY_GUIDE.md` - Guia de deploy
