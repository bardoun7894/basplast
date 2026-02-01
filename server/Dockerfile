FROM node:18-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client inside container
RUN npx prisma generate

# Make startup script executable
RUN chmod +x start.sh

CMD ["./start.sh"]
