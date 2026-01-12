import React from 'react';

interface MultiFileNavigatorProps {
  files: Array<{
    fileName: string;
    session: string;
  }>;
  currentIndex: number;
  onSelectFile: (index: number) => void;
}

export const MultiFileNavigator: React.FC<MultiFileNavigatorProps> = ({
  files,
  currentIndex,
  onSelectFile,
}) => {
  if (files.length <= 1) return null;
  
  return (
    <div className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-gray-700/30 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Multiple Sensor Files</h3>
          <p className="text-sm text-gray-400">Patient has multiple recordings - switch between them below</p>
        </div>
        <div className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">
          {currentIndex + 1} of {files.length}
        </div>
      </div>
      
      {/* File List */}
      <div className="space-y-3 mb-6">
        {files.map((file, index) => (
          <div
            key={index}
            onClick={() => onSelectFile(index)}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
              index === currentIndex
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg'
                : 'bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  index === currentIndex ? 'bg-blue-500' : 'bg-gray-600'
                }`}></div>
                <div>
                  <div className={`font-medium ${
                    index === currentIndex ? 'text-white' : 'text-gray-300'
                  }`}>
                    {file.fileName}
                  </div>
                  <div className="text-xs text-gray-500">
                    Session: {file.session}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                {index === currentIndex && (
                  <div className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full mr-3">
                    Active
                  </div>
                )}
                <svg className={`w-5 h-5 ${
                  index === currentIndex ? 'text-blue-400' : 'text-gray-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation Controls */}
      <div className="flex justify-between mt-6 pt-6 border-t border-gray-700/30">
        <button
          onClick={() => onSelectFile(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className={`px-5 py-3 rounded-xl flex items-center transition-all duration-200 ${
            currentIndex === 0
              ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous File
        </button>
        
        <div className="text-sm text-gray-400 flex items-center">
          <span className="mr-2">Navigation:</span>
          <div className="flex space-x-1">
            {files.map((_, index) => (
              <button
                key={index}
                onClick={() => onSelectFile(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-blue-500 w-8' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to file ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        <button
          onClick={() => onSelectFile(Math.min(files.length - 1, currentIndex + 1))}
          disabled={currentIndex === files.length - 1}
          className={`px-5 py-3 rounded-xl flex items-center transition-all duration-200 ${
            currentIndex === files.length - 1
              ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white'
          }`}
        >
          Next File
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};