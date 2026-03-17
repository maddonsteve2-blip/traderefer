@echo off
title Terminal 1 - NSW VIC QLD WA
cd /d c:\Users\61479\Documents\trade-refer-stitch
echo Starting Terminal 1: NSW, VIC, QLD, WA
echo.
node scripts\fill_google_places.js --empty-only --state NSW
echo.
echo NSW COMPLETE!
echo.
node scripts\fill_google_places.js --empty-only --state VIC
echo.
echo VIC COMPLETE!
echo.
node scripts\fill_google_places.js --empty-only --state QLD
echo.
echo QLD COMPLETE!
echo.
node scripts\fill_google_places.js --empty-only --state WA
echo.
echo WA COMPLETE!
echo.
echo ========================================
echo TERMINAL 1 COMPLETE - ALL STATES DONE!
echo ========================================
pause
