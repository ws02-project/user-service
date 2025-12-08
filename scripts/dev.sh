#!/bin/bash

# Development script for user-service
# Usage: ./scripts/dev.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting User Service Development Environment...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if proto directory exists
if [ ! -d "../proto" ]; then
    echo -e "${YELLOW}Proto directory not found. Creating symlink...${NC}"
    if [ -d "../../proto" ]; then
        ln -sf ../../proto ../proto
    else
        echo -e "${RED}Proto repository not found. Please clone it first.${NC}"
        exit 1
    fi
fi

# Start services
echo -e "${GREEN}Starting Docker containers...${NC}"
docker-compose up --build

echo -e "${GREEN}Development environment started!${NC}"
echo -e "HTTP API: http://localhost:3002/api/v1"
echo -e "gRPC: localhost:50053"
echo -e "RabbitMQ Management: http://localhost:15674"

