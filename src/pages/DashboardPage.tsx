// client/src/pages/DashboardPage.tsx
import axios, { AxiosError } from 'axios';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface IDocument {
  _id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  status: 'pending' | 'reviewed' | 'signed' | 'archived' | string;
  user: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  signed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-200 text-gray-700',
};

const DashboardPage: React.FC = () => {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const userToken = localStorage.getItem('userToken');

  useEffect(() => {
    setLoading(true);
    const fetchDocuments = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${userToken}` },
        };
        const response = await axios.get<IDocument[]>(
          `${import.meta.env.VITE_BACKEND_URL}/api/docs`,
          config
        );
        setDocuments(response.data);
      } catch (err) {
        const axiosError = err as AxiosError;
        if (axiosError.response?.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('userToken');
          localStorage.removeItem('userInfo');
          navigate('/login');
        } else {
          setError('Failed to load documents.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [userToken, navigate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${userToken}` } };
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/docs/${id}`, config);
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc._id !== id));
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        navigate('/login');
      } else if (axiosError.response?.status === 403) {
        setError('You are not authorized to delete this document.');
      } else if (axiosError.response?.status === 404) {
        setError('Document not found.');
      } else {
        setError('Failed to delete document.');
      }
    }
  };

  const handleStatusChange = async (docId: string, newStatus: string) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      };
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/docs/${docId}`,
        { status: newStatus },
        config
      );
      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc._id === docId ? { ...doc, status: newStatus } : doc
        )
      );
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        navigate('/login');
      } else if (axiosError.response?.status === 403) {
        setError('You are not authorized to update this document.');
      } else if (axiosError.response?.status === 404) {
        setError('Document not found.');
      } else {
        setError('Failed to update status.');
      }
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100">
        <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        <span className="ml-4 text-xl text-gray-600">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100">
        <div className="text-xl text-red-600 text-center p-4 rounded bg-white shadow-md">
          {error}
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-8 py-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">My Documents</h1>

      {/* Search Input */}
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Search documents by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
      </div>

      {documents.length === 0 ? (
        <div className="text-center text-gray-600 p-8 bg-white rounded-lg shadow-md">
          <p className="text-lg mb-4">You haven't uploaded any documents yet.</p>
          <Link
            to="/upload"
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
          >
            Upload New Document
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Document Name</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Type</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Size</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Upload Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Status</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <tr key={doc._id} className="hover:bg-indigo-50 transition">
                    <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900 max-w-[180px] truncate" title={doc.originalName}>
                      {doc.originalName}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">{doc.fileType}</td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">{(doc.fileSize / 1024).toFixed(2)} KB</td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusColors[doc.status] || 'bg-gray-100 text-gray-700'}`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                      <select
                        value={doc.status}
                        onChange={(e) => handleStatusChange(doc._id, e.target.value)}
                        className="block w-full mt-1 py-1.5 pl-3 pr-10 text-xs border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="signed">Signed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-right text-sm font-medium flex flex-col sm:flex-row gap-2 sm:gap-0 sm:space-x-2 justify-end">
                      <Link
                        to={`/document/${doc._id}`}
                        className="inline-block bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded transition text-xs font-semibold"
                      >
                        View
                      </Link>
                      <Link
                        to={`/sign-document/${doc._id}`}
                        className="inline-block bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition text-xs font-semibold"
                      >
                        Sign
                      </Link>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="inline-block bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition text-xs font-semibold"
                        aria-label={`Delete ${doc.originalName}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No documents match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;