import axios, { AxiosError } from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface ErrorResponse {
  message?: string;
}

const DocumentViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const userToken = localStorage.getItem('userToken');

  useEffect(() => {
    if (!userToken) {
      navigate('/login');
      return;
    }

    if (!id) {
      setError('Document ID is missing.');
      setLoading(false);
      return;
    }

    let url: string;

    const fetchDocument = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          responseType: 'blob' as const,
        };

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/docs/view/${id}`,
          config
        );

        const fileBlob = new Blob([response.data], { type: 'application/pdf' });
        url = URL.createObjectURL(fileBlob);
        setPdfUrl(url);
      } catch (err) {
        const axiosError = err as AxiosError<ErrorResponse>;
        console.error('Error fetching document:', axiosError);

        if (axiosError.response?.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('userToken');
          localStorage.removeItem('userInfo');
          navigate('/login');
        } else if (axiosError.response?.status === 403) {
          setError('You are not authorized to view this document.');
        } else if (axiosError.response?.status === 404) {
          setError('Document not found.');
        } else {
          setError(axiosError.response?.data?.message || 'Failed to load document.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();

    // Clean up blob URL on unmount
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [id, userToken, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100">
        <div className="text-xl text-gray-600">Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100">
        <div className="text-xl text-red-600 text-center p-4 rounded bg-white shadow-md">
          {error}
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col items-center min-h-[calc(100vh-64px)]">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Document Viewer</h1>
      {pdfUrl ? (
        <div className="w-full flex-grow bg-white shadow-lg rounded-lg overflow-hidden">
          <iframe
            src={pdfUrl}
            title="Document Viewer"
            className="w-full h-full min-h-[600px]"
            style={{ border: 'none' }}
          >
            Your browser does not support iframes.
            <a href={pdfUrl} download="document.pdf">Download PDF here</a>.
          </iframe>
        </div>
      ) : (
        <div className="text-center text-gray-600">No PDF to display.</div>
      )}
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-8 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default DocumentViewerPage;
