# Stage 1: Build the custom node package
FROM node:22-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Install n8n from npm (avoids pulling broken n8n Docker image)
FROM node:22-alpine

RUN apk add --no-cache tini su-exec

# Install n8n globally
RUN npm install -g n8n@latest

# Copy custom node (use existing node user from node:22-alpine)
RUN mkdir -p /home/node/.n8n/custom/@claira/n8n-nodes-claira
COPY --from=builder /build/dist /home/node/.n8n/custom/@claira/n8n-nodes-claira/dist
COPY --from=builder /build/package.json /home/node/.n8n/custom/@claira/n8n-nodes-claira/

RUN chown -R node:node /home/node/.n8n

USER node
WORKDIR /home/node

ENV N8N_CUSTOM_EXTENSIONS="/home/node/.n8n/custom"

EXPOSE 5678

ENTRYPOINT ["tini", "--"]
CMD ["n8n", "start"]
