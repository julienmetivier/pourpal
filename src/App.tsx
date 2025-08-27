import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import {
  App as Framework7App,
  View,
  Page,
  Navbar,
  List,
  ListInput,
  Button,
} from "framework7-react";

import app from "./firebaseConfig";

const auth = getAuth(app);
const db = getFirestore(app);

const PourPal = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [drink, setDrink] = useState("");

  const login = async () => {
    await signInWithEmailAndPassword(auth, `${employeeId}@pourpal.com`, password);
  };

  const sendOrder = async () => {
    const docRef = await addDoc(collection(db, "orders"), {
      drink,
      employeeId,
      timestamp: Date.now(),
      status: "pending",
    });
    console.log("Order sent! Document ID:", docRef.id);
  };

  return (
    <Framework7App>
      <View main>
        <Page>
          <Navbar title="PourPal" />

          <List>
            <ListInput
              label="Employee ID"
              type="text"
              placeholder="Enter your Employee ID"
              value={employeeId}
              onInput={(e) => setEmployeeId((e.target as HTMLInputElement).value)}
            />
            <ListInput
              label="PIN"
              type="password"
              placeholder="Enter your PIN"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            />
          </List>

          <Button fill onClick={login}>
            Login
          </Button>

          <List>
            <ListInput
              label="Drink"
              type="text"
              placeholder="Enter your drink"
              value={drink}
              onInput={(e) => setDrink((e.target as HTMLInputElement).value)}
            />
          </List>

          <Button fill color="green" onClick={sendOrder}>
            Order
          </Button>
        </Page>
      </View>
    </Framework7App>
  );
};

export default PourPal;
