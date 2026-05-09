# Use Node.js LTS image
FROM node:20

# Install FFmpeg and Python (required for yt-dlp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && pip3 install --no-cache-dir -U yt-dlp \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy server package.json and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy client package.json and install dependencies
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy the rest of the application
COPY . .

# Build the frontend
RUN cd client && npm run build

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["node", "server/index.js"]
