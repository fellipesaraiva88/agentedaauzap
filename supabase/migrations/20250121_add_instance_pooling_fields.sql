-- Adicionar campos para gerenciamento de pool de instâncias
ALTER TABLE instances
ADD COLUMN IF NOT EXISTS is_pooled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar índice para buscar instâncias disponíveis rapidamente
CREATE INDEX IF NOT EXISTS idx_instances_pool_available
ON instances(is_pooled, assigned_to_user_id)
WHERE is_pooled = true AND assigned_to_user_id IS NULL;

-- Criar índice para buscar instância de um usuário específico
CREATE INDEX IF NOT EXISTS idx_instances_assigned_user
ON instances(assigned_to_user_id)
WHERE assigned_to_user_id IS NOT NULL;

COMMENT ON COLUMN instances.is_pooled IS 'Indica se a instância faz parte do pool gerenciado automaticamente';
COMMENT ON COLUMN instances.assigned_to_user_id IS 'ID do usuário que está usando esta instância (NULL = disponível no pool)';
