// components/Swatch.tsx
import React from 'react';

interface SwatchProps {
  colors: string[];
  currentColor: string;
  onColorSelect: (color: string) => void;
}

const Swatch: React.FC<SwatchProps> = ({ colors, currentColor, onColorSelect }) => {
  return (
    <div className="flex space-x-2 mb-2">
      {colors.map((color, index) => (
        <div
          key={index}
          onClick={() => onColorSelect(color)}
          className={`w-10 h-10 cursor-pointer rounded-full border-2 border-gray-300 ${
            currentColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};

export default Swatch;
