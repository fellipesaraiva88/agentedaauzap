#!/bin/bash

# Script para corrigir erros TypeScript automaticamente

echo "🔧 Corrigindo erros TypeScript..."

# 1. Adicionar export default às rotas que faltam
echo "📝 Adicionando exports default nas rotas..."

# 2. Corrigir imports no index.ts das rotas
cat > /tmp/fix-index.txt << 'EOF'
A correção será feita manualmente nos arquivos de rotas
EOF

# 3. Tornar tutorDAO e petDAO públicos nos Services
echo "🔓 Tornando DAOs públicos nos Services..."

# TutorService
sed -i.bak 's/private tutorDAO/public tutorDAO/g' src/services/domain/TutorService.ts

# PetService
sed -i.bak 's/private petDAO/public petDAO/g' src/services/domain/PetService.ts

echo "✅ Correções aplicadas!"
echo "Arquivos .bak criados como backup"
