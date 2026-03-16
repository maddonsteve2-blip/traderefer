@echo off
REM Simple script to update GSC data and deploy to Railway

echo Pulling latest GSC data...
node scripts/gsc_pull.js

echo Copying to GSC API...
copy gsc-data\gsc_report_*.json apps\gsc-api\data\latest.json

echo Deploying to Railway...
cd apps\gsc-api
railway up

echo Done! GSC API updated at https://disciplined-truth-production-5cd7.up.railway.app
