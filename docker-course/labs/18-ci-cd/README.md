# 🧪 Lab 18: GitHub Actions CI/CD Pipeline Automation

## 🎯 Objectives
1. Configure automated Docker Buildx caching with GitHub Actions.
2. Automate Trivy container security scans on every pull request.

---

## 🔬 Pipeline Workflow Sample (`.github/workflows/ci.yml`)
```yaml
name: CI
on: [push, pull_request]
jobs:
  build-and-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - name: Build Local Image
        uses: docker/build-push-action@v5
        with:
          context: .
          load: true
          tags: test-image:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - name: Scan with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: test-image:latest
          severity: 'HIGH,CRITICAL'
```
