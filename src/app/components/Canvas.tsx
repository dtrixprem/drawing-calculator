"use client";
import { useEffect, useRef, useState } from "react";
import { SWATCHES } from "./ui/Swatches";
import Swatch from "./ui/Swatch";
import { Button } from "@/components/ui/button";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Undo, Redo, ImageUp,  Eraser } from 'lucide-react';


// Initialize Google AI outside component to avoid recreating on each render
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_API_KEY || '');

interface CanvasProps {
  setAnalysisResult: (result: string) => void; // Define the type for setAnalysisResult
  setIsLoading: (loading: boolean) => void;    // Correct the type for setIsLoading
}

export default function Canvas({ setAnalysisResult, setIsLoading }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("rgb(255, 255, 255)");
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Save current canvas content
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;
      
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.drawImage(canvas, 0, 0);

      if (window.innerWidth < 640) {  // Mobile view
        canvas.width = window.innerWidth * 0.9;  // 90% of screen width
        canvas.height = window.innerHeight * 0.4;  // 60% of screen height
      } else {  // Desktop view
        canvas.width = window.innerWidth / 2;
        canvas.height = window.innerHeight / 2;
      }
      
      // Setup drawing context
      ctx.lineCap = "round";
      ctx.lineWidth = 5;
      ctx.fillStyle = "#353b50";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Restore previous content
      ctx.drawImage(tempCanvas, 0, 0);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    saveState();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const saveState = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL();
    setHistory(prev => [...prev, dataUrl]);
  };

  const getEventCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ("touches" in e) {
      const touch = e.touches[0];
      const rect = canvasRef.current!.getBoundingClientRect();
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>| React.TouchEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    const { x, y } = getEventCoordinates(e);
    ctx.moveTo(x,y);
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
      setRedoStack([]);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = color;
    const { x, y } = getEventCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = "#353b50";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    saveState();
    setAnalysisResult(""); // Clear analysis result on canvas clear
  };

  const undo = () => {
    if (history.length <= 1) return;

    const newRedoStack = [...redoStack, history[history.length - 1]];
    const newHistory = history.slice(0, -1);
    setRedoStack(newRedoStack);
    setHistory(newHistory);

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;

    const img = new Image();
    img.src = newHistory[newHistory.length - 1];
    img.onload = () => {
      if (!canvasRef.current) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const lastRedo = redoStack[redoStack.length - 1];
    setHistory(prev => [...prev, lastRedo]);
    setRedoStack(prev => prev.slice(0, -1));

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;

    const img = new Image();
    img.src = lastRedo;
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
  
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Load the image using the Image object
        const img = await loadImageFromFile(file);
  
        // Calculate the scaled dimensions to maintain the image's aspect ratio
        const { width, height, xOffset, yOffset } = calculateScaledDimensions(
          img.width,
          img.height,
          canvas.width,
          canvas.height
        );
  
        // Clear the canvas and draw the image centered
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#353b50"; // Optional: Background color for empty areas
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, xOffset, yOffset, width, height);
  
        // Save the current state after drawing
        saveState();
      } catch (error) {
        console.error("Error uploading image to canvas:", error);
      }
    }
  };
  
  // Helper function to load an image from a file
  const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        resolve(img);
      };
      img.onerror = (error) => {
        reject(error);
      };
    });
  };
  
  // Helper function to calculate the scaled dimensions to maintain aspect ratio
  const calculateScaledDimensions = (
    imageWidth: number,
    imageHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const aspectRatio = imageWidth / imageHeight;
    const scaledHeight = canvasWidth / aspectRatio;
    const xOffset = 0;
    const yOffset = (canvasHeight - scaledHeight) / 2;
    return { width: canvasWidth, height: scaledHeight, xOffset, yOffset };
  };

  const analyzeImage = async () => {
    if (!canvasRef.current) return;
    setIsAnalyzing(true);
    setIsLoading(true);

    try {
       // Indicate loading has started
      
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      });

      // Create a File object from the blob
      const file = new File([blob], "drawing.png", { type: "image/png" });
      
      // Initialize the model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Convert the file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        // Extract only the Base64 data, removing the prefix
        const base64String = base64data.split(',')[1];
        
        // Generate content using the image
        const result = await model.generateContent([
          "Analyze this drawing of a math expression, act as a mathematician and solve the question.",
          {
            inlineData: {
              data: base64String, // Use only the Base64 string
              mimeType: "image/png"
            }
          }
        ]);

        const response = await result.response;
        // setLocalAnalysisResult(response.text());
        setAnalysisResult(response.text()); // Pass result to the parent
        console.log(response.text());
        setIsAnalyzing(false);
        setIsLoading(false);
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysisResult("Error analyzing image. Please try again.");
    } 
  };
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <main className="flex flex-col w-screen items-center sm:w-full m-1 space-y-4 p-4">
      <div className="flex flex-col w-full h-1/2 items-center sm:w-full  bg-[#353b50] rounded-md border border-gray-200 p-4">
        <div className="flex flex-col w-full items-center sm:space-y-4 sm:w-full">
          <div className="flex w-full sm:w-full justify-center  flex-col sm:flex-row sm:space-x-2">
            <Swatch colors={SWATCHES} currentColor={color} onColorSelect={setColor} />
            <div className="flex flex-row space-x-2 justify-center justify-items-center mt-2">
            <Button onClick={clearCanvas}className=" hover:bg-slate-600"><Eraser/></Button>
            <Button onClick={undo} disabled={history.length <= 1}>
                <Undo/>
            </Button>
            
            
            <Button onClick={redo} disabled={redoStack.length === 0}>
             
             <Redo />
            </Button>
            <Button onClick={openFilePicker} className=" hover:bg-slate-600"><ImageUp/>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={uploadImage}
                style={{ display: "none" }}
              />
            </Button>
            <Button 
              onClick={analyzeImage} 
              disabled={isAnalyzing}
              className=" hover:bg-slate-600"
            >
              {isAnalyzing ? 'Running...' : 'Run'}
            </Button>
            </div>
            
          </div>
        </div>
        
        <canvas
          ref={canvasRef}
          id="canvas"
          className="rounded mt-4"
          onMouseDown={startDrawing}
          onMouseOut={stopDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
        
      </div>
    </main>
  );
}
