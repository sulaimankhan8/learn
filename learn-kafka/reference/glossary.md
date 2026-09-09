# Kafka & Event Streaming Glossary

| Term | Definition |
| :--- | :--- |
| **ACL** | Access Control List defining security permissions (`READ`, `WRITE`) for client principals. |
| **Broker** | A single server node in a Kafka cluster running the storage and messaging engine. |
| **CDC** | Change Data Capture: Streaming database row changes (INSERT/UPDATE/DELETE) into Kafka. |
| **Consumer Lag** | The number of unread messages between the partition Log End Offset (LEO) and consumer committed offset. |
| **Controller** | The KRaft leader broker responsible for cluster state metadata and partition leader election. |
| **DLT / DLQ** | Dead Letter Topic: Dedicated topic where unprocessable or poison pill messages are isolated. |
| **EOS** | Exactly-Once Semantics: Ensuring each message is processed without loss or duplication. |
| **Heartbeat** | Periodic ping sent from consumer to broker coordinator to prove the worker process is healthy. |
| **Idempotence** | Property where executing an operation multiple times produces the exact same outcome as once. |
| **ISR** | In-Sync Replicas: The subset of partition follower brokers that are fully caught up with the leader. |
| **KRaft** | Kafka Raft metadata mode (ZooKeeper-less consensus engine introduced in Apache Kafka 3.0+). |
| **LEO** | Log End Offset: The highest offset written to a partition log on broker disk. |
| **Offset** | Sequential 64-bit integer identifier assigned to each record in a partition. |
| **Outbox Pattern** | Transactional pattern saving business state and events in the same database transaction. |
| **Partition** | An ordered, append-only commit log unit that provides Kafka's horizontal scalability. |
| **Rebalance** | Protocol redistributing topic partitions across members of a consumer group. |
| **Segment** | Physical file on broker disk (`.log` and `.index`) storing a portion of a partition's data. |
| **Topic** | Logical category or stream name to which records are published and consumed. |
| **Zero-Copy** | OS optimization (`sendfile`) transferring data from Page Cache to NIC without user-space copying. |
