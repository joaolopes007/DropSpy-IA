# Use official Node.js runtime as a parent image
FROM node:20-slim as builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application (Vite frontend + Esbuild server)
RUN npm run build

# Start a new stage for a smaller image
FROM node:20-slim

WORKDIR /app

# Copy package.json and lockfile
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the built files from the builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
