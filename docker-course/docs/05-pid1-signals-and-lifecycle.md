# ⚙️ Deep Dive: PID 1, Linux Signals, Graceful Shutdown & Healthchecks

## 1. The PID 1 Problem in Containers

In Linux, the process with **PID 1** (typically `systemd` or `init` on regular OS) has two unique responsibilities:
1. **Reaping Zombie Processes**: Adopting and cleaning up orphaned child processes when their parent terminates.
2. **Default Signal Handling**: Standard Linux processes terminate upon receiving `SIGTERM` (15) or `SIGINT` (2). However, the Linux kernel treats PID 1 specially: **it ignores default signal actions**. If PID 1 has not explicitly registered a signal handler, the kernel will NOT terminate it.

```text
Host / Orchestrator issues 'docker stop'
                      │
                      ▼ (Sends SIGTERM to Container PID 1)
        ┌───────────────────────────┐
        │ Container PID 1           │
        └─────────────┬─────────────┘
                      │
       Does PID 1 have a listener?
        /                         \
      YES                          NO
      /                             \
Graceful cleanup begins       Signal is ignored!
• Close DB pools               Container hangs for 10s grace period...
• Drain active HTTP requests   Docker sends SIGKILL (Exit 137).
• Exit 0 cleanly               🔥 Abrupt connection drops & corrupted data!
```

---

## 2. Shell Form vs Exec Form in Dockerfiles

```dockerfile
# ❌ SHELL FORM:
CMD node server.js
# Spawns: /bin/sh -c "node server.js"
# Here /bin/sh is PID 1. 'sh' does NOT forward SIGTERM to child 'node'!

# ✅ EXEC FORM:
CMD ["node", "server.js"]
# Directly executes 'node' as PID 1.
```

---

## 3. Node.js Production Graceful Shutdown Pattern

```javascript
// src/server.js
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port 3000');
});

// Signal Handling
function shutdown(signal) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  // 1. Stop accepting new HTTP requests
  server.close(async () => {
    console.log('HTTP server closed.');
    
    // 2. Close database connections
    try {
      await mongoose.connection.close(false);
      console.log('MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during cleanup:', err);
      process.exit(1);
    }
  });

  // Force shutdown if cleanup takes too long
  setTimeout(() => {
    console.error('Forceful shutdown timeout reached.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```
