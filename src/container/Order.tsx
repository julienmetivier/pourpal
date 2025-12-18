// Order.tsx
import { useState, useEffect } from "react";
import { Block, List, ListInput, Button } from "framework7-react";
import { getFirestore, collection, addDoc, doc, onSnapshot } from "firebase/firestore";
import DrinksList from "./DrinksList";
import Notification from "../components/Notification";
import app from "../firebaseConfig";

const db = getFirestore(app);

type OrderProps = {
  employeeId: string;
  user: any;
};

const Order: React.FC<OrderProps> = ({ employeeId, user }) => {
  const [drink, setDrink] = useState("");
  const [clientName, setClientName] = useState("");
  const [barOpen, setBarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const categories = ["beer", "wine", "cocktail"];

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Listen for bar status
  useEffect(() => {
    const settingsRef = doc(db, "settings", "julien_bar");
    
    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setBarOpen(data?.isBarOpen === true);
        } else {
          setBarOpen(false);
        }
      },
      (error) => {
        console.error("Error listening to bar status:", error);
        setBarOpen(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const sendOrder = async () => {
    if (!user) {
      alert("You must be logged in to place an order.");
      return;
    }

    if (!barOpen) {
      setNotification({
        message: '❌ Bar is currently closed. Orders cannot be placed.',
        type: 'error'
      });
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
        <Notification message={notification.message} type={notification.type} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '140px' }}>
        <Block strong>
          <h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "24px", fontWeight: "600" }}>
            New Order
          </h2>
          
          {!barOpen && (
            <div style={{
              padding: '16px',
              marginBottom: '20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(244, 67, 54, 0.2)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              color: '#f44336',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              ⚠️ Bar is currently closed. Orders cannot be placed.
            </div>
          )}
          
          {/* Category Filter */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <Button
                small
                outline={selectedCategory !== null}
                fill={selectedCategory === null}
                onClick={() => setSelectedCategory(null)}
                style={{
                  borderRadius: '16px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  textTransform: 'capitalize'
                }}
              >
                All
              </Button>
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <Button
                    key={category}
                    small
                    outline={!isSelected}
                    fill={isSelected}
                    onClick={() => setSelectedCategory(category)}
                    style={{
                      borderRadius: '16px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      textTransform: 'capitalize'
                    }}
                  >
                    {category}
                  </Button>
                );
              })}
            </div>
          </div>
          
          <div style={{ marginBottom: "24px" }}>
            <DrinksList
              selectedDrink={drink}
              selectedCategory={selectedCategory}
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
              disabled={!drink || !clientName || !barOpen}
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
