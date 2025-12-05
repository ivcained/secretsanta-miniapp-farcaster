"use client";

import React, { useEffect, useState } from "react";
import { NotificationType } from "~/lib/notifications";

interface ToastProps {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  onClose: () => void;
}

export function Toast({
  type,
  title,
  message,
  duration = 4000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
        return "ℹ";
      default:
        return "•";
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-50
        max-w-sm w-[90%] p-4 rounded-xl border shadow-lg
        transition-all duration-300
        ${getTypeStyles()}
        ${isLeaving ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-sm opacity-90 mt-0.5">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Toast container for managing multiple toasts
interface ToastItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex flex-col items-center gap-2 p-4">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto"
            style={{ transform: `translateY(${index * 8}px)` }}
          >
            <Toast
              type={toast.type}
              title={toast.title}
              message={toast.message}
              onClose={() => onRemove(toast.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
