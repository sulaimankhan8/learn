# Production Multi-Service Event Architecture

```mermaid
flowchart TB
    Client[Web & Mobile Clients] --> LB[Load Balancer / Cloudflare]
    LB --> Gateway[Express.js API Gateway]

    subgraph PersistenceLayer ["Transactional Outbox Storage"]
        Gateway -->|Atomic DB Transaction| PG[(PostgreSQL)]
        PG -->|Outbox Table (Events)| OutboxRelay[Outbox Relay Worker]
    end

    OutboxRelay -->|Idempotent Produce| KafkaCluster[(Kafka Cluster)]

    subgraph KafkaCluster
        TopOrders["Topic: commerce.orders"]
        TopPayments["Topic: finance.payments"]
        TopNotifications["Topic: comms.notifications"]
        TopDLT["Topic: *.DLT"]
    end

    subgraph Microservices ["Consumer Microservices"]
        TopOrders --> SvcPayment[Payment Service]
        TopOrders --> SvcInventory[Inventory Service]
        TopOrders --> SvcAnalytics[Analytics Aggregator]
        TopPayments --> SvcNotifications[Notification Service]
        TopDLT --> SvcDLT[Dead-Letter Monitor & Alerting]
    end
```
