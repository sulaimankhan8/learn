# Project 04 — Production-Grade Event Platform

## Overview
An enterprise-grade event-driven backend platform combining:
1. **Express.js API Gateway**
2. **Transactional Outbox Pattern** (guaranteeing that database mutations and event publications are 100% atomic)
3. **Outbox Relay Daemon** (polling/streaming events to Kafka with idempotent publisher)
4. **Idempotent Worker Services** with deduplication safeguards
5. **Dead Letter Queue (DLQ) Routing** for poison pill exceptions

## Architecture
```mermaid
flowchart TB
    Client[HTTP Client] --> API[Express API Gateway]
    
    subgraph TransactionalBoundary ["Atomic DB Transaction"]
        API -->|1. Write Business Data| DB[(PostgreSQL)]
        API -->|2. Write to outbox_events| DB
    end

    OutboxRelay[Outbox Relay Worker] -->|3. Read Unsent Outbox Events| DB
    OutboxRelay -->|4. Idempotent Produce| Kafka[(Kafka Cluster)]
    OutboxRelay -->|5. Mark Outbox as PROCESSED| DB

    Kafka --> Consumer[Idempotent Order Processor]
    Consumer -->|6. Check Dedup Table| DB
    Consumer -->|7. If Corrupt| DLT[Topic: orders.DLT]
```

## Run
```bash
npm run project:04:start
# Or: node projects/04-production-style-platform/src/index.js
```

## Production Highlights Demonstrated
- **Zero Dual-Write Race Conditions**: Solved via Transactional Outbox.
- **At-Least-Once Delivery**: With consumer-side deduplication table.
- **Poison Pill Resilience**: Safe isolation to DLT without halting worker pipelines.
