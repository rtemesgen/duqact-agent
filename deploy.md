PROJECT_ID=duqact-494418
REGION=us-central1
CONNECTION_NAME=duqact-494418:us-central1:mobi-agent-db
DB_PASSWORD='duqact@123'
JWT_SECRET='duqact-agent-prod-secret-key-2026-very-long-01'
CORS_ALLOWED_ORIGIN='https://duqact.vercel.app'


cd ~/duqact-agent
git pull origin main
git log --oneline -1



cd ~/duqact-agent/backend
gradle bootJar --no-daemon


IMAGE_TAG=account-ledger-$(date +%Y%m%d-%H%M%S)
gcloud builds submit --tag us-central1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/mobi-agent-api:$IMAGE_TAG .



gcloud run deploy mobi-agent-api \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/mobi-agent-api:$IMAGE_TAG \
  --region=$REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances=$CONNECTION_NAME \
  --set-env-vars="DB_URL=jdbc:postgresql:///mobi_agent?cloudSqlInstance=$CONNECTION_NAME&socketFactory=com.google.cloud.sql.postgres.SocketFactory,DB_USERNAME=postgres,DB_PASSWORD=$DB_PASSWORD,JWT_SECRET=$JWT_SECRET,CORS_ALLOWED_ORIGIN=$CORS_ALLOWED_ORIGIN,SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect"


cd ~/duqact-agent
git pull origin main
cd ~/duqact-agent/backend
gradle bootJar --no-daemon
IMAGE_TAG=account-ledger-$(date +%Y%m%d-%H%M%S)
gcloud builds submit --tag us-central1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/mobi-agent-api:$IMAGE_TAG .
gcloud run deploy mobi-agent-api \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/mobi-agent-api:$IMAGE_TAG \
  --region=$REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances=$CONNECTION_NAME \
  --set-env-vars="DB_URL=jdbc:postgresql:///mobi_agent?cloudSqlInstance=$CONNECTION_NAME&socketFactory=com.google.cloud.sql.postgres.SocketFactory,DB_USERNAME=postgres,DB_PASSWORD=$DB_PASSWORD,JWT_SECRET=$JWT_SECRET,CORS_ALLOWED_ORIGIN=$CORS_ALLOWED_ORIGIN,SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect"
