# Imagem base leve com Node.js
FROM node:20-slim

# Adiciona utilitários necessários
RUN apt-get update && apt-get install -y \
  curl \
  bash \
  postgresql-client \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho
WORKDIR /app

# Copia arquivos de dependência primeiro para otimizar cache
COPY package*.json ./

# Instala dependências (pode usar yarn ou npm)
RUN yarn install

# Copia o restante do projeto (código, prisma, etc.)
COPY . .

# Gera o cliente Prisma e compila TypeScript
RUN yarn prisma generate
RUN yarn build

# Expõe a porta usada pela aplicação
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "dist/index.js"]
