FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code
COPY . .

# Exposer le port
EXPOSE 5173

# Commande de développement (avec hot reload)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
