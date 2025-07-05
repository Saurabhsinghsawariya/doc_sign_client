// client/src/pages/UploadDocumentPage.tsx
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UploadDocumentPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false); // New state for upload loading
  const navigate = useNavigate();

  const userToken = localStorage.getItem('userToken');

  useEffect(() => {
    // Redirect to login if no token is found
    if (!userToken) {
      navigate('/login');
    }
  }, [userToken, navigate]);

  // Helper function for file validation
  // It now returns File | null directly, making it safer for setSelectedFile
  const validateAndGetFile = (file: File | undefined): File | null => {
    if (!file) {
      setError('No file selected.');
      return null;
    }

    const maxSizeMB = 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024; // 10 MB in bytes

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return null;
    }
    if (file.size > maxSizeBytes) {
      setError(`File is too large. Max ${maxSizeMB}MB allowed.`);
      return null;
    }

    setError(''); // Clear any previous errors
    setMessage(''); // Clear any previous messages
    return file; // Return the valid file
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const validatedFile = validateAndGetFile(file);
    setSelectedFile(validatedFile); // This line is now safe
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    const validatedFile = validateAndGetFile(file);
    setSelectedFile(validatedFile); // This line is now safe
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      setMessage('');
      return;
    }

    if (!userToken) {
      setError('Authentication token not found. Please log in again.');
      navigate('/login');
      return;
    }

    setUploading(true); // Set uploading state to true
    setMessage(''); // Clear previous messages
    setError(''); // Clear previous errors

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userToken}`,
        },
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/docs/upload`,
        formData,
        config
      );

      setMessage(response.data.message || 'File uploaded successfully!');
      setSelectedFile(null); // Clear the selected file after successful upload

      // Redirect to dashboard after a short delay to show success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000); // Redirect after 2 seconds
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error('Upload error:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'File upload failed.');
        // If 401, redirect to login
        if (err.response?.status === 401) {
            localStorage.removeItem('userToken');
            localStorage.removeItem('userInfo');
            navigate('/login');
        }
      } else {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred during file upload.');
      }
      setMessage(''); // Ensure success message is cleared on error
    } finally {
      setUploading(false); // Reset uploading state
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Upload Your Document
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            PDF files only (max 10MB)
          </p>
        </div>

        <div
          className={`mt-4 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors duration-200 ${
            isDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept="application/pdf" // Ensure only PDF files can be selected via file picker
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            {selectedFile ? (
              <p className="text-xs text-gray-500 mt-2">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            ) : (
              <p className="text-xs text-gray-500">No file selected</p>
            )}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        {message && <p className="text-green-600 text-sm text-center">{message}</p>}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || uploading} // Disable if no file or actively uploading
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mt-4 transition-colors duration-200"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default UploadDocumentPage;