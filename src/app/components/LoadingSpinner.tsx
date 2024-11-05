// src/app/components/LoadingSpinner.tsx
const LoadingSpinner = () => {
    return (
      <div className="flex ml-3 mt-4 justify-start items-start space-x-2">
      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></div>
      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-300"></div>
    </div>
    );
  };
  
  export default LoadingSpinner;
  