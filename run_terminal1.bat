@echo off
title Terminal 1 - NSW VIC QLD WA
cd /d c:\Users\61479\Documents\trade-refer-stitch
set "DATABASE_URL=postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
echo Starting Terminal 1: NSW, VIC, QLD, WA
echo Time: %time% %date%
echo.
node scripts\fill_google_places.js --state NSW
echo.
echo NSW COMPLETE!
echo.
node scripts\fill_google_places.js --state VIC
echo.
echo VIC COMPLETE!
echo.
node scripts\fill_google_places.js --state QLD
echo.
echo QLD COMPLETE!
echo.
node scripts\fill_google_places.js --state WA
echo.
echo WA COMPLETE!
echo.
echo ========================================
echo TERMINAL 1 COMPLETE - ALL STATES DONE!
echo ========================================
pause
