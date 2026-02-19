# Build stage
FROM node:23-alpine AS builder

WORKDIR /app

# Instalar dependências de build para pacotes nativos
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências (incluindo dev para build)
RUN npm ci

# Copiar código fonte
COPY src ./src

# Compilar TypeScript
RUN npm run build

# Production stage
FROM node:23-alpine

WORKDIR /app

# Copiar código compilado do builder
COPY --from=builder /app/ .

# Criar diretório data para persistência e ajustar permissões
RUN mkdir -p /app/data && chown -R node:node /app

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
  PORT=3000 \
  HOST=0.0.0.0

# Expor porta
EXPOSE 3000

# Usuário não-root para segurança
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/tv', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
CMD ["npm", "start"]
