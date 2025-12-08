// Order.tsx
import { useState, useEffect } from "react";
import { Block, List, ListInput, Button } from "framework7-react";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import DrinksList from "./DrinksList";
import app from "../firebaseConfig";

const db = getFirestore(app);

type OrderProps = {
  employeeId: string;
  user: any;
};

const Order: React.FC<OrderProps> = ({ employeeId, user }) => {
  const [drink, setDrink] = useState("");
  const [clientName, setClientName] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const sendOrder = async () => {
    if (!user) {
      alert("You must be logged in to place an order.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "orders"), {
        drink,
        clientName,
        employeeId,
        timestamp: Date.now(),
        status: "pending",
        uid: user.uid,
      });

      const orderDrink = drink;
      const orderClient = clientName;

      console.log("Order sent! Document ID:", docRef.id);
      setDrink("");
      setClientName("");

      setNotification({
        message: `✅ Order placed: ${orderDrink} for ${orderClient}`,
        type: 'success'
      });
    } catch (error) {
      setNotification({
        message: '❌ Failed to place order. Please try again.',
        type: 'error'
      });
      console.error("Error placing order:", error);
    }
  };

  return (
    <>
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: notification.type === 'success' ? '#4CAF50' : '#f44336',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            zIndex: 10000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            fontSize: '16px',
            textAlign: 'center',
            minWidth: '250px',
          }}
        >
          {notification.message}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '140px' }}>
        <Block strong>
          <h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "24px", fontWeight: "600" }}>
            New Order
          </h2>
          
          <div style={{ marginBottom: "24px" }}>
            <DrinksList
              selectedDrink={drink}
              onChange={(selected) => {
                if (selected === drink) {
                  setDrink("");
                  return;
                }
                setDrink(selected);
              }}
            />
          </div>
        </Block>

        {/* Sticky form at bottom */}
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + 16px)', // Above the toolbar with safe area + spacing
            left: '16px',
            right: '16px',
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            padding: '20px',
            borderRadius: '20px',
            zIndex: 1000,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <List style={{ margin: 0 }}>
              <ListInput
                type="text"
                placeholder="Enter name for order"
                value={clientName}
                onInput={(e) =>
                  setClientName((e.target as HTMLInputElement).value)
                }
              />
            </List>

            <Button
              fill
              color="green"
              disabled={!drink || !clientName}
              onClick={sendOrder}
              style={{ fontSize: "16px", fontWeight: "600", padding: "14px", margin: 0 }}
            >
              Place Order
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Order;
