import React from 'react';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';

const Toast = ({ message, type }) => {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
  };

  const icons = {
    info: <Info size={18} className="text-blue-500" />,
    success: <CheckCircle2 size={18} className="text-green-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
  };

  return (
    <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border shadow-lg transform transition-all duration-300 animate-slide-up ${styles[type] || styles.info}`}>
      {icons[type] || icons.info}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

export default function ToastContainer({ toasts }) {
  return (
    <div className="absolute bottom-6 right-6 flex flex-col space-y-3 pointer-events-none z-50">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast message={toast.message} type={toast.type} />
        </div>
      ))}
    </div>
  );
}
