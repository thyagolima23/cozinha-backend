#!/bin/sh

# Verificar se o diretório dist existe e rodar build se necessário
if [ ! -d "dist" ]; then
  echo "dist directory not found. Running TypeScript build..."
  npm run build
fi

# Garantir permissões adequadas para a pasta dist
chmod -R 755 dist

echo "Running Prisma generate..."
npx prisma generate

echo "Running Prisma migrate deploy..."
npx prisma migrate deploy

echo "Running Prisma db seed..."
npx prisma db seed

echo "Starting server..."
exec node dist/index.js
