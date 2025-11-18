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
      <Block strong>
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

      <List>
        <ListInput
          label="Client Name"
          type="text"
          placeholder="Enter client name"
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
      >
        Place Order
      </Button>
    </Block>
    </>
  );
};

export default Order;
