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
import app from "./firebaseConfig";

const auth = getAuth(app);

const PourPal = () => {
  const [employeeId, setEmployeeId] = useState("julien");
  const [password, setPassword] = useState("");
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

  return (
    <Framework7App>
      <View main>
        <Page pageContent={false}>
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
              <Toolbar bottom tabbar>
                <Link tabLink="#tab-1" tabLinkActive>
                  Tab 1
                </Link>
                <Link tabLink="#tab-2">
                  Tab 2
                </Link>
              </Toolbar>

              {/* Tabs */}
              <Tabs animated>
                <Tab id="tab-1" className="page-content" tabActive>
                  <Block strong>
                    <Order employeeId={employeeId} user={user} />
                  </Block>
                </Tab>

                <Tab id="tab-2" className="page-content">
                  <Block strong>Bop biip</Block>
                </Tab>
              </Tabs>
            </>
          )}
        </Page>
      </View>
    </Framework7App>
  );
};

export default PourPal;
