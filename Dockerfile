# Use official Node.js 18+ image as base image with better security
FROM node:24-alpine

# Create and set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml first to leverage Docker cache
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN apk add --no-cache curl \
    && curl -fsSL https://get.pnpm.io/install.sh | sh - \
    && pnpm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client and run migrations
RUN npx prisma generate \
    && npx prisma migrate deploy

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "start"]
