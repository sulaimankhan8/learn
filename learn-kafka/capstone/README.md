# Capstone Project: Real-Time Fintech Fraud & Payment Streaming Engine

## 🎯 Project Overview
Build a high-throughput, fault-tolerant financial transaction processing and fraud detection streaming pipeline in Node.js and Kafka.

---

## 🏛️ System Architecture

```mermaid
flowchart TB
    Client[Payment Gateway / POS] -->|POST /api/v1/payments| API[Ingestion API Service]
    
    API -->|1. Transactional Outbox| DB[(PostgreSQL Ledger)]
    API -->|2. Outbox Relay (Idempotent)| TopPayments[Topic: fintech.payments.incoming]

    subgraph StreamingPipeline ["Core Event-Driven Services"]
        TopPayments --> SvcFraud[Real-time Fraud Detection Engine]
        TopPayments --> SvcLedger[Settlement & Ledger Service]
        
        SvcFraud -->|Suspicious Tx Alert| TopFraud[Topic: fintech.fraud.alerts]
        SvcFraud -->|High-Risk Account Flagged| TopDLT[Topic: fintech.payments.DLT]
        
        TopPayments --> SvcAudit[Audit & Compliance Aggregator]
    end
```

---

## 📋 System Requirements & Constraints

1. **Ingestion & Outbox Reliability**:
   - Payments received must be committed to the ledger with zero risk of dual-write data loss using the **Transactional Outbox Pattern**.
2. **Real-time Fraud Detection**:
   - Any transaction exceeding **$10,000.00** or flagged with risk score $\ge 80$ must immediately emit a high-priority alert to `fintech.fraud.alerts`.
3. **Partition Key & Ordering**:
   - All transactions for a specific `accountId` must be strictly ordered. Key by `accountId`.
4. **Idempotent Consumption & Deduplication**:
   - In the event of network reconnects or container crashes, the settlement service must reject duplicate `transactionId` records without double debiting.
5. **Dead Letter Queue (DLQ)**:
   - Malformed payloads or negative amount values must be isolated into `fintech.payments.DLT` with error diagnostic headers.

---

## 🧪 Validation & Test Suite

Run the complete reference solution:
```bash
npm run capstone:start
# Or: node capstone/solution/src/index.js
```

Observe:
- Successful payments cleared through the settlement ledger.
- Fraudulent transactions ($15,000+) flagged and sent to `fintech.fraud.alerts`.
- Poison pill malformed transactions routed to `fintech.payments.DLT`.
- Duplicate payment attempts skipped idempotently.
