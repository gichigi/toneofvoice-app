FROM node:22-bookworm

# Keep native modules stable and Chromium runtime compatible in cloud agents.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    pkg-config \
    git \
    ca-certificates \
    libvips-dev \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxshmfence1 \
    fonts-liberation \
    chromium \
  && rm -rf /var/lib/apt/lists/*

# Pin pnpm major version for repeatable cloud-agent installs.
RUN corepack enable && corepack prepare pnpm@10 --activate
