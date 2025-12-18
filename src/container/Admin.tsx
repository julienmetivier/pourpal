// Admin.tsx
import { useState, useEffect } from "react";
import { Block, List, ListItem, ListInput, Button, Badge } from "framework7-react";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  updateDoc,
  query,
  where
} from "firebase/firestore";
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
  ingredients?: string[]; // Array of ingredient document IDs
};

type Ingredient = {
  id: string;
  name: string;
  available: boolean;
};

const Admin: React.FC = () => {
  const [drinkName, setDrinkName] = useState("");
  const [icon, setIcon] = useState("beer-bottle");
  const [category, setCategory] = useState(categories[0]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientName, setIngredientName] = useState("");
  const [barOpen, setBarOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [drinkToDelete, setDrinkToDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ 
    type: 'toggleBar' | 'rejectOrders' | 'toggleIngredient' | null;
    message: string;
    data?: any;
  }>({ type: null, message: '' });

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

  // Listen for drinks
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "drinks"), (snapshot) => {
      const drinksList: Drink[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Drink[];
      setDrinks(drinksList);
    });

    return () => unsubscribe();
  }, []);

  // Listen for ingredients
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "ingredients"), (snapshot) => {
      const ingredientsList: Ingredient[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Ingredient[];
      setIngredients(ingredientsList.sort((a, b) => a.name.localeCompare(b.name)));
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

  const handleToggleBar = async () => {
    try {
      const settingsRef = doc(db, "settings", "julien_bar");
      await updateDoc(settingsRef, {
        isBarOpen: !barOpen,
      });
      setNotification({
        message: `✅ Bar ${!barOpen ? 'opened' : 'closed'} successfully!`,
        type: 'success'
      });
      setConfirmDialog({ type: null, message: '' });
    } catch (error) {
      setNotification({
        message: '❌ Failed to update bar status. Please try again.',
        type: 'error'
      });
      console.error("Error updating bar status:", error);
      setConfirmDialog({ type: null, message: '' });
    }
  };

  const handleRejectAllOrders = async () => {
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("status", "==", "pending"));
      const snapshot = await getDocs(q);
      
      const updatePromises = snapshot.docs.map((orderDoc) =>
        updateDoc(doc(db, "orders", orderDoc.id), {
          status: "rejected",
        })
      );

      await Promise.all(updatePromises);
      
      setNotification({
        message: `✅ ${snapshot.docs.length} order(s) rejected successfully!`,
        type: 'success'
      });
      setConfirmDialog({ type: null, message: '' });
    } catch (error) {
      setNotification({
        message: '❌ Failed to reject orders. Please try again.',
        type: 'error'
      });
      console.error("Error rejecting orders:", error);
      setConfirmDialog({ type: null, message: '' });
    }
  };

  const showToggleBarConfirmation = async () => {
    const action = barOpen ? 'close' : 'open';
    setConfirmDialog({
      type: 'toggleBar',
      message: `Are you sure you want to ${action} the bar? ${action === 'close' ? 'This will prevent new orders from being placed.' : 'This will allow new orders to be placed.'}`
    });
  };

  const showRejectOrdersConfirmation = async () => {
    // First check how many pending orders exist
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("status", "==", "pending"));
    const snapshot = await getDocs(q);
    const count = snapshot.docs.length;

    if (count === 0) {
      setNotification({
        message: 'ℹ️ No pending orders to reject.',
        type: 'error'
      });
      return;
    }

    setConfirmDialog({
      type: 'rejectOrders',
      message: `Are you sure you want to reject all ${count} pending order(s)? This action cannot be undone.`
    });
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
      const drinkData: any = {
        name: drinkName.trim(),
        icon: icon,
        category: category,
        available: true,
      };

      // Only add ingredients if it's a cocktail
      if (category === "cocktail" && selectedIngredients.length > 0) {
        drinkData.ingredients = selectedIngredients;
      }

      await addDoc(collection(db, "drinks"), drinkData);

      setNotification({
        message: `✅ Drink "${drinkName}" added successfully!`,
        type: 'success'
      });

      setDrinkName("");
      setIcon("beer-bottle");
      setCategory(categories[0]);
      setSelectedIngredients([]);
    } catch (error) {
      setNotification({
        message: '❌ Failed to add drink. Please try again.',
        type: 'error'
      });
      console.error("Error adding drink:", error);
    }
  };

  const handleAddIngredient = async () => {
    if (!ingredientName.trim()) {
      setNotification({
        message: '❌ Please enter an ingredient name',
        type: 'error'
      });
      return;
    }

    try {
      await addDoc(collection(db, "ingredients"), {
        name: ingredientName.trim(),
        available: true,
        createdAt: Date.now(),
      });

      setNotification({
        message: `✅ Ingredient "${ingredientName}" added successfully!`,
        type: 'success'
      });

      setIngredientName("");
    } catch (error) {
      setNotification({
        message: '❌ Failed to add ingredient. Please try again.',
        type: 'error'
      });
      console.error("Error adding ingredient:", error);
    }
  };

  const handleToggleIngredientAvailability = async (ingredientId: string, ingredientName: string, currentAvailability: boolean) => {
    // Find all cocktails that use this ingredient
    const affectedDrinks = drinks.filter(
      drink => drink.category === "cocktail" && 
      drink.ingredients && 
      drink.ingredients.includes(ingredientId)
    );

    // Show confirmation if there are affected drinks
    if (affectedDrinks.length > 0) {
      const action = currentAvailability ? "unavailable" : "available";
      const actionVerb = currentAvailability ? "mark" : "reactivate";
      
      setConfirmDialog({
        type: 'toggleIngredient',
        message: `${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)}ing "${ingredientName}" as ${action} will also ${actionVerb} ${affectedDrinks.length} cocktail(s). Continue?`,
        data: { ingredientId, ingredientName, currentAvailability, affectedDrinks }
      });
      return;
    }

    // If no affected drinks, proceed directly
    await updateIngredientAndDrinks(ingredientId, !currentAvailability);
  };

  const updateIngredientAndDrinks = async (ingredientId: string, newAvailability: boolean) => {
    try {
      // Update ingredient availability
      await updateDoc(doc(db, "ingredients", ingredientId), {
        available: newAvailability,
      });

      // Find all cocktails that use this ingredient
      const affectedDrinks = drinks.filter(
        drink => drink.category === "cocktail" && 
        drink.ingredients && 
        drink.ingredients.includes(ingredientId)
      );

      if (affectedDrinks.length > 0) {
        // Update all affected cocktails
        const updatePromises = affectedDrinks.map(drink =>
          updateDoc(doc(db, "drinks", drink.id), {
            available: newAvailability,
          })
        );

        await Promise.all(updatePromises);

        if (newAvailability) {
          setNotification({
            message: `✅ Ingredient updated. ${affectedDrinks.length} cocktail(s) marked as available.`,
            type: 'success'
          });
        } else {
          setNotification({
            message: `✅ Ingredient updated. ${affectedDrinks.length} cocktail(s) marked as unavailable.`,
            type: 'success'
          });
        }
      } else {
        setNotification({
          message: `✅ Ingredient "${confirmDialog.data?.ingredientName || 'ingredient'}" updated successfully!`,
          type: 'success'
        });
      }

      setConfirmDialog({ type: null, message: '' });
    } catch (error) {
      setNotification({
        message: '❌ Failed to update ingredient. Please try again.',
        type: 'error'
      });
      console.error("Error updating ingredient:", error);
      setConfirmDialog({ type: null, message: '' });
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

  const handleToggleAvailability = async (drinkId: string, currentAvailability: boolean) => {
    try {
      await updateDoc(doc(db, "drinks", drinkId), {
        available: !currentAvailability,
      });
    } catch (error) {
      setNotification({
        message: '❌ Failed to update availability. Please try again.',
        type: 'error'
      });
      console.error("Error updating drink availability:", error);
    }
  };

  const confirmAction = () => {
    if (confirmDialog.type === 'toggleBar') {
      handleToggleBar();
    } else if (confirmDialog.type === 'rejectOrders') {
      handleRejectAllOrders();
    } else if (confirmDialog.type === 'toggleIngredient') {
      const { ingredientId, currentAvailability } = confirmDialog.data;
      updateIngredientAndDrinks(ingredientId, !currentAvailability);
    }
  };

  const cancelAction = () => {
    setConfirmDialog({ type: null, message: '' });
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

      {/* Admin Controls Section */}
      <Block strong>
        <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "24px", fontWeight: "600" }}>
          Admin Controls
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Bar Status Toggle */}
          <div style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Bar Status</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#aaa' }}>
                  {barOpen ? 'Bar is currently open' : 'Bar is currently closed'}
                </p>
              </div>
              <Badge color={barOpen ? 'green' : 'red'} style={{ fontSize: '14px', padding: '6px 12px' }}>
                {barOpen ? 'OPEN' : 'CLOSED'}
              </Badge>
            </div>
            <Button
              fill
              color={barOpen ? 'red' : 'green'}
              onClick={showToggleBarConfirmation}
              style={{ fontSize: "16px", fontWeight: "600", padding: "14px" }}
            >
              {barOpen ? 'Close Bar' : 'Open Bar'}
            </Button>
          </div>

          {/* Reject All Orders */}
          <div style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Order Management</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#aaa' }}>
                Reject all pending orders (useful for clearing test orders)
              </p>
            </div>
            <Button
              fill
              color="orange"
              onClick={showRejectOrdersConfirmation}
              style={{ fontSize: "16px", fontWeight: "600", padding: "14px" }}
            >
              Reject All Pending Orders
            </Button>
          </div>
        </div>
      </Block>

      {/* Add Drink Section */}
      <Block strong style={{ marginTop: "24px" }}>
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
            onInput={(e) => {
              const newCategory = (e.target as HTMLSelectElement).value;
              setCategory(newCategory);
              // Clear ingredients if switching away from cocktail
              if (newCategory !== "cocktail") {
                setSelectedIngredients([]);
              }
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </ListInput>

          {category === "cocktail" && (
            <div style={{ padding: "16px 0" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "12px", 
                fontSize: "14px", 
                color: "#aaa",
                fontWeight: "500"
              }}>
                Ingredients (select all that apply):
              </label>
              {ingredients.length === 0 ? (
                <p style={{ color: "#666", fontSize: "14px", fontStyle: "italic" }}>
                  No ingredients available. Add ingredients below first.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {ingredients.map((ingredient) => (
                    <label
                      key={ingredient.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIngredients.includes(ingredient.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIngredients([...selectedIngredients, ingredient.id]);
                          } else {
                            setSelectedIngredients(selectedIngredients.filter(id => id !== ingredient.id));
                          }
                        }}
                        style={{ marginRight: "12px", width: "18px", height: "18px" }}
                      />
                      <span style={{ flex: 1 }}>{ingredient.name.charAt(0).toUpperCase() + ingredient.name.slice(1)}</span>
                      <Badge color={ingredient.available ? "green" : "red"} style={{ fontSize: "12px" }}>
                        {ingredient.available ? "Available" : "Out"}
                      </Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
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
          <List style={{ listStyle: 'none', padding: 0 }}>
            {drinks.map((drink) => (
              <div key={drink.id} style={{ marginBottom: "16px" }}>
                <ListItem
                  title={drink.name}
                  subtitle={`${drink.category.charAt(0).toUpperCase() + drink.category.slice(1)} - ${drink.available ? 'Available' : 'Unavailable'}`}
                  style={{
                    borderRadius: "12px",
                    marginBottom: 0,
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    padding: "16px",
                  }}
                >
                <div slot="media" style={{ fontSize: 24 }}>
                  {getIcon(drink.icon)}
                </div>
                <div slot="after" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: drink.available ? '#4CAF50' : '#999' }}>
                      {drink.available ? 'Available' : 'Unavailable'}
                    </span>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleToggleAvailability(drink.id, drink.available);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      style={{
                        width: '50px',
                        height: '28px',
                        borderRadius: '14px',
                        backgroundColor: drink.available ? '#4CAF50' : '#666',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease',
                        padding: '2px',
                        boxSizing: 'border-box',
                        flexShrink: 0,
                        userSelect: 'none',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          position: 'absolute',
                          top: '2px',
                          left: drink.available ? '24px' : '2px',
                          transition: 'left 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    small
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(drink.id, drink.name);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </ListItem>
              </div>
            ))}
          </List>
        ) : (
          <Block style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
            <p>No drinks yet. Add your first drink above!</p>
          </Block>
        )}
      </Block>

      {/* Ingredients Management Section */}
      <Block strong style={{ marginTop: "24px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Manage Ingredients</h2>
        
        {/* Add Ingredient Form */}
        <div style={{ marginBottom: "24px" }}>
          <List>
            <ListInput
              label="Ingredient Name"
              type="text"
              placeholder="Enter ingredient name (e.g., tequila)"
              value={ingredientName}
              onInput={(e) => setIngredientName((e.target as HTMLInputElement).value)}
            />
          </List>
          <Button
            fill
            color="blue"
            disabled={!ingredientName.trim()}
            onClick={handleAddIngredient}
            style={{ marginTop: "16px" }}
          >
            Add Ingredient
          </Button>
        </div>

        {/* Ingredients List */}
        {ingredients.length > 0 ? (
          <List style={{ listStyle: 'none', padding: 0 }}>
            {ingredients.map((ingredient) => (
              <div key={ingredient.id} style={{ marginBottom: "12px" }}>
                <ListItem
                  title={ingredient.name.charAt(0).toUpperCase() + ingredient.name.slice(1)}
                  style={{
                    borderRadius: "12px",
                    marginBottom: 0,
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    padding: "16px",
                  }}
                >
                  <div slot="after" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Badge color={ingredient.available ? 'green' : 'red'} style={{ fontSize: '14px', padding: '6px 12px' }}>
                      {ingredient.available ? 'Available' : 'Out'}
                    </Badge>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleToggleIngredientAvailability(ingredient.id, ingredient.name, ingredient.available);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      style={{
                        width: '50px',
                        height: '28px',
                        borderRadius: '14px',
                        backgroundColor: ingredient.available ? '#4CAF50' : '#666',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease',
                        padding: '2px',
                        boxSizing: 'border-box',
                        flexShrink: 0,
                        userSelect: 'none',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          position: 'absolute',
                          top: '2px',
                          left: ingredient.available ? '24px' : '2px',
                          transition: 'left 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      />
                    </div>
                  </div>
                </ListItem>
              </div>
            ))}
          </List>
        ) : (
          <Block style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
            <p>No ingredients yet. Add your first ingredient above!</p>
          </Block>
        )}
      </Block>

      {/* Confirmation Dialog for Admin Actions */}
      {confirmDialog.type && (
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
          onClick={cancelAction}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#fff' }}>
              Confirm Action
            </h3>
            <p style={{ marginBottom: '24px', color: '#aaa', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
              {confirmDialog.message}
            </p>
            {confirmDialog.type === 'toggleIngredient' && confirmDialog.data?.affectedDrinks && (
              <div style={{ 
                marginBottom: '24px', 
                padding: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                  Affected cocktails:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#aaa' }}>
                  {confirmDialog.data.affectedDrinks.map((drink: Drink) => (
                    <li key={drink.id} style={{ marginBottom: '4px' }}>{drink.name}</li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button
                outline
                onClick={cancelAction}
                style={{ minWidth: '80px' }}
              >
                Cancel
              </Button>
              <Button
                color={
                  confirmDialog.type === 'toggleBar' 
                    ? (barOpen ? 'red' : 'green') 
                    : confirmDialog.type === 'toggleIngredient'
                    ? 'orange'
                    : 'orange'
                }
                onClick={confirmAction}
                style={{ minWidth: '80px' }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

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

export default Admin;

