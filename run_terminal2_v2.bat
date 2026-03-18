@echo off
title Terminal 2 V3 - SA ACT TAS NT (Fast + Complete)
cd /d c:\Users\61479\Documents\trade-refer-stitch
set "DATABASE_URL=postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
echo Starting Terminal 2 V3 (Fast + Complete): SA, ACT, TAS, NT
echo Time: %time% %date%
echo.
node scripts\fill_google_places_v3.js --state SA
echo.
echo SA COMPLETE!
echo.
node scripts\fill_google_places_v3.js --state ACT
echo.
echo ACT COMPLETE!
echo.
node scripts\fill_google_places_v3.js --state TAS
echo.
echo TAS COMPLETE!
echo.
node scripts\fill_google_places_v3.js --state NT
echo.
echo NT COMPLETE!
echo.
echo ========================================
echo TERMINAL 2 V3 COMPLETE - ALL STATES DONE!
echo ========================================
pause
