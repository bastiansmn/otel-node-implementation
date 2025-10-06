# ---- Builder stage: install production dependencies ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copier seulement les fichiers package pour tirer parti du cache Docker
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# Copier le reste de l'application
COPY . .

# ---- Final stage: runtime minimal ----
FROM node:20-alpine AS runner
WORKDIR /app

# Créer un utilisateur non-root (optionnel mais recommandé)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copier les node_modules et le code depuis le builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Si ton app écoute une autre variable, ajuste-la ci-dessous
EXPOSE 3000

# Utilisateur non root
USER appuser

# Commande de démarrage (modifie si tu démarres avec npm run start)
CMD ["node", "main.js"]
