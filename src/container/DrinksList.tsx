import React, { useEffect, useState } from "react";
import { Block, List, ListItem, Badge } from "framework7-react";
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
      setDrinks(drinkList);
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
      <Block strong>
        <p>Select from available drinks below:</p>
      </Block>

      <List mediaList>
  {drinks.map((drink) => {
    const isSelected = drink.name === selectedDrink;
    return (
      <ListItem
        key={drink.id}
        title={drink.name}
        className={!drink.available ? "opacity-50" : ""}
        style={{
          boxShadow: isSelected ? "0 0 0 2px darkgreen inset" : "none",
          borderRadius: "12px",
        }}
        disabled={!drink.available}
        onClick={() => drink.available && onChange(drink.name)}
      >
        <div slot="media" style={{ fontSize: 24 }}>
          {getIcon(drink.icon)}
        </div>
        <span slot="after">
          {drink.available ? (
            <Badge color="green">
              Available
            </Badge>
          ) : (
            <Badge color="gray">Out</Badge>
          )}
        </span>
      </ListItem>
    );
  })}
</List>
    </div>
  );
};

export default DrinksList;