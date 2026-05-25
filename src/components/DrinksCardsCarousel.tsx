import React, { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "framework7-react";

export type DrinkForCarousel = {
  id: string;
  name: string;
  available: boolean;
  icon: string;
  imageUrl?: string;
  category?: string;
  ingredientNames: string[];
};

type DrinksCardsCarouselProps = {
  drinks: DrinkForCarousel[];
  selectedDrink: string;
  onChange: (drinkName: string) => void;
};

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

const DrinksCardsCarousel: React.FC<DrinksCardsCarouselProps> = ({
  drinks,
  selectedDrink,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRaf = useRef<number | null>(null);
  const isProgrammaticScroll = useRef(false);

  const updateActiveIndexFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || drinks.length === 0) return;

    const trackRect = track.getBoundingClientRect();
    const centerX = trackRect.left + trackRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    Array.from(track.children).forEach((child, index) => {
      const rect = (child as HTMLElement).getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - centerX);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);

    if (isProgrammaticScroll.current) return;

    const drink = drinks[closestIndex];
    if (drink?.available && drink.name !== selectedDrink) {
      onChange(drink.name);
    }
  }, [drinks, selectedDrink, onChange]);

  const scrollToIndex = useCallback((index: number, smooth = true) => {
    const track = trackRef.current;
    if (!track) return;
    isProgrammaticScroll.current = true;
    const child = track.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      inline: "center",
      block: "nearest",
    });
    const releaseMs = smooth ? 400 : 50;
    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, releaseMs);
  }, []);

  useEffect(() => {
    if (drinks.length === 0 || !selectedDrink) return;

    const index = drinks.findIndex((d) => d.name === selectedDrink);
    if (index < 0) return;

    setActiveIndex(index);
    isProgrammaticScroll.current = true;
    scrollToIndex(index, false);
    requestAnimationFrame(() => {
      isProgrammaticScroll.current = false;
    });
  }, [drinks, selectedDrink, scrollToIndex]);

  const handleScroll = () => {
    if (scrollRaf.current !== null) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(updateActiveIndexFromScroll);
  };

  const handleCardClick = (drink: DrinkForCarousel, index: number) => {
    if (!drink.available) return;
    if (index !== activeIndex) {
      scrollToIndex(index);
      return;
    }
    onChange(drink.name === selectedDrink ? "" : drink.name);
  };

  if (drinks.length === 0) return null;

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: "8px calc(14% - 6px) 16px",
          margin: "0 -4px",
        }}
        className="drinks-cards-track"
      >
        {drinks.map((drink, index) => {
          const isCenter = index === activeIndex;
          const isSelected = drink.name === selectedDrink;
          const showIngredients = drink.ingredientNames.slice(0, 4);
          const moreIngredients =
            drink.ingredientNames.length - showIngredients.length;

          return (
            <div
              key={drink.id}
              role="button"
              tabIndex={drink.available ? 0 : -1}
              onClick={() => handleCardClick(drink, index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(drink, index);
                }
              }}
              style={{
                flex: "0 0 72%",
                scrollSnapAlign: "center",
                scrollSnapStop: "always",
                transform: isCenter ? "scale(1)" : "scale(0.88)",
                opacity: drink.available ? (isCenter ? 1 : 0.65) : 0.45,
                transition: "transform 0.25s ease, opacity 0.25s ease",
                cursor: drink.available ? "pointer" : "not-allowed",
              }}
            >
              <div
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  backgroundColor: isSelected
                    ? "rgba(76, 175, 80, 0.12)"
                    : "rgba(255, 255, 255, 0.05)",
                  border: isSelected
                    ? "2px solid rgba(76, 175, 80, 0.5)"
                    : "1px solid rgba(255, 255, 255, 0.12)",
                  boxShadow: isCenter
                    ? "0 8px 24px rgba(0, 0, 0, 0.35)"
                    : "0 2px 8px rgba(0, 0, 0, 0.2)",
                  minHeight: "280px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    height: "140px",
                    backgroundColor: "rgba(0, 0, 0, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {drink.imageUrl ? (
                    <img
                      src={drink.imageUrl}
                      alt={drink.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "56px", lineHeight: 1 }}>
                      {getIcon(drink.icon)}
                    </span>
                  )}
                </div>

                <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: "600",
                        lineHeight: 1.2,
                      }}
                    >
                      {drink.name}
                    </h3>
                    {drink.available ? (
                      <Badge color="green" style={{ fontWeight: "600", flexShrink: 0 }}>
                        Available
                      </Badge>
                    ) : (
                      <Badge color="gray" style={{ fontWeight: "600", flexShrink: 0 }}>
                        Out
                      </Badge>
                    )}
                  </div>

                  {showIngredients.length > 0 ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "#aaa",
                        lineHeight: 1.45,
                      }}
                    >
                      {showIngredients.join(" · ")}
                      {moreIngredients > 0 ? ` · +${moreIngredients} more` : ""}
                    </p>
                  ) : drink.category ? (
                    <p style={{ margin: 0, fontSize: "14px", color: "#888", textTransform: "capitalize" }}>
                      {drink.category}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {drinks.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            marginTop: "4px",
          }}
        >
          {drinks.map((_, index) => (
            <button
              key={drinks[index].id}
              type="button"
              aria-label={`Go to ${drinks[index].name}`}
              onClick={() => scrollToIndex(index)}
              style={{
                width: index === activeIndex ? "20px" : "8px",
                height: "8px",
                borderRadius: "4px",
                border: "none",
                padding: 0,
                backgroundColor:
                  index === activeIndex ? "#4CAF50" : "rgba(255, 255, 255, 0.25)",
                transition: "width 0.2s ease, background-color 0.2s ease",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DrinksCardsCarousel;
