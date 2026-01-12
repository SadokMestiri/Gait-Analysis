import React, { useState, useEffect } from 'react';

interface FileTreeProps {
  onFileSelect?: (filePath: string, fileName: string) => void;
  patientId?: string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export const FileTree: React.FC<FileTreeProps> = ({
  onFileSelect,
  patientId
}) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [patientId]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      // Simulate loading files - in real app, fetch from API
      const mockFiles: FileNode[] = [
        {
          name: 'raw',
          path: '/records-one-folder/raw',
          type: 'folder',
          children: [
            { name: 'patient_1_1.txt', path: '/records-one-folder/raw/patient_1_1.txt', type: 'file' },
            { name: 'patient_1_2.txt', path: '/records-one-folder/raw/patient_1_2.txt', type: 'file' },
            { name: 'patient_2_1.txt', path: '/records-one-folder/raw/patient_2_1.txt', type: 'file' },
            { name: 'patient_2_2.txt', path: '/records-one-folder/raw/patient_2_2.txt', type: 'file' },
            { name: 'gait.250918115028.txt', path: '/records-one-folder/raw/gait.250918115028.txt', type: 'file' },
            { name: 'gait.250918115755.txt', path: '/records-one-folder/raw/gait.250918115755.txt', type: 'file' },
            { name: 'gait.250918120756.txt', path: '/records-one-folder/raw/gait.250918120756.txt', type: 'file' },
            { name: 'gait.250918121508.txt', path: '/records-one-folder/raw/gait.250918121508.txt', type: 'file' },
            { name: 'gait.251007185737.txt', path: '/records-one-folder/raw/gait.251007185737.txt', type: 'file' },
            { name: 'gait.251007190244.txt', path: '/records-one-folder/raw/gait.251007190244.txt', type: 'file' },
          ]
        },
        {
          name: 'processed',
          path: '/records-one-folder/processed',
          type: 'folder',
          children: []
        }
      ];
      
      // Filter files by patientId if provided
      let filteredFiles = mockFiles;
      if (patientId) {
        const patientName = patientId.toLowerCase().replace(/ /g, '_');
        filteredFiles = mockFiles.map(folder => ({
          ...folder,
          children: folder.children?.filter(file => 
            file.name.toLowerCase().includes(patientName) ||
            file.name.includes(patientId.split(' ')[0]?.toLowerCase() || '')
          ) || []
        })).filter(folder => folder.children && folder.children.length > 0);
      }
      
      setFiles(filteredFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'folder') {
      toggleFolder(file.path);
    } else {
      setSelectedFile(file.path);
      onFileSelect?.(file.path, file.name);
    }
  };
  

  const renderFileNode = (node: FileNode, level = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;

    return (
      <div key={node.path} className="select-none">
        <div
          className={`flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-gray-700/50 ${
            isSelected ? 'bg-blue-500/20 border border-blue-500/30' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => handleFileClick(node)}
        >
          {node.type === 'folder' ? (
            <svg
              className={`w-4 h-4 mr-2 transform transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 mr-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          )}
          
          <span className={`text-sm truncate ${
            isSelected 
              ? 'font-medium text-blue-400' 
              : 'text-gray-300'
          }`}>
            {node.name}
          </span>
          
          {node.type === 'file' && (
            <span className="ml-auto text-xs text-gray-500">
              .txt
            </span>
          )}
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div className="ml-4">
            {node.children.map(child => renderFileNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300 mx-auto"></div>
          <p className="text-sm text-gray-400 mt-2">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/30">
        <h3 className="text-lg font-semibold text-white">Sensor Files</h3>
        <p className="text-sm text-gray-400 mt-1">
          {patientId ? `Files for ${patientId}` : 'All sensor recordings'}
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        {files.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">
              No sensor files found
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Place sensor files in /records-one-folder/raw/
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {files.map(file => renderFileNode(file))}
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-700/30 bg-gray-800/20">
        <div className="text-xs text-gray-500">
          <div className="flex items-center mb-1">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Supported formats: .txt (IAW Data Logger)</span>
          </div>
          <div className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span>Directory: /records-one-folder/raw/</span>
          </div>
        </div>
      </div>
    </div>
  );
};