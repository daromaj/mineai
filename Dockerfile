# Use Node.js 20 as the base image
FROM node:20-slim

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Create a non-root user
RUN groupadd -r mineai && useradd -r -g mineai mineai

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source
COPY . .

# Change ownership of the app directory to the non-root user
RUN chown -R mineai:mineai /usr/src/app

# Switch to non-root user
USER mineai

# Set production environment
ENV NODE_ENV=production

# The web port for the application
ENV WEB_PORT=3000

# Minecraft connection settings
ENV HOST=host.docker.internal
ENV PORT=25565
ENV USERNAME=aibot

# AI API settings
ENV GROQ_API_KEY=""
ENV OPENROUTER_API_KEY=""
ENV GROQ_MODEL=llama-3.2-90b-text-preview
ENV CEREBRAS_API_KEY=""

# Expose the port your app runs on
EXPOSE ${WEB_PORT}

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${WEB_PORT} || exit 1

# Command to run the application
CMD [ "npm", "start" ]
