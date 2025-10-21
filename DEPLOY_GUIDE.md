# 🚀 Guia de Deploy - Sistema de Agendamentos

## 📋 Pré-requisitos

- [ ] Node.js 18+ instalado
- [ ] PostgreSQL 14+ configurado
- [ ] Redis 7+ (opcional, para cache)
- [ ] WAHA rodando (WhatsApp API)
- [ ] OpenAI API key
- [ ] Variáveis de ambiente configuradas

---

## 🔧 Configuração do Ambiente

### 1. Variáveis de Ambiente (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis (opcional)
REDIS_URL=redis://host:6379

# OpenAI
OPENAI_API_KEY=sk-...

# WAHA (WhatsApp)
WAHA_URL=http://localhost:3000
WAHA_SESSION=default

# Aplicação
PORT=3000
NODE_ENV=production
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Executar Migrations

```bash
# Verificar migrations pendentes
npm run migrate

# Ou executar migration específica
npm run migrate:005
```

### 4. Validar Schema

```bash
npm run validate:schema
```

---

## 🧪 Testes

### Executar Teste de Integração

```bash
npm run test:appointments
```

Deve retornar:
```
✅ TODOS OS TESTES PASSARAM!
```

---

## 🏗️ Build para Produção

```bash
npm run build
```

Isso irá:
1. Compilar TypeScript → JavaScript (dist/)
2. Copiar arquivos SQL para dist/database/
3. Gerar sourcemaps

---

## 🚀 Deploy

### Opção 1: Render (Recomendado)

1. **Criar Novo Web Service**
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

2. **Configurar Variáveis**
   - Adicionar todas as variáveis do .env
   - Usar DATABASE_URL do PostgreSQL do Render

3. **Deploy**
   ```bash
   git push origin main
   ```

### Opção 2: VPS (DigitalOcean, AWS, etc)

1. **SSH no servidor**
   ```bash
   ssh user@your-server
   ```

2. **Clonar repositório**
   ```bash
   git clone https://github.com/seu-repo/agentedaauzap.git
   cd agentedaauzap
   ```

3. **Instalar dependências**
   ```bash
   npm install
   ```

4. **Configurar .env**
   ```bash
   cp .env.example .env
   nano .env
   # Preencher variáveis
   ```

5. **Executar migrations**
   ```bash
   npm run migrate
   ```

6. **Build**
   ```bash
   npm run build
   ```

7. **Iniciar com PM2**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name "agente-petshop"
   pm2 save
   pm2 startup
   ```

---

## ⏰ Configurar Cron Jobs

### 1. Processar Lembretes (a cada 5 min)

```bash
crontab -e
```

Adicionar:
```
*/5 * * * * cd /path/to/agentedaauzap && npm run cron:reminders >> /var/log/reminders.log 2>&1
```

### 2. Verificar Logs

```bash
tail -f /var/log/reminders.log
```

---

## 🔍 Monitoramento

### 1. Health Check

Criar endpoint de health:
```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-10-21T00:00:00Z"
}
```

### 2. Logs Estruturados

```bash
# Logs da aplicação
pm2 logs agente-petshop

# Logs de lembretes
tail -f /var/log/reminders.log

# Logs do banco
tail -f /var/log/postgresql/postgresql-14-main.log
```

### 3. Métricas

```bash
# Estatísticas de agendamentos
psql $DATABASE_URL -c "SELECT * FROM stats_agendamentos_empresa;"

# Estatísticas de lembretes
npm run cron:reminders
```

---

## 🔐 Segurança

### 1. Firewall

```bash
# Permitir apenas portas necessárias
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### 2. SSL/TLS

Usar Certbot para HTTPS:
```bash
sudo apt install certbot
sudo certbot --nginx -d seu-dominio.com
```

### 3. Secrets

- ❌ NUNCA commitar .env
- ✅ Usar variáveis de ambiente do servidor
- ✅ Rotacionar API keys regularmente

---

## 🐛 Troubleshooting

### Problema: Migration falha

**Solução:**
```bash
# Verificar conexão com banco
psql $DATABASE_URL -c "SELECT 1;"

# Verificar migrations executadas
psql $DATABASE_URL -c "SELECT * FROM migrations;"

# Re-executar migration
npm run migrate:force
```

### Problema: Lembretes não enviando

**Solução:**
```bash
# Verificar cron job está rodando
crontab -l

# Testar manualmente
npm run cron:reminders

# Verificar logs
tail -f /var/log/reminders.log
```

### Problema: Alta latência

**Solução:**
```bash
# Verificar índices do banco
psql $DATABASE_URL -c "\di"

# Otimizar queries lentas
psql $DATABASE_URL -c "
  SELECT query, mean_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Limpar cache
npm run cache:clear
```

---

## 📊 Métricas de Sucesso

### KPIs Importantes

1. **Taxa de Conversão**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status IN ('confirmado', 'concluido')) * 100.0 / COUNT(*) as taxa_conversao
   FROM appointments
   WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
   ```

2. **Taxa de No-Show**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'nao_compareceu') * 100.0 /
     COUNT(*) FILTER (WHERE status IN ('confirmado', 'concluido', 'nao_compareceu')) as no_show_rate
   FROM appointments
   WHERE data_agendamento >= CURRENT_DATE - INTERVAL '30 days';
   ```

3. **Efetividade de Lembretes**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE responded = TRUE) * 100.0 / COUNT(*) as response_rate,
     COUNT(*) FILTER (WHERE confirmed_presence = TRUE) * 100.0 /
     COUNT(*) FILTER (WHERE responded = TRUE) as confirmation_rate
   FROM appointment_reminders_v2
   WHERE sent = TRUE
     AND sent_at >= CURRENT_DATE - INTERVAL '7 days';
   ```

---

## ✅ Checklist de Deploy

### Pré-Deploy
- [ ] Testes passando
- [ ] Migrations testadas
- [ ] .env configurado
- [ ] Secrets verificados
- [ ] Backup do banco

### Deploy
- [ ] Build executado
- [ ] Migrations aplicadas
- [ ] Serviço iniciado
- [ ] Health check OK
- [ ] Cron jobs configurados

### Pós-Deploy
- [ ] Monitoramento ativo
- [ ] Logs sendo gerados
- [ ] Métricas coletadas
- [ ] Alertas configurados
- [ ] Documentação atualizada

---

## 🆘 Suporte

### Rollback Rápido

```bash
# Parar aplicação
pm2 stop agente-petshop

# Reverter código
git reset --hard HEAD~1

# Rebuild
npm run build

# Reiniciar
pm2 restart agente-petshop
```

### Backup de Emergência

```bash
# Backup do banco
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar
psql $DATABASE_URL < backup_20251021_000000.sql
```

---

**Última atualização:** 2025-10-21
**Versão:** 1.0.0
