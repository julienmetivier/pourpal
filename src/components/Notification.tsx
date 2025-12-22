// Notification.tsx
import React from "react";

type NotificationProps = {
  message: string;
  type: 'success' | 'error';
};

const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: type === 'success' ? '#4CAF50' : '#f44336',
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
      {message}
    </div>
  );
};

export default Notification;



