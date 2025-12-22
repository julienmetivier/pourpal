# Testing Guide for Environment Variables Setup

## ✅ Local Testing

### 1. Verify Environment Variables
Run the test script:
```bash
node test-env.js
```

Expected output: All variables should show ✅

### 2. Test Development Server
```bash
npm start
```

**Check the browser console** (F12 → Console tab) for:
- ✅ No errors about missing Firebase environment variables
- ✅ Firebase should initialize successfully
- ✅ Your app should load and connect to Firebase

### 3. Test Production Build
```bash
npm run build
```

This should complete without errors. The build will embed your environment variables.

### 4. Verify No Hardcoded Secrets
```bash
# Check source code - should return nothing
grep -r "AIzaSyAI7K" src/

# Should return: No matches (or empty)
```

## 🚀 GitHub Actions Testing

### Option 1: Manual Workflow Trigger
1. Go to your GitHub repository
2. Click on **Actions** tab
3. Select **"Build and Deploy to Firebase"** workflow
4. Click **"Run workflow"** → **"Run workflow"**
5. Watch the workflow execute

### Option 2: Push to Main/Master Branch
```bash
git add .
git commit -m "test: verify environment variables setup"
git push origin main  # or master
```

The workflow will automatically trigger.

### What to Check in GitHub Actions:
- ✅ Build step completes successfully
- ✅ No errors about missing environment variables
- ✅ Deployment step completes
- ✅ Check the logs to verify env vars are being used

### Troubleshooting GitHub Actions:
If the workflow fails:
1. **Missing secrets?** Go to Settings → Secrets → Verify all 6 Firebase secrets are set
2. **Missing FIREBASE_SERVICE_ACCOUNT?** Add the Firebase service account JSON as a secret
3. **Check workflow logs** for specific error messages

## 🔍 Verification Checklist

- [ ] `.env` file exists and has all 6 variables
- [ ] `test-env.js` passes
- [ ] `npm start` works without console errors
- [ ] `npm run build` completes successfully
- [ ] No hardcoded secrets in `src/` directory
- [ ] GitHub secrets are configured (all 6 Firebase vars + FIREBASE_SERVICE_ACCOUNT)
- [ ] GitHub Actions workflow runs successfully

