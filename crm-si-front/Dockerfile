# syntax=docker/dockerfile:1

# Use Node.js LTS as the base image
FROM node:20-alpine AS base

# Enable corepack and set pnpm version
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Set working directory
WORKDIR /app

# Set pnpm environment
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Copy package files first for caching
COPY package.json ./

# Install dependencies (pnpm usará la ubicación por defecto)
RUN --mount=type=cache,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --no-frozen-lockfile

# Copy the rest of the application files
COPY . .

# Expose port 3000 for development
EXPOSE 3000

# Run the development server
CMD ["pnpm", "run", "dev"]