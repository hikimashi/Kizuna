# Use the official Node.js 20 Alpine image as the base
FROM node:20-alpine

# Build arguments for environment variables
ARG ANILIST_CLIENT_ID
ARG ANILIST_CLIENT_SECRET
ARG ANILIST_REDIRECT_URI
ARG POCKETBASE_URL

# Set environment variables from build args
ENV ANILIST_CLIENT_ID=$ANILIST_CLIENT_ID
ENV ANILIST_CLIENT_SECRET=$ANILIST_CLIENT_SECRET
ENV ANILIST_REDIRECT_URI=$ANILIST_REDIRECT_URI
ENV POCKETBASE_URL=$POCKETBASE_URL

# Set the working directory inside the container
WORKDIR /app

# Copy package files (package.json and package-lock.json if present)
COPY package*.json ./

# Install production dependencies only (smaller image, faster build)
RUN npm ci

# Copy the entire application source code into the container
COPY . .

# Build the Nuxt application (generates the .output/ directory)
# This step must run inside the container to ensure OS compatibility
RUN npm run build

# Expose port 3000 (default Nitro server port)
EXPOSE 3000

# Start the Nuxt SSR server using the generated Nitro output
CMD ["node", ".output/server/index.mjs"]