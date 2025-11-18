// App.tsx
import { useState, useEffect } from "react";
import {
  App as Framework7App,
  View,
  Page,
  Navbar,
  NavTitle,
  NavRight,
  List,
  ListInput,
  Toolbar,
  Tabs,
  Tab,
  Button,
  Block,
  Link,
} from "framework7-react";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import PinPad from "./PinPad";
import Order from "./container/Order";
import OrdersList from "./container/OrdersList";
import app from "./firebaseConfig";

const auth = getAuth(app);

const PourPal = () => {
  const [employeeId, setEmployeeId] = useState("julien");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<null | any>(null);
  const [activeTab, setActiveTab] = useState("tab-1");

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

          {/* Not logged in → login screen */}
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
                  onComplete={(pin) => setPassword(pin)}
                />
              </List>
              <Button fill onClick={login}>
                Login
              </Button>
            </Block>
          )}

          {/* Logged in → Order page */}
          {user && (
            <>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {activeTab === "tab-1" && (
                  <Block strong>
                    <Order employeeId={employeeId} user={user} />
                  </Block>
                )}
                {activeTab === "tab-2" && (
                  <OrdersList />
                )}
              </div>
              <Toolbar bottom tabbar style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
                <Link 
                  onClick={() => setActiveTab("tab-1")}
                  style={{ 
                    color: activeTab === "tab-1" ? '#007aff' : '#8e8e93',
                    fontWeight: activeTab === "tab-1" ? 'bold' : 'normal'
                  }}
                >
                  New Order
                </Link>
                <Link 
                  onClick={() => setActiveTab("tab-2")}
                  style={{ 
                    color: activeTab === "tab-2" ? '#007aff' : '#8e8e93',
                    fontWeight: activeTab === "tab-2" ? 'bold' : 'normal'
                  }}
                >
                  Orders
                </Link>
              </Toolbar>
            </>
          )}
        </Page>
      </View>
    </Framework7App>
  );
};

export default PourPal;
