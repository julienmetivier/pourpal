import admin from "firebase-admin";
import { readFileSync } from "fs";
import { createRequire } from "module";

// Use createRequire to load CommonJS modules properly
const require = createRequire(import.meta.url);

// Load CommonJS modules using require to ensure proper initialization
const usbModule = require("usb");

// Patch usb module to add EventEmitter methods that escpos-usb expects
// escpos-usb calls usb.on() but newer versions of node-usb expose it as usb.usb.on()
if (usbModule.usb && typeof usbModule.usb.on === 'function') {
  // Copy EventEmitter methods from usb.usb to usb module itself
  // This ensures escpos-usb can call usb.on() when it requires('usb')
  const eventEmitterMethods = ['on', 'once', 'emit', 'removeListener', 'removeAllListeners', 'listeners', 'listenerCount'];
  eventEmitterMethods.forEach(method => {
    if (typeof usbModule.usb[method] === 'function') {
      usbModule[method] = usbModule.usb[method].bind(usbModule.usb);
    }
  });
}

// Now load escpos and escpos-usb (they will get the patched usb module from cache)
const escpos = require("escpos");
const escposUSB = require("escpos-usb");

// Setup escpos USB
escpos.USB = escposUSB;

// Load service account JSON
const serviceAccount = JSON.parse(
  readFileSync(new URL("../serviceAccountKey.json", import.meta.url), "utf-8")
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Initialize printer device lazily
// Note: On Linux/Raspbian, USB access may require:
// - Running as root, OR
// - Adding user to 'dialout' group: sudo usermod -a -G dialout $USER
// - Setting up udev rules for the printer
// On macOS, USB access should work without special permissions
let printerDeviceInfo = null;
let printerInitialized = false;

const initializePrinter = () => {
  if (printerInitialized) {
    return printerDeviceInfo; // Already initialized
  }

  printerInitialized = true;

  try {
    console.log("🔍 Searching for USB printers...");
    const devices = escpos.USB.findPrinter();
    console.log("📋 Found devices:", devices);
    
    if (devices && devices.length > 0) {
      printerDeviceInfo = devices[0];
      console.log("🖨️ Printer device found:", JSON.stringify(devices[0], null, 2));
    } else {
      console.warn("⚠️ No USB printer found. Printing will be skipped.");
      console.warn("   On Linux/Raspbian, ensure USB permissions are set correctly.");
      printerDeviceInfo = null;
    }
  } catch (error) {
    console.error("❌ Failed to find printer:", error);
    console.error("   Error details:", error.message);
    console.error("   Stack:", error.stack);
    if (error.message && (error.message.includes("LIBUSB") || error.message.includes("usb"))) {
      console.error("   This may be a permissions issue. On Linux, try:");
      console.error("   - Running with sudo, OR");
      console.error("   - Adding user to dialout group: sudo usermod -a -G dialout $USER");
    }
    printerDeviceInfo = null;
  }
  
  return printerDeviceInfo;
};

// Initialize printer on startup
initializePrinter();

// Function to print order
// Returns true if printing succeeded, false if no printer available, throws error if printing failed
const printOrder = (drink, clientName) => {
  return new Promise((resolve, reject) => {
    // Try to re-initialize printer if not found initially (in case it was plugged in later)
    if (!printerDeviceInfo) {
      console.log("🔄 Re-checking for printer...");
      initializePrinter();
    }
    
    // Create device instance when needed (lazy initialization)
    if (!printerDeviceInfo) {
      console.warn("⚠️ No printer available, skipping print");
      console.warn("   Make sure a USB printer is connected and try running: node src/list-usb.mjs");
      reject(new Error("No printer available"));
      return;
    }

    // Create a new USB device instance for each print job
    const device = new escpos.USB(printerDeviceInfo);
    
    device.open((error) => {
      if (error) {
        console.error("❌ Failed to open printer:", error);
        reject(error);
        return;
      }

      const printer = new escpos.Printer(device);
      
      printer
        .font("a")
        .align("ct")
        .style("b") // Bold
        .size(1, 1)
        .text(drink)
        .style("NORMAL")
        .size(0, 0) // Smaller size for customer name
        .text("\n")
        .text(clientName || "Unknown")
        .text("\n")
        .cut()
        .close((err) => {
          if (err) {
            console.error("❌ Error closing printer:", err);
            reject(err);
          } else {
            console.log("✅ Print job completed");
            resolve();
          }
        });
    });
  });
};

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
          // Print order - only mark as done if printing succeeds
          await printOrder(order.drink, order.clientName);
          console.log(`🖨️ Printed order ${orderId}: ${order.drink} for ${order.clientName}`);

          // Update order status only after successful printing
          await db.collection("orders").doc(orderId).update({
            status: "done",
            processedAt: Date.now(),
          });

          console.log(`✅ Order ${orderId} marked as done.`);
        } catch (err) {
          console.error("❌ Failed to print order", orderId, err);
          // Don't update order status if printing failed - keep it as "pending"
          // The order will remain pending and can be retried later
        }
      }
    }
  });
