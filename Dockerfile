# Stage 1: Install the node package
FROM node:20-alpine AS builder
WORKDIR /build
RUN npm init -y && npm install @claira/n8n-nodes-claira

# Stage 2: Copy only Claira package into n8n image
FROM n8nio/n8n:2.3.0

USER root
RUN mkdir -p /opt/custom-nodes
COPY --from=builder /build/node_modules/@claira /opt/custom-nodes/@claira
RUN chown -R node:node /opt/custom-nodes
USER node

ENV N8N_CUSTOM_EXTENSIONS="/opt/custom-nodes/@claira/n8n-nodes-claira"

EXPOSE 5678
