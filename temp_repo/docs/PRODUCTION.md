# Production Deployment Guide

## Kubernetes Deployment

### Quick Start

1. Apply all Kubernetes manifests:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/core-api.yaml
kubectl apply -f k8s/telegram-bot.yaml
kubectl apply -f k8s/worker.yaml
kubectl apply -f k8s/gmail-service.yaml
kubectl apply -f k8s/ai-orchestrator.yaml
kubectl apply -f k8s/ingress.yaml
```

2. Wait for pods to be ready:

```bash
kubectl get pods -n cold-email-bot -w
```

3. Run database migrations:

```bash
kubectl exec -it -n cold-email-bot deployment/core-api -- npm run migrate
```

### Secrets Management

Update secrets before deploying:

```bash
# Base64 encode your secrets
echo -n 'your-secret-value' | base64

# Edit secrets file
kubectl edit secret app-secrets -n cold-email-bot
```

Or use external secrets management:

```bash
# Using AWS Secrets Manager
kubectl apply -f https://raw.githubusercontent.com/external-secrets/external-secrets/main/deploy/crds/bundle.yaml
```

### Monitoring

Install Prometheus and Grafana:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

Access Grafana:

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

### Autoscaling

Configure Horizontal Pod Autoscaler:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: worker-hpa
  namespace: cold-email-bot
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: worker
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### High Availability

Ensure PostgreSQL replication:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-cluster
  namespace: cold-email-bot
spec:
  instances: 3
  primaryUpdateStrategy: unsupervised
  storage:
    size: 20Gi
```

Redis Sentinel for HA:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-sentinel
spec:
  replicas: 3
  serviceName: redis-sentinel
  # ... sentinel configuration
```

## Cloud Provider Specific

### AWS Deployment

1. Create EKS cluster:

```bash
eksctl create cluster --name cold-email-bot --region us-east-1 --nodes 3
```

2. Set up RDS for PostgreSQL:

```bash
aws rds create-db-instance \
  --db-instance-identifier cold-email-bot-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username admin \
  --master-user-password your-password \
  --allocated-storage 20
```

3. Set up ElastiCache for Redis:

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id cold-email-bot-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --num-cache-nodes 1
```

### GCP Deployment

1. Create GKE cluster:

```bash
gcloud container clusters create cold-email-bot \
  --zone us-central1-a \
  --num-nodes 3
```

2. Set up Cloud SQL:

```bash
gcloud sql instances create cold-email-bot-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1
```

3. Set up Memorystore for Redis:

```bash
gcloud redis instances create cold-email-bot-redis \
  --size=1 \
  --region=us-central1
```

## Security Hardening

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: core-api-policy
  namespace: cold-email-bot
spec:
  podSelector:
    matchLabels:
      app: core-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: telegram-bot
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
```

### Pod Security Standards

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: cold-email-bot
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

## Disaster Recovery

### Backup Strategy

Automated PostgreSQL backups:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: cold-email-bot
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:16
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h postgres-service -U $POSTGRES_USER $POSTGRES_DB | \
              gzip > /backup/backup-$(date +%Y%m%d-%H%M%S).sql.gz
            env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: POSTGRES_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: POSTGRES_PASSWORD
            volumeMounts:
            - name: backup-volume
              mountPath: /backup
          volumes:
          - name: backup-volume
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

### Recovery Procedures

1. Database restoration:

```bash
kubectl exec -it -n cold-email-bot postgres-0 -- bash
psql -U postgres -d cold_email_bot < /backup/backup.sql
```

2. Application rollback:

```bash
kubectl rollout undo deployment/core-api -n cold-email-bot
kubectl rollout undo deployment/worker -n cold-email-bot
```

## Performance Optimization

### Database Indexing

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_campaigns_workspace_status ON campaigns(workspace_id, status);
CREATE INDEX idx_contacts_workspace_email ON contacts(workspace_id, email);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(campaign_id, status);
CREATE INDEX idx_leads_workspace_status ON leads(workspace_id, status);
CREATE INDEX idx_email_messages_thread ON email_messages(thread_id, created_at DESC);
```

### Redis Cache Optimization

```yaml
# Redis config
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### Application Tuning

Node.js configuration:

```yaml
env:
- name: NODE_OPTIONS
  value: "--max-old-space-size=512"
- name: UV_THREADPOOL_SIZE
  value: "16"
```

## Cost Optimization

### Resource Requests/Limits

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

### Spot Instances

Use spot instances for worker nodes:

```bash
eksctl create nodegroup \
  --cluster=cold-email-bot \
  --spot \
  --instance-types=m5.large,m5a.large \
  --nodes-min=2 \
  --nodes-max=10
```

### Vertical Pod Autoscaler

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: worker-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: worker
  updatePolicy:
    updateMode: "Auto"
```

## Compliance

### GDPR Compliance

- Implement data retention policies
- Add user data export functionality
- Enable right to erasure
- Log all data access

### Email Compliance

- Implement CAN-SPAM unsubscribe
- Add SPF, DKIM, DMARC records
- Rate limiting per domain
- Bounce handling

## Maintenance

### Rolling Updates

```bash
kubectl set image deployment/core-api core-api=cold-email-bot/core-api:v2.0.0 -n cold-email-bot
kubectl rollout status deployment/core-api -n cold-email-bot
```

### Database Maintenance

```sql
-- Regular vacuum
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE cold_email_bot;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Log Rotation

Configure log rotation in Kubernetes:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <match **>
      @type elasticsearch
      host elasticsearch
      port 9200
      logstash_format true
      buffer_chunk_limit 2M
      buffer_queue_limit 8
      flush_interval 5s
      max_retry_wait 30
      disable_retry_limit
    </match>
