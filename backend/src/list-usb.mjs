import escpos from "escpos";
import escposUSB from "escpos-usb";

escpos.USB = escposUSB;

const devices = escpos.USB.findPrinter();

console.log("Detected USB devices:", devices);