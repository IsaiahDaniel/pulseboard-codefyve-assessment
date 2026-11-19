# Kubernetes manifests (local / cluster-ready)

Reproducible deployment shape for PulseBoard. A live production cluster is **not** required for the assessment; these artifacts show how the app would run under Kubernetes.

## Apply (kind / minikube / any cluster)

```bash
# Build images into the cluster runtime (example: kind)
docker build -t pulseboard-api:local ../../apps/api
docker build -t pulseboard-web:local ../../apps/web
kind load docker-image pulseboard-api:local pulseboard-web:local   # if using kind

kubectl apply -f namespace.yaml
kubectl apply -f mongo.yaml
kubectl apply -f api.yaml
kubectl apply -f web.yaml

kubectl -n pulseboard get pods,svc,hpa
kubectl -n pulseboard port-forward svc/web 3000:3000
kubectl -n pulseboard port-forward svc/api 4200:4200
```

## Growth / failure model

| Concern | Approach in these manifests |
|---------|-----------------------------|
| Traffic growth | API `replicas: 2` + HPA to 8 on CPU |
| Pod failure | Multi-replica Deployments; readiness/liveness on `/api/v1/health` |
| Config change | Secret for `JWT_SECRET`; env on Deployment (ConfigMap next) |
| Data durability | Mongo PVC (swap to Atlas / managed Mongo for real prod) |
| Future change | Split mongo to operator/Atlas; Ingress + TLS; separate staging namespace |

Local equivalent without Kubernetes: `docker compose up --build` from the repo root.
