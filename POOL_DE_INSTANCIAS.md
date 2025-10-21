# 🎯 Sistema de Pool de Instâncias WAHA

## Objetivo

Simplificar a experiência do usuário: **ele apenas conecta o WhatsApp**, sem saber nada sobre "instâncias". Todo o gerenciamento é automático e invisível.

## Como Funciona

### 1. **Pool Pré-configurado**
- Ao iniciar o servidor, **10 instâncias WAHA são criadas automaticamente**
- Ficam em standby esperando usuários se conectarem
- Quando o pool fica com menos de 5 disponíveis, **cria mais 10 automaticamente**

### 2. **Para o Usuário**
O fluxo é extremamente simples:

```
Usuário acessa → Clica em "Conectar WhatsApp" → Escaneia QR Code → Pronto!
```

**O usuário nunca vê:**
- Criação de instância
- Configuração de servidor WAHA
- Gerenciamento de sessões

### 3. **Por Trás dos Panos**

```mermaid
sequenceDiagram
    Usuario->>API: POST /api/whatsapp/connect
    API->>InstancePoolManager: getAvailableInstance()
    InstancePoolManager->>Database: SELECT instância livre
    Database-->>InstancePoolManager: instância_123
    InstancePoolManager->>Database: UPDATE assigned_to_user_id
    API->>WAHA: Gerar QR Code
    WAHA-->>API: QR Code
    API-->>Usuario: Mostra QR Code
```

## Arquivos Criados/Modificados

### ✅ Novos Arquivos

1. **`src/services/InstancePoolManager.ts`**
   - Gerencia pool de instâncias
   - Métodos principais:
     - `ensurePoolSize(10)` - Garante 10 instâncias disponíveis
     - `getAvailableInstance()` - Pega instância livre
     - `assignToUser(instanceId, userId)` - Atribui ao usuário
     - `releaseInstance(userId)` - Devolve ao pool
     - `getUserInstance(userId)` - Busca instância do usuário

2. **`supabase/migrations/20250121_add_instance_pooling_fields.sql`**
   - Adiciona campos na tabela `instances`:
     - `is_pooled BOOLEAN` - Se faz parte do pool
     - `assigned_to_user_id UUID` - Qual usuário está usando (NULL = disponível)
   - Cria índices para busca rápida

### 📝 Arquivos Modificados

1. **`src/index.ts`**
   - Importa `InstancePoolManager`
   - No startup: chama `ensurePoolSize(10)` após migrations
   - No webhook: libera instância quando desconectar

2. **`src/api/whatsapp-routes.ts`**
   - Adiciona 3 novos endpoints simplificados:
     - `POST /api/whatsapp/connect` - Conectar WhatsApp (automático)
     - `POST /api/whatsapp/disconnect` - Desconectar
     - `GET /api/whatsapp/my-connection` - Status da conexão

3. **`src/api/ai-routes.ts`**
   - Corrigido imports (apiAuth → auth)

4. **`src/api/index.ts`**
   - Corrigido chamada de `createConversationsRoutes(db)`

## Novos Endpoints da API

### 🔗 POST `/api/whatsapp/connect`
Conecta o WhatsApp do usuário automaticamente.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Sucesso):**
```json
{
  "success": true,
  "method": "qr",
  "qrCode": "data:image/png;base64,...",
  "instanceName": "pool-1737485234-1",
  "message": "Escaneie o QR Code com seu WhatsApp"
}
```

**Response (Pool vazio):**
```json
{
  "error": "Não há instâncias disponíveis no momento",
  "message": "Tente novamente em alguns segundos. Estamos criando mais instâncias."
}
```

### 🔌 POST `/api/whatsapp/disconnect`
Desconecta e devolve instância ao pool.

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp desconectado com sucesso"
}
```

### 📊 GET `/api/whatsapp/my-connection`
Verifica status da conexão.

**Response (Conectado):**
```json
{
  "success": true,
  "connected": true,
  "instanceName": "pool-1737485234-1",
  "status": "WORKING",
  "phoneNumber": "5511999999999@c.us"
}
```

**Response (Não conectado):**
```json
{
  "success": true,
  "connected": false,
  "message": "WhatsApp não conectado"
}
```

## Fluxos de Uso

### Fluxo 1: Primeiro Acesso

```
1. Usuário faz login → userId gerado
2. Clica em "Conectar WhatsApp"
3. Frontend chama POST /api/whatsapp/connect
4. Backend:
   - Verifica se já tem instância (não tem)
   - Pega instância disponível do pool
   - Atribui ao userId
   - Gera QR Code
5. Usuário escaneia QR
6. WAHA envia webhook confirmando conexão
7. Frontend mostra "✅ Conectado"
```

### Fluxo 2: Desconexão Automática

```
1. WhatsApp desconecta (celular sem internet, logout, etc)
2. WAHA envia webhook: event="status.instance", status="disconnected"
3. Backend detecta no webhook
4. Busca qual userId estava usando aquela instância
5. Libera instância: assigned_to_user_id = NULL
6. Instância volta pro pool
7. Se pool < 5, cria mais 10 automaticamente
```

### Fluxo 3: Reconexão

```
1. Usuário clica "Conectar WhatsApp" novamente
2. POST /api/whatsapp/connect
3. Backend detecta que userId já tem instância atribuída
4. Gera novo QR Code da mesma instância
5. Usuário escaneia e reconecta
```

## Webhook WAHA

O webhook precisa estar configurado no WAHA apontando para:

```
POST http://seu-servidor.com/webhook
```

**Eventos processados:**

1. **`status.instance`** - Mudanças de status da instância
   - Quando `payload.status === 'disconnected'` → libera do pool

2. **`message`** - Mensagens recebidas (já existia)

## Vantagens do Sistema

✅ **Transparente**: Usuário não sabe de nada técnico
✅ **Escalável**: Cria mais instâncias automaticamente
✅ **Eficiente**: Reutiliza instâncias quando usuário desconecta
✅ **Robusto**: Pool sempre mantém mínimo de 10 disponíveis
✅ **Zero configuração**: Tudo automático no startup

## Variáveis de Ambiente

Certifique-se de ter configuradas:

```bash
# PostgreSQL
DATABASE_URL=postgres://user:pass@host:port/database?sslmode=disable

# WAHA
WAHA_URL=https://waha.devlike.pro
WAHA_API_KEY=sua-api-key
```

## Próximos Passos

### 1. Aplicar Migration no Banco de Dados

```bash
# Aplicar manualmente via psql ou seu gerenciador:
psql $DATABASE_URL < supabase/migrations/20250121_add_instance_pooling_fields.sql
```

### 2. Deploy e Teste

```bash
# Build
npm run build

# Rodar
npm start

# Deve aparecer nos logs:
# 🔄 Inicializando pool de instâncias WAHA...
# [InstancePool] Verificando pool... (target: 10 disponíveis)
# [InstancePool] 🔄 Criando 10 instâncias...
# [InstancePool] Criadas: 10/10 (0 falhas)
# ✅ Pool de instâncias WAHA pronto!
```

### 3. Testar Endpoints

```bash
# 1. Fazer login e pegar token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"feee@saraiva.ai","password":"Sucesso2025$"}'

# 2. Conectar WhatsApp
curl -X POST http://localhost:3000/api/whatsapp/connect \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 3. Verificar status
curl http://localhost:3000/api/whatsapp/my-connection \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 4. Integração Frontend

No frontend (React/Next.js), crie um componente simples:

```tsx
function WhatsAppConnector() {
  const [qrCode, setQrCode] = useState(null);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    const response = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      setQrCode(data.qrCode);
    }
  };

  return (
    <div>
      {!connected ? (
        <div>
          <button onClick={handleConnect}>Conectar WhatsApp</button>
          {qrCode && <img src={qrCode} alt="QR Code" />}
        </div>
      ) : (
        <div>✅ WhatsApp Conectado</div>
      )}
    </div>
  );
}
```

## Monitoramento

Para ver o status do pool:

```sql
-- Estatísticas do pool
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE assigned_to_user_id IS NULL) as disponiveis,
  COUNT(*) FILTER (WHERE assigned_to_user_id IS NOT NULL) as em_uso
FROM instances
WHERE is_pooled = true;

-- Ver quem está usando cada instância
SELECT
  i.name,
  i.status,
  i.assigned_to_user_id,
  u.email
FROM instances i
LEFT JOIN users u ON i.assigned_to_user_id = u.id
WHERE i.is_pooled = true
ORDER BY i.name;
```

## Troubleshooting

### Pool não cria instâncias no startup

**Verificar logs:**
```
[InstancePool] Erro ao criar pool-xxx: <erro>
```

**Possíveis causas:**
- WAHA_URL ou WAHA_API_KEY incorretos
- WAHA fora do ar
- Tabela `instances` sem os novos campos

**Solução:**
```bash
# Testar WAHA manualmente
curl -X POST https://waha.devlike.pro/api/sessions/start \
  -H "X-Api-Key: SUA_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"teste-manual"}'
```

### Usuário não consegue conectar

**Erro:** "Não há instâncias disponíveis"

**Verificar:**
```sql
SELECT COUNT(*) FROM instances
WHERE is_pooled = true AND assigned_to_user_id IS NULL;
```

Se retornar 0, criar manualmente ou reiniciar servidor.

### Instância não volta pro pool após desconectar

**Verificar:**
1. Webhook do WAHA está configurado?
2. Logs do webhook mostram `status.instance` event?

**Solução manual:**
```sql
-- Liberar instância manualmente
UPDATE instances
SET assigned_to_user_id = NULL, status = 'disconnected'
WHERE name = 'nome-da-instancia';
```

---

## Conclusão

Sistema de pool implementado com sucesso! 🎉

O usuário agora tem uma experiência **simples e direta**:
- Clica → Escaneia → Usa

Todo gerenciamento complexo de instâncias é invisível e automático.
