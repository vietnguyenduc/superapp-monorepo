import React, { useEffect, useState } from 'react';

export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  closable?: boolean;
  icon?: React.ReactNode;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  closable = true,
  icon
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const typeConfig = {
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      defaultIcon: '✅'
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      defaultIcon: '❌'
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      defaultIcon: '⚠️'
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      defaultIcon: 'ℹ️'
    }
  };

  const config = typeConfig[type];

  if (!isVisible) return null;

  return (
    <div className={`
      ${config.bgColor} ${config.borderColor} ${config.textColor}
      border rounded-xl p-4 shadow-sm transition-all duration-300
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
    `}>
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          {icon || <span className="text-lg">{config.defaultIcon}</span>}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm">
            {message}
          </p>
        </div>

        {closable && (
          <button
            onClick={handleClose}
            className={`
              flex-shrink-0 p-1 rounded-lg transition-colors
              ${config.textColor} hover:bg-black/5
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Toast Container for managing multiple notifications
export const NotificationContainer: React.FC<{
  notifications: (NotificationProps & { id: string })[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}> = ({ 
  notifications, 
  onRemove, 
  position = 'top-right' 
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-3 max-w-sm w-full`}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

export default Notification;
