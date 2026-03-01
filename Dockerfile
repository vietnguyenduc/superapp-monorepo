# Stage 1: Build the React application
FROM node:20-alpine as builder

WORKDIR /app

# Copy the minimum necessary files for npm install in a monorepo
COPY package.json package-lock.json ./
COPY apps/cashflow/package.json ./apps/cashflow/
COPY turbo.json .

# Define build arguments for Supabase environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set them as environment variables during the build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Install dependencies using npm ci for deterministic installs
RUN npm ci

# Copy the rest of the workspace
COPY . .

# Change directory into cashflow app and run the build script
# Vite will pick up the VITE_... environment variables
WORKDIR /app/apps/cashflow
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the built application from the builder stage
COPY --from=builder /app/apps/cashflow/dist /usr/share/nginx/html

# Copy our custom Nginx configuration which runs on port 8080
COPY apps/cashflow/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 for Google Cloud Run
EXPOSE 8080

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
