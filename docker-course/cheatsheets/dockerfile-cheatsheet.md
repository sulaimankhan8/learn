# 📜 Dockerfile Directives Cheatsheet

| Directive | Description | Example |
|---|---|---|
| `FROM` | Sets base image for new build stage | `FROM node:20-alpine AS builder` |
| `WORKDIR` | Sets working directory for instructions that follow | `WORKDIR /usr/src/app` |
| `COPY` | Copies files from host into container image | `COPY --chown=node:node . .` |
| `ADD` | Copies files or extracts local tar archives | `ADD app.tar.gz /opt/` |
| `RUN` | Executes commands during image build | `RUN npm ci --omit=dev` |
| `CMD` | Default runtime command (overridable) | `CMD ["node", "src/server.js"]` |
| `ENTRYPOINT` | Fixed executable for container | `ENTRYPOINT ["/usr/bin/dumb-init", "--"]` |
| `ENV` | Sets runtime environment variables | `ENV NODE_ENV=production PORT=3000` |
| `ARG` | Sets build-time arguments (not in runtime) | `ARG BUILD_VERSION=1.0.0` |
| `EXPOSE` | Documents listening ports (metadata only) | `EXPOSE 3000` |
| `USER` | Sets unprivileged user UID/GID | `USER node` |
| `VOLUME` | Creates mount point with specified path | `VOLUME ["/data"]` |
| `HEALTHCHECK`| Configures active container health verification | `HEALTHCHECK --interval=30s CMD wget -q --spider http://localhost:3000/health \|\| exit 1` |
| `LABEL` | Adds metadata key-value pairs | `LABEL maintainer="devops@team.com"` |
| `SHELL` | Overrides default shell used for RUN commands | `SHELL ["/bin/bash", "-c"]` |
