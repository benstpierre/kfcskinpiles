FROM node:22-bookworm-slim
USER root
RUN apt-get update && apt-get install -y --no-install-recommends bash ca-certificates curl git \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g @openai/codex@0.153.4 \
    && groupmod -n sandbox node \
    && usermod -l sandbox -d /sandbox node \
    && mkdir -p /sandbox/project /sandbox/.codex /sandbox/.npm /sandbox/.cache \
    && chown -R sandbox:sandbox /sandbox
ENV HOME=/sandbox CODEX_HOME=/sandbox/.codex
WORKDIR /sandbox/project
USER sandbox
CMD ["/bin/bash"]
