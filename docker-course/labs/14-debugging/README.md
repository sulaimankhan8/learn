# 🧪 Lab 14: The Broken Stack Debugging Laboratory

## 🎯 Objectives
Diagnose and fix 3 intentionally broken microservice configurations without looking at the solutions.

---

## 🔬 Broken Scenario 1: The Disconnecting DB
**Symptom**: Node API logs `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`.
**Diagnosis Goal**: Inspect `compose.yaml` network attachment and URI hostname.

---

## 🔬 Broken Scenario 2: The Mysterious 404/Connection Refused
**Symptom**: Node API is running, `docker ps` shows `0.0.0.0:3000->3000/tcp`, but `curl http://localhost:3000` times out.
**Diagnosis Goal**: Check whether the Express app is listening on `127.0.0.1` instead of `0.0.0.0`.

---

## 🔬 Broken Scenario 3: The Premature Crash
**Symptom**: Container runs `CMD service nginx start` and immediately stops with code 0.
**Diagnosis Goal**: Explain why background daemon forks cause Docker PID 1 to exit.
