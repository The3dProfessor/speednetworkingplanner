
import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 bg-slate-800 rounded-lg shadow-xl">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"></div>
      <p className="mt-4 text-lg text-slate-300">{message || 'Generating schedule...'}</p>
    </div>
  );
};
