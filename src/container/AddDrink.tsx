// AddDrink.tsx
import { useState, useEffect } from "react";
import { Block, List, ListItem, ListInput, Button, Badge } from "framework7-react";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import app from "../firebaseConfig";

const db = getFirestore(app);

const iconOptions = [
    { value: "beer-bottle", label: "🍺 Beer Bottle" },
    { value: "coupe", label: "🍸 Coupe" },
    { value: "highball", label: "🥃 Highball" },
  ];
  
  const categories = ["beer", "wine", "cocktail"];

type Drink = {
  id: string;
  name: string;
  icon: string;
  category: string;
  available: boolean;
};

const AddDrink: React.FC = () => {
  const [drinkName, setDrinkName] = useState("");
  const [icon, setIcon] = useState("beer-bottle");
  const [category, setCategory] = useState(categories[0]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [drinkToDelete, setDrinkToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    // Listen for real-time updates to drinks
    const unsubscribe = onSnapshot(collection(db, "drinks"), (snapshot) => {
      const drinksList: Drink[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Drink[];
      setDrinks(drinksList);
    });

    return () => unsubscribe();
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "beer-bottle":
        return "🍺";
      case "coupe":
        return "🍸";
      case "highball":
        return "🥃";
      default:
        return "🍹";
    }
  };

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

  const handleDeleteClick = (drinkId: string, drinkName: string) => {
    setDrinkToDelete({ id: drinkId, name: drinkName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!drinkToDelete) return;

    try {
      await deleteDoc(doc(db, "drinks", drinkToDelete.id));
      setNotification({
        message: `✅ Drink "${drinkToDelete.name}" deleted successfully!`,
        type: 'success'
      });
      setDeleteDialogOpen(false);
      setDrinkToDelete(null);
    } catch (error) {
      setNotification({
        message: '❌ Failed to delete drink. Please try again.',
        type: 'error'
      });
      console.error("Error deleting drink:", error);
      setDeleteDialogOpen(false);
      setDrinkToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setDrinkToDelete(null);
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

      {/* Existing Drinks List */}
      <Block strong style={{ marginTop: "24px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Existing Drinks</h2>
        
        {drinks.length > 0 ? (
          <List>
            {drinks.map((drink) => (
              <ListItem
                key={drink.id}
                title={drink.name}
                subtitle={`${drink.category.charAt(0).toUpperCase() + drink.category.slice(1)} • ${drink.available ? 'Available' : 'Unavailable'}`}
              >
                <div slot="media" style={{ fontSize: 24 }}>
                  {getIcon(drink.icon)}
                </div>
                <Button
                  slot="after"
                  small
                  color="red"
                  onClick={() => handleDeleteClick(drink.id, drink.name)}
                  style={{ marginLeft: "8px" }}
                >
                  Delete
                </Button>
              </ListItem>
            ))}
          </List>
        ) : (
          <Block style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
            <p>No drinks yet. Add your first drink above!</p>
          </Block>
        )}
      </Block>

      {/* Delete Confirmation Modal */}
      {deleteDialogOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={cancelDelete}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#fff' }}>
              Delete Drink
            </h3>
            <p style={{ marginBottom: '24px', color: '#aaa' }}>
              Are you sure you want to delete "{drinkToDelete?.name}"?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button
                outline
                onClick={cancelDelete}
                style={{ minWidth: '80px' }}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={confirmDelete}
                style={{ minWidth: '80px' }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddDrink;

