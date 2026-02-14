/**
 * FILE DROPZONE COMPONENT
 * =======================
 * 
 * A drag-and-drop file input component that accepts images and videos.
 * Uses react-dropzone for handling file operations.
 */

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ 
  onFileSelect,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf'],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        w-full h-full flex flex-col items-center justify-center
        border-2 border-dashed rounded-lg cursor-pointer
        transition-all duration-200
        ${isDragActive 
          ? 'border-green-500 bg-green-500/5' 
          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
        }
      `}
    >
      <input {...getInputProps()} />
      
      <div className="text-center p-8">
        {/* Upload Icon */}
        <svg
          className="w-12 h-12 mx-auto mb-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        
        <p className="text-lg font-medium text-gray-300 mb-2">
          {isDragActive ? 'Drop file here' : 'Drop file or click to browse'}
        </p>
        
        <p className="text-sm text-gray-500">
          PNG, JPG, GIF, MP4, WebM, GLB
        </p>
      </div>
    </div>
  );
};

export default FileDropzone;
