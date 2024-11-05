"use client";
import { useState } from "react";
import Canvas from "./components/Canvas";
import LoadingSpinner from "./components/LoadingSpinner";
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950">
      {/* Header */}
      <header className="w-full bg-slate-800 justify-items-start h-fit text-white py-1.5 text-center">
        <h1 className="text-2xl font-semibold ml-2">Drawing Calculator</h1>
      </header>

      {/* Main Content */}
      <main className="flex flex-col md:flex-row flex-grow justify-items-center items-stretch">
        {/* Canvas Container */}
        <div className="flex justify-center items-center">
          <Canvas setAnalysisResult={setAnalysisResult} setIsLoading={setIsLoading} />
        </div>

        {/* Text Container */}
        <div className="md:w-1/2 w-full max-h-60 md:max-h-screen md:h-full flex items-center justify-center mr-5">
          <div className="w-full overflow-y-auto h-full md:h-3/4 m-4 flex flex-col bg-gray-900 border border-gray-700 rounded-lg">
            <h1 className="text-gray-600 text-2xl justify-start ml-2 mt-2">Solution:</h1>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="text-gray-400 mt-2 ml-2">
                {analysisResult ? (
                  <ReactMarkdown
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      // Custom component for rendering code blocks
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !match ? (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        ) : (
                          <pre data-language={match[1]}>
                            <code>{children}</code>
                          </pre>
                        );
                      },
                    }}
                  >
                    {analysisResult}
                  </ReactMarkdown>
                ) : (
                  'No result available.'
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-800 font-mono text-white py-3 text-center">
        <p className="text-sm uppercase">web-app built by dtrixprem</p>
      </footer>
    </div>
  );
}
