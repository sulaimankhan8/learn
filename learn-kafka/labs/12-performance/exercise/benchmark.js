import { Kafka, CompressionTypes } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'exercise12-perf',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

// TODO: Write a benchmark comparing CompressionTypes.None vs CompressionTypes.GZIP
// for 1KB payloads. Output the total payload size transferred and execution time.
