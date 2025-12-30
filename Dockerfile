# 1. Base Image: Start with a lightweight slice of Linux + Node 18
FROM node:22-alpine

# 2. Working Directory: Create a folder inside the container
WORKDIR /app

# 3. Dependencies: Copy ONLY the package deifinition first
# This allows Docker to cache the "npm install" step if the package.json has not changed
COPY package*.json ./

# 4. Copy Prisma Schema (CRITICAL STEP as npm install can find the schema)
COPY prisma ./prisma/

# 5. Install Dependencies
RUN npm install

# 6. Source Code: Copy the rest of your app code
COPY . .

# 7. Prisma: Generate the client for Linux Container Environment
RUN npx prisma generate

# 8. Port: Document that the container listens on port 3000
EXPOSE 3000

# 9. Command: Start the app
CMD ["npm", "run", "dev"]

