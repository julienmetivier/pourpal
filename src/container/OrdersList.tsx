// OrdersList.tsx
import { useEffect, useState } from "react";
import { Block, List, ListItem, Badge } from "framework7-react";
import { getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import app from "../firebaseConfig";

const db = getFirestore(app);

type Order = {
  id: string;
  drink: string;
  clientName: string;
  employeeId: string;
  timestamp: number;
  status: "pending" | "done" | "failed";
  processedAt?: number;
};

const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Query orders, ordered by timestamp (newest first)
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));

    // Listen for real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList: Order[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      setOrders(ordersList);
    });

    return () => unsubscribe();
  }, []);

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "orange";
      case "done":
        return "green";
      case "failed":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "To Make";
      case "done":
        return "Done";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  };

  const getBackgroundColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#fff3e0";
      case "done":
        return "#e8f5e9";
      case "failed":
        return "#ffebee";
      default:
        return "#f5f5f5";
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#ff9800";
      case "done":
        return "#4caf50";
      case "failed":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  return (
    <Block strong>
      <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Orders</h2>

      {orders.length > 0 && (
        <List>
          {orders.map((order) => (
            <ListItem
              key={order.id}
              title={order.drink}
              style={{
                backgroundColor: getBackgroundColor(order.status),
                borderLeft: `4px solid ${getBorderColor(order.status)}`,
                marginBottom: "8px",
                borderRadius: "4px",
                opacity: order.status === "done" || order.status === "failed" ? 0.8 : 1,
              }}
            >
              <div slot="footer" style={{ 
                fontSize: "13px", 
                color: "#999",
                marginTop: "4px"
              }}>
                <span>{order.clientName}</span>
                <span style={{ marginLeft: "8px" }}>•</span>
                <span style={{ marginLeft: "8px" }}>
                  {formatDateTime(order.timestamp)}
                </span>
              </div>
              <Badge color={getStatusColor(order.status)} slot="after">
                {getStatusLabel(order.status)}
              </Badge>
            </ListItem>
          ))}
        </List>
      )}

      {orders.length === 0 && (
        <Block style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}>
          <p>No orders yet</p>
        </Block>
      )}
    </Block>
  );
};

export default OrdersList;

