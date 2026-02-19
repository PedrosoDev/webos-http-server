# Build stage
FROM node:23-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

RUN ls
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
CMD ["npm", "start"]
