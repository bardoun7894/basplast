# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the application
# Note: VITE_ environment variables are baked in during build time.
# To pass them during build: docker build --build-arg VITE_KIE_API_KEY=your_key .
ARG VITE_KIE_API_KEY
ENV VITE_KIE_API_KEY=$VITE_KIE_API_KEY

RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration for SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
