// Order.tsx
import { useState } from "react";
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

  const sendOrder = async () => {
    if (!user) {
      alert("You must be logged in to place an order.");
      return;
    }

    const docRef = await addDoc(collection(db, "orders"), {
      drink,
      clientName,
      employeeId,
      timestamp: Date.now(),
      status: "pending",
      uid: user.uid,
    });

    console.log("Order sent! Document ID:", docRef.id);
    setDrink("");
    setClientName("");
  };

  return (
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
  );
};

export default Order;
