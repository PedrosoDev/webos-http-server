# Build stage
FROM node:23-alpine AS builder

WORKDIR /app

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

# Copiar package files
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && \
  npm cache clean --force

# Copiar código compilado do builder
COPY --from=builder /app/dist ./dist

# Criar diretório data para persistência
RUN mkdir -p /app/data

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
CMD ["node", "dist/server.js"]
