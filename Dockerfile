FROM node:18-alpine

# Author
LABEL maintainer="Ervin Tartaraj"
LABEL description="eProtokoll - Document Management System"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy project files
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Seed once during build
RUN node seed.js

# Start application
CMD ["npm", "start"]
