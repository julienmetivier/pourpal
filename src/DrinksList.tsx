import React, { useEffect, useState } from "react";
import { Page, Navbar, Block, List, ListItem, Icon, Badge } from "framework7-react";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import app from "./firebaseConfig";

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
        media={getIcon(drink.icon)}
        className={[
          !drink.available ? "opacity-50" : "",
          isSelected ? "bg-color-green text-color-white" : "",
        ].join(" ")}
        disabled={!drink.available}
        onClick={() => drink.available && onChange(drink.name)}
      >
        <span slot="after">
          {drink.available ? (
            <Badge color={isSelected ? "white" : "green"}>
              {isSelected ? "Selected" : "Available"}
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