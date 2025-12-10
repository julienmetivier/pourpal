import React, { useEffect, useState } from "react";
import { List, ListItem, Badge } from "framework7-react";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import app from "../firebaseConfig";

const db = getFirestore(app);

type Drink = {
  id: string;
  name: string;
  available: boolean;
  icon: string;
  category?: string;
};

type DrinksListProps = {
  selectedDrink: string;
  onChange: (drinkName: string) => void;
};

const DrinksList: React.FC<DrinksListProps> = ({ selectedDrink, onChange }) => {
  const [drinks, setDrinks] = useState<Drink[]>([]);

  useEffect(() => {
    const fetchDrinks = async () => {
      const querySnapshot = await getDocs(collection(db, "drinks"));
      const drinkList: Drink[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Drink[];
      
      // Sort drinks: available first, unavailable last
      const sortedDrinks = drinkList.sort((a, b) => {
        if (a.available === b.available) return 0;
        return a.available ? -1 : 1;
      });
      
      setDrinks(sortedDrinks);
    };

    fetchDrinks();
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

  return (
    <div>
      <p style={{ marginBottom: "16px", fontSize: "15px", color: "#aaa", fontWeight: "400" }}>
        Select from available drinks below:
      </p>

      <List mediaList style={{ listStyle: 'none' }}>
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
                    <Badge color="gray" style={{ fontWeight: "600" }}>Out</Badge>
                  )}
                </span>
              </ListItem>
            </div>
          );
        })}
      </List>
    </div>
  );
};

export default DrinksList;