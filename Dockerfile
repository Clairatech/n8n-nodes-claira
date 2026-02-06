# Stage 1: Build the node package from source
FROM node:20-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Copy built package into n8n image
FROM n8nio/n8n:latest

USER root
RUN mkdir -p /opt/custom-nodes/@claira/n8n-nodes-claira
COPY --from=builder /build/dist /opt/custom-nodes/@claira/n8n-nodes-claira/dist
COPY --from=builder /build/package.json /opt/custom-nodes/@claira/n8n-nodes-claira/
RUN chown -R node:node /opt/custom-nodes
USER node

ENV N8N_CUSTOM_EXTENSIONS="/opt/custom-nodes/@claira/n8n-nodes-claira"

EXPOSE 5678

ENTRYPOINT ["tini", "--", "/docker-entrypoint.sh"]
