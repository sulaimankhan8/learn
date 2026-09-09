# 🚀 Deep Dive: Automated CI/CD Pipelines (GitHub Actions + Docker)

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         AUTOMATED CI/CD LIFECYCLE                           │
 │                                                                             │
 │   Developer Push ──> Run Tests ──> Multi-Stage Build ──> Trivy CVE Scan    │
 │                                                                │            │
 │   Deployment <── Pull Verified Image <── Push GHCR <── Passed  │            │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## Production GitHub Actions Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Production Docker Pipeline

on:
  push:
    branches: [main]
    tags: ['v*.*.*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/backend-api

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      security-events: write

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx (Layer Caching & Multi-Arch)
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract Docker Metadata (Tags & Labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=semver,pattern={{version}}
            type=sha,format=short
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Run Trivy Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          format: 'table'
          exit-code: '1' # Fails CI if HIGH/CRITICAL vulnerabilities found
          ignore-unfixed: true
          severity: 'CRITICAL,HIGH'
```
