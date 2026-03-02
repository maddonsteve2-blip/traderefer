---
description: Deploy the web app to Vercel production
---

1. Run TypeScript check to ensure no errors:
```
npx tsc --noEmit
```
Cwd: `c:\Users\61479\Documents\trade-refer-stitch\apps\web`

2. Stage and commit all changes:
```
git add -A
git commit -m "your message here"
```
Cwd: `c:\Users\61479\Documents\trade-refer-stitch`

3. Push to GitHub:
```
git push origin master
```
Cwd: `c:\Users\61479\Documents\trade-refer-stitch`

4. Deploy to Vercel production (apps/web directory only — avoids uploading entire monorepo):
```
vercel --prod --archive=tgz
```
Cwd: `c:\Users\61479\Documents\trade-refer-stitch\apps\web`
