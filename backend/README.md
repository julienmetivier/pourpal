# PourPal Backend Worker

This is a simple backend service that listens for new drink orders in **Firestore** and processes them (simulating sending them to a thermal printer).

---

## 📦 Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your Firebase service account**
   - Go to [Firebase Console → Project Settings → Service Accounts](https://console.firebase.google.com/).
   - Generate a new private key.
   - Save the file as:
     ```
     backend/serviceAccountKey.json
     ```

3. **Ensure your Firestore has an `orders` collection**
   Each order should be created by the frontend like:
   ```js
   await addDoc(collection(db, "orders"), {
     drink: "Mojito",
     employeeId: "bartender123",
     timestamp: Date.now(),
     status: "pending"
   });
   ```

---

## 🚀 Running the worker

From inside the `backend/` folder:

```bash
node index.mjs
```

You should see:

```
🚀 Backend worker started. Listening for new orders...
```

When a new order is added to Firestore:

```
🆕 New order received: { drink: 'Mojito', employeeId: 'bartender123', ... }
🖨️ Printing order abc123: Mojito
✅ Order abc123 marked as done.
```

---

## ⚡ Workflow

1. Frontend app inserts a new document in `orders` with `status: "pending"`.
2. This worker listens for new pending orders.
3. On new order:
   - Logs the order (pretending to send it to printer).
   - Updates its status to `"done"`.
   - If an error occurs, marks it as `"failed"`.

---

## 🛠️ Notes

- Run this worker on the machine connected to your **thermal printer**.  
- Replace the `console.log("🖨️ Printing...")` line with your actual printer logic.  
- Make sure the backend keeps running — you can use **pm2**, **systemd**, or **Docker** to run it as a background service.  
