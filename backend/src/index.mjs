import admin from "firebase-admin";
import { readFileSync } from "fs";

// Load service account JSON
const serviceAccount = JSON.parse(
  readFileSync(new URL("../serviceAccountKey.json", import.meta.url), "utf-8")
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

console.log("🚀 Backend worker started. Listening for new orders...");

db.collection("orders")
  .where("status", "==", "pending")
  .onSnapshot(async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === "added") {
        const order = change.doc.data();
        const orderId = change.doc.id;

        console.log("🆕 New order received:", order);

        try {
          // Simulate printer job
          console.log(`🖨️ Printing order ${orderId}: ${order.drink}`);

          // Update order status
          await db.collection("orders").doc(orderId).update({
            status: "done",
            processedAt: Date.now(),
          });

          console.log(`✅ Order ${orderId} marked as done.`);
        } catch (err) {
          console.error("❌ Failed to process order", orderId, err);
          await db.collection("orders").doc(orderId).update({
            status: "failed",
            error: err.message,
          });
        }
      }
    }
  });
