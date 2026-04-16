# EKS Microservices Deployment — Auth & User Management Platform

> A production-grade, cloud-native microservices application containerised with Docker, orchestrated on Kubernetes, and deployed on AWS Elastic Kubernetes Service (EKS) with a managed MongoDB Atlas data layer.

---

## Project Summary

This project demonstrates end-to-end design, containerisation, and cloud deployment of a two-service RESTful API platform built with Node.js. It covers the full lifecycle from local development (Docker Compose + Minikube) to a live production cluster on AWS EKS, exposed via an internet-facing Network Load Balancer.

**Endpoints validated (Postman):**
- `POST /signup` — Register a new user
- `POST /login` — Authenticate and receive a JWT token

---

## Problem It Solves

Manual, imperative deployments don't scale and introduce drift between environments. This project solves three real-world concerns:

1. **Service coupling** — Authentication concerns are isolated into a dedicated microservice, preventing tight coupling with business logic.
2. **Environment parity** — Docker Compose mirrors the Kubernetes topology locally, eliminating "works on my machine" failures.
3. **Operational scalability** — Kubernetes declarative manifests enable replica management, self-healing, and rolling deployments without manual intervention.

---

## Architecture & Design Patterns

```
 Internet
    │
    ▼
[AWS NLB — internet-facing]
    │
    ▼
[EKS Cluster]
 ┌──────────────────────────────────┐
 │  users-api (Node.js)             │
 │  ClusterIP: auth:3000  ◄────────►│  auth-api (Node.js)
 │  Port: 3000                      │  Port: 3000
 └──────────────────────────────────┘
    │
    ▼
[MongoDB Atlas — cloud-managed]
```

**Design Patterns Applied:**

- **Microservices Architecture** — Auth and Users responsibilities separated into independent deployable units with dedicated Dockerfiles and Kubernetes Deployments.
- **Sidecar / Service Mesh Ready** — Internal service-to-service communication via Kubernetes DNS (`auth:3000`), decoupled from external addressing.
- **Environment Abstraction** — Runtime configuration injected via environment variables; no hardcoded values in application code.
- **Infrastructure as Code** — Kubernetes manifests (`/kubernetes`) define desired state declaratively; reproducible across environments.
- **Dev/Prod Parity** — Docker Compose reproduces the full service topology locally using the same images and networking contracts as the EKS cluster.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Containerisation** | Docker, Docker Compose |
| **Orchestration** | Kubernetes (Minikube local / AWS EKS cloud) |
| **Cloud Provider** | AWS (EKS, VPC, NLB via AWS Load Balancer Controller) |
| **Database** | MongoDB Atlas (managed cloud cluster) |
| **Authentication** | JWT (JSON Web Tokens) |
| **API Testing** | Postman |
| **IaC / Config** | Kubernetes YAML manifests |

---

## Key Features

- **Dual-environment support** — Identical Kubernetes manifests run on both Minikube and EKS with minimal annotation changes.
- **Token-based auth** — Stateless JWT authentication issued by `auth-api` and validated across service boundaries.
- **Inter-service communication** — `users-api` calls `auth-api` using internal Kubernetes DNS (`AUTH_API_ADDRESS: auth:3000`), keeping auth logic outside the users service.
- **Internet-facing NLB** — AWS Network Load Balancer configured with `service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing` annotation for public accessibility.
- **MongoDB Atlas integration** — Cloud-hosted, fully managed database with connection string injected at runtime via environment variable.
- **Declarative Kubernetes config** — Deployments and Services defined in version-controlled YAML, supporting GitOps workflows.

---

## Workflow / Data Flow

**User Signup:**
```
Client → POST /signup
  → users-api receives request
  → Hashes credentials, persists user to MongoDB Atlas
  → Returns 201 Created
```

**User Login:**
```
Client → POST /login
  → users-api receives credentials
  → Calls auth-api internally (auth:3000) to generate JWT
  → auth-api signs token with TOKEN_KEY secret
  → JWT returned to client
```

**Local dev flow:**
```
docker compose up
  → Builds auth-api (port 8000) and users-api (port 8080)
  → Shared Docker network enables service discovery
```

**EKS deployment flow:**
```
kubectl apply -f kubernetes/
  → Deployments and Services created in cluster
  → AWS Load Balancer Controller provisions internet-facing NLB
  → Traffic routed to users-api pods
```

---

## Scalability, Security & Performance

### Scalability
- **Horizontal pod scaling** — Kubernetes Deployments allow `replicas` to be scaled independently for `users-api` and `auth-api` based on load.
- **Stateless services** — JWT-based auth means any pod can handle any request; no sticky sessions required.
- **Managed database** — MongoDB Atlas handles replication, failover, and read scaling independently of application pods.
- **NLB vs ALB** — Network Load Balancer chosen for low-latency Layer-4 routing; suitable for high-throughput API traffic.

### Security
- **Secret injection via env vars** — `TOKEN_KEY` and `MONGODB_CONNECTION_URI` are passed as environment variables; not baked into images.
- **Internal service isolation** — `auth-api` has no external-facing Service; only accessible from within the cluster via ClusterIP DNS.
- **VPC-controlled networking** — EKS cluster provisioned inside a VPC; internal services are not publicly reachable by default.
- **⚠️ Recommended hardening** — Credentials should be migrated from environment variables to Kubernetes Secrets or AWS Secrets Manager. Rotate the `TOKEN_KEY` and MongoDB credentials before any production use.

### Performance
- **NLB connection handling** — AWS NLB operates at Layer 4, avoiding HTTP parsing overhead for raw throughput.
- **Lightweight Node.js services** — Small container images with fast cold-start times suitable for rapid pod scheduling.
- **Atlas connection pooling** — MongoDB Atlas drivers manage connection pools, reducing per-request connection overhead.

---

## How to Run Locally

### Option 1: Docker Compose (Quickest)

```bash
# Clone the repository
git clone https://github.com/LigeshK/eks-deployment-project.git
cd eks-deployment-project

# Start all services
docker compose up --build

# Endpoints
POST http://localhost:8080/signup
POST http://localhost:8080/login
```

### Option 2: Minikube (Kubernetes locally)

```bash
# Start Minikube
minikube start

# Apply manifests
kubectl apply -f kubernetes/

# Get the service URL
minikube service users-service --url

# Test
POST http://<minikube-url>/signup
POST http://<minikube-url>/login
```

### Option 3: AWS EKS

```bash
# Prerequisites: AWS CLI, eksctl, kubectl configured

# Create EKS cluster
eksctl create cluster --name eks-demo --region <region>

# Apply manifests (includes NLB annotation for internet-facing)
kubectl apply -f kubernetes/

# Get Load Balancer DNS
kubectl get svc users-service

# Test via Postman or curl
POST http://<NLB-DNS>/signup
POST http://<NLB-DNS>/login
```

**Sample request body (signup/login):**
```json
{
  "username": "john_doe",
  "password": "securepassword"
}
```

---

## Future Improvements

| Area | Enhancement |
|---|---|
| **Secrets management** | Migrate `TOKEN_KEY` and DB URI to Kubernetes Secrets or AWS Secrets Manager |
| **CI/CD pipeline** | Add GitHub Actions to build, push images to ECR, and run `kubectl apply` on merge to main |
| **Horizontal Pod Autoscaler** | Add HPA configs triggered by CPU/memory metrics via Kubernetes Metrics Server |
| **Health checks** | Add liveness and readiness probes to Deployment specs for zero-downtime rolling updates |
| **Ingress controller** | Replace per-service LoadBalancers with a single AWS ALB Ingress Controller for path-based routing |
| **Observability** | Integrate CloudWatch Container Insights or Prometheus + Grafana for metrics and alerting |
| **Token refresh** | Implement refresh token rotation to limit JWT blast radius on compromise |
| **Rate limiting** | Add request throttling at the ingress or application layer to prevent abuse |
| **Multi-environment** | Introduce Helm charts or Kustomize overlays to manage dev/staging/prod config variations |

---

## Repository Structure

```
eks-deployment-project/
├── auth-api/               # JWT token generation service (Node.js)
│   └── Dockerfile
├── users-api/              # User CRUD + auth delegation service (Node.js)
│   └── Dockerfile
├── kubernetes/             # Kubernetes manifests (Deployments, Services)
├── docker-compose.yaml     # Local dev orchestration
├── README - Minikube.md    # Local cluster setup guide
├── README - AWS_EKS.md     # AWS deployment guide
└── README_EKS_Project.md   # Project status & NLB configuration notes
```

---

*Validated end-to-end on both Minikube (local) and AWS EKS with MongoDB Atlas as the persistent data layer.*
