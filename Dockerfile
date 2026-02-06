# Stage 1: Build the custom node package
FROM node:20-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Install n8n from npm (avoids pulling broken n8n Docker image)
FROM node:20-alpine

RUN apk add --no-cache tini su-exec

# Install n8n globally
RUN npm install -g n8n@latest

# Create node user
RUN addgroup -g 1000 node-user && adduser -u 1000 -G node-user -s /bin/sh -D node-user

# Copy custom node
RUN mkdir -p /home/node-user/.n8n/custom
COPY --from=builder /build/dist /home/node-user/.n8n/custom/@claira/n8n-nodes-claira/dist
COPY --from=builder /build/package.json /home/node-user/.n8n/custom/@claira/n8n-nodes-claira/

RUN chown -R node-user:node-user /home/node-user/.n8n

USER node-user
WORKDIR /home/node-user

ENV N8N_CUSTOM_EXTENSIONS="/home/node-user/.n8n/custom"

EXPOSE 5678

ENTRYPOINT ["tini", "--"]
CMD ["n8n", "start"]
