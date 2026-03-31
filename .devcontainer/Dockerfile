FROM mcr.microsoft.com/devcontainers/base:ubuntu

ENV NVM_DIR=/usr/local/share/nvm

# Install nvm, Node.js from .node-version, and enable corepack
COPY .node-version /tmp/.node-version
RUN mkdir -p "$NVM_DIR" \
    && curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash \
    && bash -c '. "$NVM_DIR/nvm.sh" && nvm install "$(cat /tmp/.node-version)" && nvm alias default "$(cat /tmp/.node-version)"' \
    && NODE_PATH="$(ls -d $NVM_DIR/versions/node/v*/bin | head -1)" \
    && echo "export PATH=$NODE_PATH:\$PATH" >> /etc/profile.d/node.sh \
    && ln -sf "$NODE_PATH/node" /usr/local/bin/node \
    && ln -sf "$NODE_PATH/npm" /usr/local/bin/npm \
    && ln -sf "$NODE_PATH/npx" /usr/local/bin/npx \
    && ln -sf "$NODE_PATH/corepack" /usr/local/bin/corepack \
    && rm /tmp/.node-version \
    && corepack enable

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*
