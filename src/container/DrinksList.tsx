import React, { useEffect, useMemo, useState } from "react";
import { List, ListItem, Badge } from "framework7-react";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import app from "../firebaseConfig";
import DrinksCardsCarousel, { DrinkForCarousel } from "../components/DrinksCardsCarousel";

const db = getFirestore(app);

type Drink = {
  id: string;
  name: string;
  available: boolean;
  icon: string;
  category?: string;
  imageUrl?: string;
  ingredients?: string[];
};

type Ingredient = {
  id: string;
  name: string;
};

type ViewMode = "list" | "cards";

type DrinksListProps = {
  selectedDrink: string;
  selectedCategory?: string | null;
  onChange: (drinkName: string) => void;
};

const DrinksList: React.FC<DrinksListProps> = ({ selectedDrink, selectedCategory, onChange }) => {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  useEffect(() => {
    const fetchData = async () => {
      const [drinksSnapshot, ingredientsSnapshot] = await Promise.all([
        getDocs(collection(db, "drinks")),
        getDocs(collection(db, "ingredients")),
      ]);

      let drinkList: Drink[] = drinksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Drink[];

      const ingredientList: Ingredient[] = ingredientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: (doc.data().name as string) || "",
      }));

      if (selectedCategory) {
        drinkList = drinkList.filter((drink) => drink.category === selectedCategory);
      }

      const sortedDrinks = drinkList.sort((a, b) => {
        if (a.available === b.available) return 0;
        return a.available ? -1 : 1;
      });

      setDrinks(sortedDrinks);
      setIngredients(ingredientList);
    };

    fetchData();
  }, [selectedCategory]);

  const ingredientNameById = useMemo(() => {
    const map = new Map<string, string>();
    ingredients.forEach((ing) => map.set(ing.id, ing.name));
    return map;
  }, [ingredients]);

  const drinksForCarousel: DrinkForCarousel[] = useMemo(
    () =>
      drinks.map((drink) => ({
        id: drink.id,
        name: drink.name,
        available: drink.available,
        icon: drink.icon,
        imageUrl: drink.imageUrl,
        category: drink.category,
        ingredientNames: (drink.ingredients ?? [])
          .map((id) => ingredientNameById.get(id))
          .filter((name): name is string => Boolean(name))
          .map((name) => name.charAt(0).toUpperCase() + name.slice(1)),
      })),
    [drinks, ingredientNameById]
  );

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

  const emptyMessage = selectedCategory
    ? `No drinks available for ${selectedCategory} category`
    : "No drinks available";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <p style={{ margin: 0, fontSize: "15px", color: "#aaa", fontWeight: "400", flex: 1, minWidth: "140px" }}>
          {viewMode === "list"
            ? "Select from available drinks below:"
            : "Swipe to browse drinks — tap to select:"}
        </p>

        <div
          role="group"
          aria-label="Drink display mode"
          style={{
            display: "flex",
            padding: "4px",
            borderRadius: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            flexShrink: 0,
          }}
        >
          {(
            [
              { id: "list" as const, label: "List" },
              { id: "cards" as const, label: "Cards" },
            ] as const
          ).map(({ id, label }) => {
            const isActive = viewMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id)}
                style={{
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: isActive ? "600" : "400",
                  cursor: "pointer",
                  backgroundColor: isActive ? "rgba(76, 175, 80, 0.35)" : "transparent",
                  color: isActive ? "#fff" : "#888",
                  transition: "background-color 0.2s ease, color 0.2s ease",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {drinks.length === 0 ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#666",
            borderRadius: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <p style={{ margin: 0, fontSize: "16px", fontWeight: "500" }}>{emptyMessage}</p>
        </div>
      ) : viewMode === "cards" ? (
        <DrinksCardsCarousel
          drinks={drinksForCarousel}
          selectedDrink={selectedDrink}
          onChange={onChange}
        />
      ) : (
        <List mediaList style={{ listStyle: "none" }}>
          {drinks.map((drink) => {
            const isSelected = drink.name === selectedDrink;
            return (
              <div key={drink.id} style={{ marginBottom: "12px" }}>
                <ListItem
                  title={drink.name}
                  className={!drink.available ? "opacity-50" : ""}
                  style={{
                    boxShadow: isSelected
                      ? "0 0 0 2px #4CAF50 inset"
                      : "0 2px 6px rgba(0,0,0,0.2)",
                    borderRadius: "12px",
                    padding: "16px",
                    backgroundColor: isSelected
                      ? "rgba(76, 175, 80, 0.15)"
                      : "rgba(255, 255, 255, 0.05)",
                    border: isSelected
                      ? "1px solid rgba(76, 175, 80, 0.3)"
                      : "1px solid rgba(255, 255, 255, 0.1)",
                    transition: "all 0.2s ease",
                    marginBottom: 0,
                  }}
                  disabled={!drink.available}
                  onClick={() => drink.available && onChange(drink.name)}
                >
                  <div slot="media" style={{ fontSize: 28, marginRight: "12px" }}>
                    {getIcon(drink.icon)}
                  </div>
                  <span slot="after">
                    {drink.available ? (
                      <Badge color="green" style={{ fontWeight: "600" }}>
                        Available
                      </Badge>
                    ) : (
                      <Badge color="gray" style={{ fontWeight: "600" }}>
                        Out
                      </Badge>
                    )}
                  </span>
                </ListItem>
              </div>
            );
          })}
        </List>
      )}
    </div>
  );
};

export default DrinksList;
