import { useState, useEffect } from "react";
import {
  App as Framework7App,
  View,
  Page,
  Navbar,
  List,
  ListInput,
  Button,
  Block,
  Badge,
  NavTitle,
  NavRight,
} from "framework7-react";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

import DrinksList from "./DrinksList";
import PinPad from "./PinPad";

import app from "./firebaseConfig";

const auth = getAuth(app);
const db = getFirestore(app);

const PourPal = () => {
  const [employeeId, setEmployeeId] = useState("julien");
  const [password, setPassword] = useState("");
  const [drink, setDrink] = useState("");
  const [clientName, setClientName] = useState("");
  const [user, setUser] = useState<null | any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        `${employeeId}@pourpal.com`,
        password
      );
    } catch (err) {
      alert("Login failed");
      console.error(err);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

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
    <Framework7App>
      <View main>
        <Page>
          <Navbar>
            <NavTitle>PourPal</NavTitle>
            {user && (
              <NavRight>
                <div className="grid grid-cols-2 grid-gap display-flex align-items-center">
                  <div>
                    <h4>{employeeId}</h4>
                  </div>
                  <div>
                    <Button small outline onClick={logout}>
                      Logout
                    </Button>
                  </div>
                </div>
              </NavRight>
            )}
          </Navbar>

          {/* Not logged in → show login screen */}
          {!user && (
            <Block strong>
              <List>
                <ListInput
                  label="Employee"
                  type="select"
                  value={employeeId}
                  onInput={(e) =>
                    setEmployeeId((e.target as HTMLSelectElement).value)
                  }
                >
                  <option value="julien">julien</option>
                </ListInput>
                <PinPad
                  length={6}
                  onChange={(pin) => setPassword(pin)}
                  onComplete={(pin) => {
                    setPassword(pin);
                    // optionally auto-attempt login here:
                    // login();
                  }}
                />
              </List>
              <Button fill onClick={login}>
                Login
              </Button>
            </Block>
          )}

          {/* Logged in → show drinks + client name + order */}
          {user && (
            <Block strong>
              <DrinksList
                selectedDrink={drink}
                onChange={(selected) => setDrink(selected)}
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
          )}
        </Page>
      </View>
    </Framework7App>
  );
};

export default PourPal;
