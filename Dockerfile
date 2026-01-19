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

# Start application
CMD ["npm", "run", "dev"]
