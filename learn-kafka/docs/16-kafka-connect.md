# 16 — Kafka Connect & Change Data Capture (CDC)

## 1. What is Kafka Connect?

**Kafka Connect** is a distributed runtime framework for reliably streaming data between Apache Kafka and external datastores (PostgreSQL, MySQL, MongoDB, Elasticsearch, Snowflake, S3) without writing custom producer or consumer boilerplate.

```mermaid
flowchart LR
    Postgres[(PostgreSQL)] -->|Source Connector (Debezium CDC)| Kafka[(Kafka Cluster)]
    Kafka -->|Sink Connector| Elastic[(Elasticsearch)]
    Kafka -->|Sink Connector| S3[(Amazon S3 / Data Lake)]
```

---

## 2. Source Connectors vs. Sink Connectors

- **Source Connector**: Captures changes from an external system and writes events into Kafka (e.g. Debezium reading PostgreSQL Write-Ahead Log / WAL).
- **Sink Connector**: Reads events from Kafka topics and writes records into external systems (e.g., Elasticsearch indexer, S3 Parquet archiver).

---

## 3. Change Data Capture (CDC) with Debezium

Instead of having your application publish to Kafka manually, CDC monitors the database's internal transaction log (WAL).
- **Zero code changes** required in the primary API.
- Guaranteed capture of every `INSERT`, `UPDATE`, and `DELETE`.
- Perfect for feeding search indexes and read-replicas.

---

## 4. Next Steps
Go to [17-kafka-streams-concepts.md](file:///c:/Users/Sulaiman/Desktop/pratice-dev/docs/17-kafka-streams-concepts.md) to learn stream processing patterns.
