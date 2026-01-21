# CI/CD Pipeline - AI Cold Email Bot

**Version:** 1.0.0  
**Last Updated:** 2026-01-19

---

## Table of Contents

1. [Overview](#overview)
2. [CI Pipeline](#ci-pipeline)
3. [CD Pipeline](#cd-pipeline)
4. [Release Pipeline](#release-pipeline)
5. [Required Secrets](#required-secrets)
6. [Branching Strategy](#branching-strategy)
7. [Workflows](#workflows)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

The AI Cold Email Bot uses GitHub Actions for CI/CD automation. The pipeline includes:

- **Continuous Integration (CI)** - Automated testing, linting, and building
- **Continuous Deployment (CD)** - Automated deployment to Render
- **Release Management** - Automated Docker image building and releases

### Pipeline Benefits

✅ **Automated Quality Checks** - Every commit is tested automatically  
✅ **Fast Feedback** - Developers get quick feedback on code quality  
✅ **Automated Deployment** - No manual deployment steps  
✅ **Consistent Releases** - Standardized release process  
✅ **Docker Images** - Automated Docker image management  

---

## CI Pipeline

### Workflow: `.github/workflows/ci.yml`

The CI pipeline runs on every push and pull request to `main` and `develop` branches.

### Jobs

#### 1. Lint Code
```yaml
Job: lint
Purpose: Run ESLint to check code quality
Trigger: push/PR to main, develop
```

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install pnpm
4. Install dependencies
5. Run ESLint (`pnpm lint:check`)

#### 2. Type Check
```yaml
Job: type-check
Purpose: TypeScript type checking
Trigger: push/PR to main, develop
```

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install pnpm
4. Install dependencies
5. Run TypeScript compiler (`pnpm -r exec tsc --noEmit`)

#### 3. Test
```yaml
Job: test
Purpose: Run unit and integration tests
Trigger: push/PR to main, develop
Services: PostgreSQL, Redis
```

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install pnpm
4. Install dependencies
5. Setup test database (PostgreSQL + Redis)
6. Run tests (`pnpm test`)
7. Upload coverage reports to Codecov

**Environment Variables:**
- `DATABASE_URL` - Test database connection string
- `REDIS_URL` - Test Redis connection string
- `NODE_ENV` - Set to `test`

#### 4. Build
```yaml
Job: build
Purpose: Build all packages and services
Trigger: After lint, type-check, test succeed
```

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install pnpm
4. Install dependencies
5. Build all packages (`pnpm build`)
6. Upload build artifacts

**Build Artifacts:**
- `client/dist` - Frontend build
- `services/*/dist` - Backend service builds

#### 5. Security Scan
```yaml
Job: security-scan
Purpose: Check for security vulnerabilities
Trigger: push/PR to main, develop
```

**Steps:**
1. Checkout code
2. Run npm audit (`pnpm audit`)
3. Run Snyk security scan (if SNYK_TOKEN is configured)

### CI Pipeline Flow

```
push/PR
  ├── lint
  ├── type-check
  ├── test (with PostgreSQL + Redis)
  ├── security-scan
  └── build (after lint, type-check, test pass)
```

---

## CD Pipeline

### Workflow: `.github/workflows/cd-render.yml`

The CD pipeline handles automated deployment to Render cloud platform.

### Jobs

#### 1. Deploy to Production
```yaml
Job: deploy
Purpose: Deploy to Render production
Trigger: push to main branch
Requires: build job from CI
```

**Steps:**
1. Checkout code
2. Deploy to Render using `RENDER_SERVICE_ID` and `RENDER_API_KEY`
3. Wait for deployment completion

#### 2. Deploy to Staging
```yaml
Job: deploy-staging
Purpose: Deploy to Render staging environment
Trigger: push to develop branch
```

**Steps:**
1. Checkout code
2. Deploy to Render staging using `RENDER_STAGING_SERVICE_ID`
3. Wait for deployment completion

#### 3. Notify Deployment Status
```yaml
Job: notify
Purpose: Notify deployment status
Trigger: After deploy job completes
```

**Steps:**
1. Check deployment status
2. Print success or failure message

### CD Pipeline Flow

```
push to main
  ├── CI pipeline (lint, type-check, test, build)
  └── CD pipeline
      ├── Deploy to production
      └── Notify status

push to develop
  └── CD pipeline
      └── Deploy to staging
```

---

## Release Pipeline

### Workflow: `.github/workflows/release.yml`

The release pipeline handles version releases and Docker image building.

### Trigger

```yaml
On: push tags matching 'v*' (e.g., v1.0.0, v2.1.3)
Permissions: contents: write
```

### Jobs

#### 1. Create Release
```yaml
Job: create-release
Purpose: Create GitHub release with artifacts
```

**Steps:**
1. Checkout code (full history)
2. Setup Node.js 20
3. Install pnpm
4. Install dependencies
5. Build project (`pnpm build`)
6. Run tests (`pnpm test`)
7. Create GitHub release with auto-generated notes
8. Upload build artifacts

**Release Features:**
- Auto-generated release notes
- Not a draft
- Not a pre-release
- Uploads build artifacts (30-day retention)

#### 2. Push Docker Images
```yaml
Job: docker-push
Purpose: Build and push Docker images to Docker Hub
Matrix: core-api, telegram-bot, worker, gmail-service, ai-orchestrator
```

**Steps:**
1. Checkout code
2. Setup Docker Buildx
3. Log in to Docker Hub
4. Extract metadata (tags, labels)
5. Build and push Docker image with multiple tags
6. Output image digest

**Docker Tags:**
- `v0botver1/{service}:{version}` (e.g., v0botver1/core-api:1.0.0)
- `v0botver1/{service}:{major}.{minor}` (e.g., v0botver1/core-api:1.0)
- `v0botver1/{service}:{major}` (e.g., v0botver1/core-api:1)
- `v0botver1/{service}:latest` (for main branch)

#### 3. Notify Release
```yaml
Job: notify
Purpose: Notify release status
```

**Steps:**
1. Check if release and docker jobs succeeded
2. Print success or failure message

### Release Pipeline Flow

```
git tag v1.0.0 && git push --tags
  ├── create-release
  │   ├── Build project
  │   ├── Run tests
  │   ├── Create GitHub release
  │   └── Upload artifacts
  ├── docker-push (matrix of 5 services)
  │   ├── Build Docker image
  │   ├── Tag with version
  │   └── Push to Docker Hub
  └── notify
```

---

## Required Secrets

Configure these secrets in your GitHub repository settings:

### Render Deployment Secrets

| Secret | Required For | Description |
|--------|---------------|-------------|
| `RENDER_API_KEY` | CD pipeline | API key for Render deployment |
| `RENDER_SERVICE_ID` | Production deployment | Service ID for production Render app |
| `RENDER_STAGING_SERVICE_ID` | Staging deployment | Service ID for staging Render app |

### Docker Registry Secrets

| Secret | Required For | Description |
|--------|---------------|-------------|
| `DOCKER_USERNAME` | Release pipeline | Docker Hub username |
| `DOCKER_PASSWORD` | Release pipeline | Docker Hub password or access token |

### Optional Secrets

| Secret | Required For | Description |
|--------|---------------|-------------|
| `SNYK_TOKEN` | Security scanning | Snyk API token for advanced security scanning |
| `CODECOV_TOKEN` | Test coverage | Codecov token for coverage reports |

### How to Add Secrets

1. Go to GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the table above

---

## Branching Strategy

### Branches

| Branch | Purpose | Deployment |
|---------|---------|------------|
| `main` | Production code | Deploys to production (Render) |
| `develop` | Integration branch | Deploys to staging (Render) |
| `feature/*` | Feature development | No deployment |
| `bugfix/*` | Bug fixes | No deployment |
| `hotfix/*` | Production hotfixes | Deploys to production |

### Workflow

1. **Feature Development**
   ```
   main → feature/new-feature
   Develop feature
   Create PR to develop
   CI runs (lint, type-check, test, build)
   Merge to develop
   Deploy to staging
   ```

2. **Release Preparation**
   ```
   develop → main
   Create PR to main
   CI runs
   Merge to main
   Deploy to production
   ```

3. **Hotfix**
   ```
   main → hotfix/critical-bug
   Fix bug
   Create PR to main
   CI runs
   Merge to main
   Deploy to production
   Back-merge to develop
   ```

### Creating a Release

```bash
# Ensure all tests pass on main
git checkout main
git pull origin main

# Create version tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag to trigger release workflow
git push origin v1.0.0
```

---

## Workflows

### Viewing Workflow Runs

1. Go to GitHub repository
2. Click **Actions** tab
3. View workflow runs and status
4. Click on a workflow run for details

### Manual Workflow Triggers

Some workflows can be triggered manually:

- **CD Pipeline** → Click **Run workflow** button in Actions tab
- Useful for forcing a deployment

### Workflow Status Badges

Add these badges to your README.md:

```markdown
![CI](https://github.com/Valeriq/v0botver1-g/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/Valeriq/v0botver1-g/actions/workflows/cd-render.yml/badge.svg)
```

---

## Troubleshooting

### Common Issues

#### 1. CI Tests Failing

**Problem:** Tests pass locally but fail in CI

**Solutions:**
- Check environment variables are set correctly
- Ensure database migrations are run
- Check for timing issues (add waits if needed)
- Review CI logs for specific errors

#### 2. Build Failures

**Problem:** Build job fails

**Solutions:**
- Check TypeScript errors (`pnpm -r exec tsc --noEmit`)
- Verify all dependencies are in lockfile
- Check for missing build scripts in package.json

#### 3. Deployment Fails

**Problem:** Deployment to Render fails

**Solutions:**
- Verify `RENDER_API_KEY` and `RENDER_SERVICE_ID` are correct
- Check Render service status
- Review deployment logs in Render dashboard
- Ensure build artifacts are uploaded

#### 4. Docker Push Fails

**Problem:** Docker image push fails

**Solutions:**
- Verify `DOCKER_USERNAME` and `DOCKER_PASSWORD` are correct
- Check Docker Hub account permissions
- Ensure Dockerfile exists for each service
- Check Docker image size limits

#### 5. Security Scan Failures

**Problem:** Security scan finds vulnerabilities

**Solutions:**
- Run `pnpm audit --fix` locally
- Update vulnerable packages
- Review Snyk recommendations
- Accept risks if vulnerability is not exploitable

### Debug Mode

To debug a workflow:

1. Go to Actions tab
2. Click on the failed workflow run
3. Click on the failed job
4. Review logs step by step
5. Enable debug logging if needed:
   ```yaml
   env:
     ACTIONS_STEP_DEBUG: true
     ACTIONS_RUNNER_DEBUG: true
   ```

---

## Best Practices

### For Developers

1. **Run Tests Locally Before Pushing**
   ```bash
   pnpm lint:check
   pnpm -r exec tsc --noEmit
   pnpm test
   ```

2. **Write Meaningful Commit Messages**
   ```
   feat(auth): add Telegram login integration
   fix(email): resolve race condition in email sending
   ```

3. **Keep PRs Focused**
   - One feature or bug fix per PR
   - Small, reviewable changes
   - Include tests with changes

4. **Update Documentation**
   - Update README for user-facing changes
   - Update API docs for API changes
   - Update architecture docs for structural changes

### For CI/CD Maintenance

1. **Regular Updates**
   - Keep GitHub Actions updated
   - Update Node.js version when needed
   - Review and update dependencies

2. **Monitor Pipeline Performance**
   - Check workflow duration regularly
   - Optimize slow jobs
   - Use caching effectively

3. **Security**
   - Rotate secrets regularly
   - Use least-privilege access
   - Monitor security scan results

4. **Backup and Recovery**
   - Keep release artifacts
   - Document rollback procedures
   - Test disaster recovery

### For Releases

1. **Semantic Versioning**
   - Follow SemVer (Major.Minor.Patch)
   - Increment Major for breaking changes
   - Increment Minor for new features
   - Increment Patch for bug fixes

2. **Release Notes**
   - Auto-generated from commits
   - Review and edit before publishing
   - Include upgrade instructions

3. **Testing Before Release**
   - All tests must pass
   - Manual testing on staging
   - Smoke tests on production

---

## Advanced Topics

### Custom Workflows

You can create custom workflows for specific needs:

```yaml
# .github/workflows/custom.yml
name: Custom Workflow
on:
  workflow_dispatch:
    inputs:
      environment:
        required: true
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  custom-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running on ${{ inputs.environment }}"
```

### Scheduled Workflows

Run workflows on a schedule:

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
```

### Conditional Jobs

Run jobs based on conditions:

```yaml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
```

### Matrix Strategies

Run jobs across multiple configurations:

```yaml
strategy:
  matrix:
    node-version: [18, 20]
    os: [ubuntu-latest, windows-latest]
```

---

## Resources

### Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Render Deployment Guide](./RENDER_DEPLOY.md)
- [Docker Documentation](https://docs.docker.com/)

### Tools

- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Codecov](https://codecov.io/) - Code coverage
- [Snyk](https://snyk.io/) - Security scanning

### Examples

- [GitHub Actions Starter Workflows](https://github.com/actions/starter-workflows)
- [Docker Build Push Action](https://github.com/docker/build-push-action)

---

## Support

For issues or questions:

1. Check this documentation
2. Review workflow logs in GitHub Actions
3. Check Render dashboard for deployment issues
4. Open an issue in the repository

---

**Last Updated:** 2026-01-19  
**Maintainer:** Development Team
