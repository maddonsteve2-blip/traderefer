@echo off
REM Simple script to update GSC data and deploy to Vercel

echo Pulling latest GSC data...
node scripts/gsc_pull.js

echo Copying to GSC API...
copy gsc-data\gsc_report_*.json apps\gsc-api\data\latest.json

echo Deploying to Vercel...
cd apps\gsc-api
vercel --prod --yes

echo Done! GSC API updated at https://gsc-api-hazel.vercel.app
