import React from 'react';
import { ExternalLink, Code } from 'lucide-react';

export const Footer: React.FC = () => {
  const handleLinkedInClick = () => {
    window.open('https://www.linkedin.com/in/agamustafayevv/', '_blank');
  };

  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Code className="w-4 h-4" />
          <span>Developed by</span>
          <button
            onClick={handleLinkedInClick}
            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Aga Mustafayev
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </footer>
  );
};
