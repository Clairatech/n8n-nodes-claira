# Stage 1: Build the custom node package
FROM node:24-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Install n8n from npm (avoids pulling broken n8n Docker image)
# Node 24 is required by n8n's engines field, and isolated-vm only publishes
# prebuilt binaries from Node 24 onwards. On older Node it compiles from source.
FROM node:24-alpine

RUN apk add --no-cache tini su-exec

# Install n8n globally
RUN npm install -g n8n@latest

# Copy custom node (use existing node user from node:24-alpine)
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
