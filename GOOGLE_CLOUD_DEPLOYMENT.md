# Google Cloud Deployment Guide

This guide shows how to deploy the Mobi Agent project after cloning the GitHub repository.

The app is deployed as:

- Backend: Spring Boot API on Cloud Run
- Database: Cloud SQL PostgreSQL
- Frontend: React app on Cloud Run

## 1. Open Cloud Shell

Go to Google Cloud Console and open Cloud Shell.

Set your project:

```bash
gcloud config set project YOUR_PROJECT_ID
```

Set the region:

```bash
REGION=us-central1
```

## 2. Clone The Repository

```bash
git clone https://github.com/rtemesgen/mobile_agent.git
cd mobile_agent
```

If you already cloned it before:

```bash
cd ~/mobile_agent
git pull
```

## 3. Enable Required Services

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com
```

## 4. Create Cloud SQL PostgreSQL

Create the database server:

```bash
gcloud sql instances create mobi-agent-db \
  --database-version=POSTGRES_16 \
  --edition=ENTERPRISE \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-type=HDD \
  --storage-size=10GB \
  --availability-type=ZONAL \
  --no-deletion-protection
```

Create the app database:

```bash
gcloud sql databases create mobi_agent --instance=mobi-agent-db
```

Set the PostgreSQL password:

```bash
DB_PASSWORD=replace-with-a-strong-password
```

```bash
gcloud sql users set-password postgres \
  --instance=mobi-agent-db \
  --password=$DB_PASSWORD
```

Set the password variable first, then use the same value in the backend deployment command.

## 5. Prepare Cloud SQL Permissions

Get your project number:

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo $PROJECT_ID
echo $PROJECT_NUMBER
```

Give the Cloud Run runtime service account permission to connect to Cloud SQL:

```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

If Google asks for an IAM condition, choose:

```text
2
```

That means `None`.

## 6. Get The Cloud SQL Connection Name

```bash
CONNECTION_NAME=$(gcloud sql instances describe mobi-agent-db --format="value(connectionName)")
echo $CONNECTION_NAME
```

It should look like:

```text
project-id:us-central1:mobi-agent-db
```

## 7. Deploy The Backend

Run this from the repository root:

```bash
gcloud run deploy mobi-agent-api \
  --source backend \
  --region=$REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances=$CONNECTION_NAME \
  --set-env-vars="DB_URL=jdbc:postgresql:///mobi_agent?cloudSqlInstance=$CONNECTION_NAME&socketFactory=com.google.cloud.sql.postgres.SocketFactory,DB_USERNAME=postgres,DB_PASSWORD=$DB_PASSWORD,JWT_SECRET=change-this-to-a-long-secret-value,CORS_ALLOWED_ORIGIN=https://temporary-url.com,SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect"
```

Save the backend URL:

```bash
BACKEND_URL=$(gcloud run services describe mobi-agent-api \
  --region=$REGION \
  --format="value(status.url)")
echo $BACKEND_URL
```

Test backend login:

```bash
curl $BACKEND_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@mobi.local","password":"agent123"}'
```

If it returns a token, the backend works.

## 8. Deploy The Frontend

Run this from the repository root:

```bash
gcloud run deploy mobi-agent-web \
  --source frontend \
  --region=$REGION \
  --allow-unauthenticated \
  --set-env-vars="VITE_API_URL=$BACKEND_URL/api"
```

Save the frontend URL:

```bash
FRONTEND_URL=$(gcloud run services describe mobi-agent-web \
  --region=$REGION \
  --format="value(status.url)")
echo $FRONTEND_URL
```

Check that the frontend has the correct backend URL:

```bash
curl $FRONTEND_URL/env.js
```

It should show the backend API URL.

## 9. Update Backend CORS

The backend must allow requests from the frontend URL:

```bash
gcloud run services update mobi-agent-api \
  --region=$REGION \
  --update-env-vars="CORS_ALLOWED_ORIGIN=$FRONTEND_URL"
```

## 10. Open The Live App

Open the frontend URL in your browser:

```bash
echo $FRONTEND_URL
```

Login with:

```text
Mobi Agent: agent@mobi.local / agent123
Admin: admin@mobi.local / admin123
```

You can also register a new user from the login page.

## 11. If Login Fails

First test backend directly:

```bash
curl $BACKEND_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@mobi.local","password":"agent123"}'
```

Then check frontend runtime config:

```bash
curl $FRONTEND_URL/env.js
```

If `/env.js` does not show the backend URL, redeploy the frontend with:

```bash
gcloud run deploy mobi-agent-web \
  --source frontend \
  --region=$REGION \
  --allow-unauthenticated \
  --set-env-vars="VITE_API_URL=$BACKEND_URL/api"
```

If the browser still fails, hard refresh with `Ctrl + F5` or use an incognito window.

## 12. Useful Commands

View backend logs:

```bash
gcloud run services logs read mobi-agent-api --region=$REGION --limit=80
```

View frontend logs:

```bash
gcloud run services logs read mobi-agent-web --region=$REGION --limit=80
```

List Cloud Run services:

```bash
gcloud run services list --region=$REGION
```

List Cloud SQL databases:

```bash
gcloud sql databases list --instance=mobi-agent-db
```