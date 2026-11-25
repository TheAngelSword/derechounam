FROM node:24-alpine
WORKDIR /app
COPY token.mjs server.mjs ./
# Runs as the image's unprivileged "node" user; only /data is writable.
USER node
ENV ARCHIVOS_DATA=/data PORT=8795
EXPOSE 8795
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8795/health || exit 1
CMD ["node", "server.mjs"]
