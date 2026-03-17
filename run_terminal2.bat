@echo off
title Terminal 2 - SA ACT TAS NT
cd /d c:\Users\61479\Documents\trade-refer-stitch
echo Starting Terminal 2: SA, ACT, TAS, NT
echo.
node scripts\fill_google_places.js --empty-only --state SA
echo.
echo SA COMPLETE!
echo.
node scripts\fill_google_places.js --empty-only --state ACT
echo.
echo ACT COMPLETE!
echo.
node scripts\fill_google_places.js --empty-only --state TAS
echo.
echo TAS COMPLETE!
echo.
node scripts\fill_google_places.js --empty-only --state NT
echo.
echo NT COMPLETE!
echo.
echo ========================================
echo TERMINAL 2 COMPLETE - ALL STATES DONE!
echo ========================================
pause
