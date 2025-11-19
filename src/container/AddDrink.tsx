// AddDrink.tsx
import { useState, useEffect } from "react";
import { Block, List, ListInput, Button } from "framework7-react";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import app from "../firebaseConfig";

const db = getFirestore(app);

const iconOptions = [
    { value: "beer-bottle", label: "🍺 Beer Bottle" },
    { value: "coupe", label: "🍸 Coupe" },
    { value: "highball", label: "🥃 Highball" },
  ];
  
  const categories = ["beer", "wine", "cocktail"];

const AddDrink: React.FC = () => {
  const [drinkName, setDrinkName] = useState("");
  const [icon, setIcon] = useState("beer-bottle");
  const [category, setCategory] = useState(categories[0]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSubmit = async () => {
    if (!drinkName.trim()) {
      setNotification({
        message: '❌ Please enter a drink name',
        type: 'error'
      });
      return;
    }

    try {
      await addDoc(collection(db, "drinks"), {
        name: drinkName.trim(),
        icon: icon,
        category: category,
        available: true,
      });

      setNotification({
        message: `✅ Drink "${drinkName}" added successfully!`,
        type: 'success'
      });

      // Clear form
      setDrinkName("");
      setIcon("beer-bottle");
      setCategory(categories[0]);
    } catch (error) {
      setNotification({
        message: '❌ Failed to add drink. Please try again.',
        type: 'error'
      });
      console.error("Error adding drink:", error);
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
        <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Add New Drink</h2>
        
        <List>
          <ListInput
            label="Drink Name"
            type="text"
            placeholder="Enter drink name"
            value={drinkName}
            onInput={(e) => setDrinkName((e.target as HTMLInputElement).value)}
          />

          <ListInput
            label="Icon"
            type="select"
            value={icon}
            onInput={(e) => setIcon((e.target as HTMLSelectElement).value)}
          >
            {iconOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </ListInput>

          <ListInput
            label="Category"
            type="select"
            value={category}
            onInput={(e) => setCategory((e.target as HTMLSelectElement).value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </ListInput>
        </List>

        <Button
          fill
          color="green"
          disabled={!drinkName.trim()}
          onClick={handleSubmit}
          style={{ marginTop: "16px" }}
        >
          Add Drink
        </Button>
      </Block>
    </>
  );
};

export default AddDrink;

