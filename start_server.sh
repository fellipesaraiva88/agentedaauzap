#!/bin/bash

# Kill any existing server
ps aux | grep "ts-node src/index.ts" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null

# Start server
cd /Users/saraiva/agentedaauzap
npm run dev
