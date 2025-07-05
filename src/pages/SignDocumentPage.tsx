// client/src/pages/SignDocumentPage.tsx
import axios, { AxiosError } from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { Document, Page, pdfjs } from 'react-pdf';
import { useNavigate, useParams } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';

// REMOVE THIS LINE:
// import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// >>> UPDATE THIS LINE <<<
// Point to the locally hosted worker file in the public directory
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
// >>> END UPDATE <<<

type SignatureType = 'draw' | 'upload' | 'text';

interface SignaturePosition {
    x: number;
    y: number;
}

interface DocumentData {
    _id: string;
    fileName: string;
    filePath: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    uploadDate: string; // ISO date string
    status: 'pending' | 'signed' | 'archived' | 'reviewed'; // Added 'reviewed'
    lastSignedAt?: string; // ISO date string
    user: string; // User ID
    createdAt: string;
    updatedAt: string;
}


const SignDocumentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [documentBlob, setDocumentBlob] = useState<Blob | null>(null);
    const [documentMetaData, setDocumentMetaData] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [applyingSignature, setApplyingSignature] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [error, setError] = useState('');

    // PDF rendering state
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1); // Allow changing page later

    // Signature state
    const sigCanvas = useRef<SignatureCanvas | null>(null);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [signatureType, setSignatureType] = useState<SignatureType>('draw');
    const [uploadedSignatureFile, setUploadedSignatureFile] = useState<File | null>(null);
    const [uploadedSignaturePreview, setUploadedSignaturePreview] = useState<string | null>(null);
    const [draggableSignaturePosition, setDraggableSignaturePosition] = useState<SignaturePosition>({ x: 50, y: 50 });

    // State for typed signature text
    const [typedSignatureText, setTypedSignatureText] = useState('');
    const textSignatureCanvasRef = useRef<HTMLCanvasCanvasElement>(null);

    // Ref for the PDF container to calculate drag bounds and relative positions
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const [pdfContainerBounds, setPdfContainerBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });

    // Ref for the Draggable signature image (for React 18 compatibility with react-draggable)
    const signatureImageRef = useRef<HTMLImageElement>(null);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        const updateBounds = () => {
            if (pdfContainerRef.current) {
                const rect = pdfContainerRef.current.getBoundingClientRect();
                if (rect.width !== pdfContainerBounds.width || rect.height !== pdfContainerBounds.height) {
                    setPdfContainerBounds({
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                    });
                }
            }
        };

        const rafId = requestAnimationFrame(updateBounds);
        const timeoutId = setTimeout(updateBounds, 500);
        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(timeoutId);
        };
    }, [pdfContainerBounds.width, pdfContainerBounds.height]);

    useEffect(() => {
        const updateBounds = () => {
            if (pdfContainerRef.current) {
                const rect = pdfContainerRef.current.getBoundingClientRect();
                if (rect.width !== pdfContainerBounds.width || rect.height !== pdfContainerBounds.height) {
                    setPdfContainerBounds({
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                    });
                }
            }
        };
        window.addEventListener('resize', updateBounds);
        updateBounds();
        return () => window.removeEventListener('resize', updateBounds);
    }, [pdfContainerBounds.width, pdfContainerBounds.height]);

    const fetchDocument = useCallback(async () => {
        const userToken = localStorage.getItem('userToken');
        if (!userToken) {
            navigate('/login');
            return;
        }

        if (!id) {
            setError('No document ID provided.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');

            const metaConfig = {
                headers: { Authorization: `Bearer ${userToken}` },
            };
            const metaResponse = await axios.get<DocumentData>(`${import.meta.env.VITE_BACKEND_URL}/api/docs/${id}`, metaConfig);
            setDocumentMetaData(metaResponse.data);

            const fileConfig = {
                headers: { Authorization: `Bearer ${userToken}` },
                responseType: 'blob' as const,
            };
            const fileResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/docs/view/${id}`, fileConfig);
            setDocumentBlob(fileResponse.data);

        } catch (error) {
            const err = error as AxiosError;
            console.error('Error fetching document:', err);
            if (axios.isAxiosError(err) && err.response) {
                switch (err.response.status) {
                    case 401:
                        setError('Session expired. Please log in again.');
                        localStorage.removeItem('userToken');
                        localStorage.removeItem('userInfo');
                        navigate('/login');
                        break;
                    case 403:
                        setError('You are not authorized to view this document.');
                        break;
                    case 404:
                        setError('Document not found or access denied.');
                        break;
                    default:
                        const errorMessage = typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data
                            ? (err.response.data as { message?: string }).message
                            : err.message;
                        setError(`Failed to load document: ${errorMessage}`);
                }
            } else {
                setError('An unexpected error occurred while loading the document.');
            }
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchDocument();
        return () => {
            if (uploadedSignaturePreview) {
                URL.revokeObjectURL(uploadedSignaturePreview);
            }
        };
    }, [fetchDocument, uploadedSignaturePreview]);

    const clearSignature = useCallback(() => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
        }
        setSignatureData(null);
        setUploadedSignatureFile(null);
        if (uploadedSignaturePreview) {
            URL.revokeObjectURL(uploadedSignaturePreview);
            setUploadedSignaturePreview(null);
        }
        setTypedSignatureText('');
        setDraggableSignaturePosition({ x: 50, y: 50 });
    }, [uploadedSignaturePreview]);

    const handleSignatureEnd = useCallback(() => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            const newSignatureData = sigCanvas.current.toDataURL('image/png');
            if (newSignatureData !== signatureData) {
                setSignatureData(newSignatureData);
            }
        } else if (signatureData !== null) {
            setSignatureData(null);
        }
    }, [signatureData]);

    const handleSignatureUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                setError('Signature image too large. Max 5MB allowed.');
                setUploadedSignatureFile(null);
                if (uploadedSignaturePreview) {
                    URL.revokeObjectURL(uploadedSignaturePreview);
                    setUploadedSignaturePreview(null);
                }
                return;
            }

            setUploadedSignatureFile(file);
            if (uploadedSignaturePreview) {
                URL.revokeObjectURL(uploadedSignaturePreview);
            }
            const previewUrl = URL.createObjectURL(file);
            setUploadedSignaturePreview(previewUrl);
            setSignatureData(null);
            setError('');
        } else {
            setError('Please upload an image file (PNG, JPG, GIF).');
            setUploadedSignatureFile(null);
            if (uploadedSignaturePreview) {
                URL.revokeObjectURL(uploadedSignaturePreview);
                setUploadedSignaturePreview(null);
            }
            setSignatureData(null);
        }
    }, [uploadedSignaturePreview]);

    useEffect(() => {
        if (signatureType === 'text' && typedSignatureText && textSignatureCanvasRef.current) {
            const canvas = textSignatureCanvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const fontSize = 48;
                const fontFamily = 'Dancing Script, cursive';
                ctx.font = `${fontSize}px ${fontFamily}`;

                const textMetrics = ctx.measureText(typedSignatureText);
                const textWidth = textMetrics.width;
                const textHeight = fontSize * 1.2;
                const padding = 10;

                const targetWidth = textWidth + (padding * 2);
                const targetHeight = textHeight + (padding * 2);

                const widthChanged = Math.abs(canvas.width - targetWidth) > 1;
                const heightChanged = Math.abs(canvas.height - targetHeight) > 1;

                if (widthChanged || heightChanged) {
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    ctx.font = `${fontSize}px ${fontFamily}`;
                    ctx.fillStyle = 'black';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }

                ctx.fillStyle = 'black';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';

                ctx.fillText(typedSignatureText, padding, padding);

                const newSignatureData = canvas.toDataURL('image/png');
                if (newSignatureData !== signatureData) {
                    setSignatureData(newSignatureData);
                }
            }
        } else if (signatureType === 'text' && !typedSignatureText && signatureData !== null) {
            setSignatureData(null);
        }
    }, [typedSignatureText, signatureType, signatureData]);

    const handleDragStop = useCallback((_e: any, data: { x: number; y: number }) => {
        setDraggableSignaturePosition({ x: data.x, y: data.y });
    }, []);


    const handleApplySignature = async () => {
        let finalSignatureDataToSend: string | null = null;
        let signatureFileExtension: string | null = null;
        setError('');

        if (signatureType === 'draw' && signatureData) {
            finalSignatureDataToSend = signatureData;
            signatureFileExtension = 'png';
        } else if (signatureType === 'upload' && uploadedSignatureFile) {
            try {
                finalSignatureDataToSend = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(reader.result as string);
                    };
                    reader.onerror = (error) => {
                        reject(error);
                    };
                    reader.readAsDataURL(uploadedSignatureFile);
                });
                const typeParts = uploadedSignatureFile.type.split('/');
                signatureFileExtension = typeParts.length > 1 ? typeParts[1] : 'png';
            } catch (e) {
                setError('Failed to read uploaded signature file.');
                console.error('FileReader error:', e);
                return;
            }
        } else if (signatureType === 'text' && signatureData && typedSignatureText) {
            finalSignatureDataToSend = signatureData;
            signatureFileExtension = 'png';
        } else {
            setError('Please draw, upload, or type a signature before applying.');
            return;
        }

        if (!finalSignatureDataToSend) {
            setError('No signature data found to apply.');
            return;
        }

        const userToken = localStorage.getItem('userToken');
        if (!userToken) {
            setError('Authentication token not found. Please log in again.');
            navigate('/login');
            return;
        }

        const pdfPageCanvas = pdfContainerRef.current?.querySelector('.react-pdf__Page__canvas');
        const pdfRenderedWidth = pdfPageCanvas?.clientWidth || 0;
        const pdfRenderedHeight = pdfPageCanvas?.clientHeight || 0;

        if (pdfRenderedWidth === 0 || pdfRenderedHeight === 0) {
            setError('Could not determine PDF page dimensions for signature placement.');
            setApplyingSignature(false);
            return;
        }

        try {
            setApplyingSignature(true);
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/docs/sign/${id}`,
                {
                    signatureData: finalSignatureDataToSend,
                    signaturePosition: draggableSignaturePosition,
                    pdfPageDimensions: { width: pdfRenderedWidth, height: pdfRenderedHeight },
                    pageNumber,
                    signatureType,
                    signatureFileExtension,
                },
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            alert('Signature applied successfully! The document has been updated.');
            clearSignature();
            await fetchDocument();
        } catch (error) {
            const err = error as AxiosError;
            console.error('Error applying signature:', err);
            if (axios.isAxiosError(err) && err.response) {
                const errorMessage = typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data
                    ? (err.response.data as { message?: string }).message
                    : err.message;
                setError(`Failed to apply signature: ${errorMessage}`);
                if (err.response.status === 401) {
                    localStorage.removeItem('userToken');
                    localStorage.removeItem('userInfo');
                    navigate('/login');
                }
            } else {
                setError('An unexpected error occurred while applying the signature.');
            }
        } finally {
            setApplyingSignature(false);
        }
    };

    const handleMarkAsReviewed = async () => {
        const userToken = localStorage.getItem('userToken');
        if (!userToken) {
            setError('Authentication token not found. Please log in again.');
            navigate('/login');
            return;
        }

        if (!id) {
            setError('No document ID provided for status update.');
            return;
        }

        try {
            setUpdatingStatus(true);
            setError('');
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/docs/${id}`,
                { status: 'reviewed' },
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            alert('Document marked as reviewed!');
            await fetchDocument();
        } catch (error) {
            const err = error as AxiosError;
            console.error('Error marking document as reviewed:', err);
            if (axios.isAxiosError(err) && err.response) {
                const errorMessage = typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data
                    ? (err.response.data as { message?: string }).message
                    : err.message;
                setError(`Failed to mark document as reviewed: ${errorMessage}`);
                if (err.response.status === 401) {
                    localStorage.removeItem('userToken');
                    localStorage.removeItem('userInfo');
                    navigate('/login');
                }
            } else {
                setError('An unexpected error occurred while marking the document as reviewed.');
            }
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDownloadSignedDocument = useCallback(() => {
        if (documentBlob && id) {
            const url = URL.createObjectURL(documentBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `signed_document_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            alert('No document loaded to download.');
        }
    }, [documentBlob, id]);

    useEffect(() => {
        setLoading(true);
        const fetchDocumentData = async () => {
            const userToken = localStorage.getItem('userToken');
            if (!userToken) {
                setLoading(false);
                return;
            }

            try {
                const metaConfig = {
                    headers: { Authorization: `Bearer ${userToken}` },
                };
                const metaResponse = await axios.get<DocumentData>(`${import.meta.env.VITE_BACKEND_URL}/api/docs/${id}`, metaConfig);
                setDocumentMetaData(metaResponse.data);

                const fileConfig = {
                    headers: { Authorization: `Bearer ${userToken}` },
                    responseType: 'blob' as const,
                };
                const fileResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/docs/view/${id}`, fileConfig);
                setDocumentBlob(fileResponse.data);
            } catch (error) {
                const err = error as AxiosError;
                console.error('Error fetching document:', err);
                if (axios.isAxiosError(err) && err.response) {
                    switch (err.response.status) {
                        case 401:
                            setError('Session expired. Please log in again.');
                            localStorage.removeItem('userToken');
                            localStorage.removeItem('userInfo');
                            navigate('/login');
                            break;
                        case 403:
                            setError('You are not authorized to view this document.');
                            break;
                        case 404:
                            setError('Document not found or access denied.');
                            break;
                        default:
                            const errorMessage = typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data
                                ? (err.response.data as { message?: string }).message
                                : err.message;
                            setError(`Failed to load document: ${errorMessage}`);
                    }
                } else {
                    setError('An unexpected error occurred while loading the document.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDocumentData();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100">
                <svg className="animate-spin h-10 w-10 text-indigo-600 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span className="text-xl text-gray-600">Loading document for signing...</span>
            </div>
        );
    }

    if (error && !loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100">
                <div className="text-xl text-red-600 text-center p-6 rounded-lg bg-white shadow-md max-w-md w-full">
                    {error}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-6 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md transition"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const draggableSignatureSrc =
        signatureType === 'draw'
            ? signatureData
            : signatureType === 'upload'
                ? uploadedSignaturePreview
                : signatureType === 'text'
                    ? signatureData
                    : null;

    const isSignatureReady = Boolean(draggableSignatureSrc);

    return (
        <div className="container mx-auto px-2 sm:px-4 md:px-8 py-4 flex flex-col min-h-[calc(100vh-64px)] animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 text-center">Sign Document</h1>
            <p className="text-center text-gray-600 mb-4 text-sm">Document ID: {id}</p>

            {documentMetaData && (
                <p className="text-center text-lg font-semibold mb-4">
                    Current Status: <span className={`
                        ${documentMetaData.status === 'signed' ? 'text-green-600' : ''}
                        ${documentMetaData.status === 'pending' ? 'text-yellow-600' : ''}
                        ${documentMetaData.status === 'reviewed' ? 'text-blue-600' : ''}
                        ${documentMetaData.status === 'archived' ? 'text-gray-600' : ''}
                    `}>
                        {documentMetaData.status.charAt(0).toUpperCase() + documentMetaData.status.slice(1)}
                    </span>
                </p>
            )}

            <div className="flex flex-col lg:flex-row gap-8 w-full">
                <div className="lg:w-3/4 w-full relative border border-gray-200 rounded-lg shadow-lg overflow-hidden h-[60vh] bg-white flex justify-center items-start">
                    {documentBlob ? (
                        <div
                          ref={pdfContainerRef}
                          className="w-full h-full overflow-auto flex justify-center bg-gray-100 relative" // <-- add relative here
                        >
                          <Document
                            file={documentBlob}
                            onLoadSuccess={onDocumentLoadSuccess}
                            className="flex justify-center"
                            loading={<div className="text-gray-600">Loading PDF...</div>}
                            error={<div className="text-red-600">Failed to load PDF.</div>}
                          >
                            <Page
                              pageNumber={pageNumber}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                              className="shadow-md"
                              key={`page_${pageNumber}`}
                            />
                          </Document>
                          {isSignatureReady && (
                            <Draggable
                              bounds="parent"
                              onStop={handleDragStop}
                              defaultPosition={draggableSignaturePosition} // Use defaultPosition for uncontrolled drag
                              nodeRef={signatureImageRef}
                            >
                              <img
                                ref={signatureImageRef}
                                src={draggableSignatureSrc!}
                                alt="Signature"
                                className="absolute cursor-grab z-10 p-1 bg-white border border-blue-400 shadow-lg"
                                style={{
                                  width: signatureType === 'text' ? 'auto' : '120px',
                                  maxHeight: '80px',
                                  maxWidth: '80%',
                                  pointerEvents: 'auto',
                                }}
                              />
                            </Draggable>
                          )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-600 text-lg">
                            <p>Document could not be loaded or is not a PDF.</p>
                        </div>
                    )}
                </div>

                <div className="lg:w-1/4 w-full mt-8 lg:mt-0 p-4 sm:p-6 bg-white rounded-lg shadow-lg flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 text-center">Add Your Signature</h2>
                        <div className="flex justify-center space-x-2 sm:space-x-4 mb-6 flex-wrap gap-2">
                            <button
                                onClick={() => { setSignatureType('draw'); clearSignature(); }}
                                className={`px-4 py-2 rounded-md font-semibold text-sm transition
                                    ${signatureType === 'draw' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                Draw
                            </button>
                            <button
                                onClick={() => { setSignatureType('upload'); clearSignature(); }}
                                className={`px-4 py-2 rounded-md font-semibold text-sm transition
                                    ${signatureType === 'upload' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                Upload
                            </button>
                            <button
                                onClick={() => { setSignatureType('text'); clearSignature(); }}
                                className={`px-4 py-2 rounded-md font-semibold text-sm transition
                                    ${signatureType === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                Type
                            </button>
                        </div>

                        {signatureType === 'draw' && (
                            <div className="border border-gray-300 rounded-md mb-4 overflow-hidden shadow-sm">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor="black"
                                    canvasProps={{ width: 280, height: 120, className: 'sigCanvas border-b border-gray-300' }}
                                    onEnd={handleSignatureEnd}
                                />
                                <div className="p-2 bg-gray-50 flex justify-end">
                                    <button
                                        onClick={clearSignature}
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md transition"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}

                        {signatureType === 'upload' && (
                            <div className="mb-4">
                                <label htmlFor="signatureUpload" className="block text-sm font-medium text-gray-700 mb-2">Upload Signature Image</label>
                                <input
                                    type="file"
                                    id="signatureUpload"
                                    accept="image/png, image/jpeg, image/gif"
                                    onChange={handleSignatureUpload}
                                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                {uploadedSignaturePreview && (
                                    <div className="mt-4 border border-gray-300 rounded-md p-2 flex justify-center items-center h-24 bg-gray-100">
                                        <img src={uploadedSignaturePreview} alt="Uploaded Signature Preview" className="max-w-full max-h-full object-contain" />
                                    </div>
                                )}
                            </div>
                        )}

                        {signatureType === 'text' && (
                            <div className="mb-4">
                                <label htmlFor="typedSignature" className="block text-sm font-medium text-gray-700 mb-2">Type Your Signature</label>
                                <input
                                    type="text"
                                    id="typedSignature"
                                    value={typedSignatureText}
                                    onChange={(e) => setTypedSignatureText(e.target.value)}
                                    placeholder="Type your name here..."
                                    className="block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                />
                                {typedSignatureText && (
                                    <div className="mt-4 border border-gray-300 rounded-md p-2 flex justify-center items-center h-24 bg-gray-100 overflow-hidden">
                                        <canvas ref={textSignatureCanvasRef} style={{ display: 'none' }}></canvas>
                                        {signatureData && (
                                            <img src={signatureData} alt="Typed Signature Preview" className="max-w-full max-h-full object-contain" />
                                        )}
                                    </div>
                                )}
                                <div className="p-2 bg-gray-50 flex justify-end">
                                    <button
                                        onClick={clearSignature}
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md transition"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}
                    </div>

                    <div className="mt-auto space-y-3">
                        <button
                            onClick={handleApplySignature}
                            disabled={!isSignatureReady || applyingSignature}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition text-base shadow"
                        >
                            {applyingSignature ? 'Applying Signature...' : 'Apply Signature'}
                        </button>

                        {documentMetaData && documentMetaData.status !== 'reviewed' && (
                            <button
                                onClick={handleMarkAsReviewed}
                                disabled={updatingStatus}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition text-base shadow"
                            >
                                {updatingStatus ? 'Marking as Reviewed...' : 'Mark as Reviewed'}
                            </button>
                        )}


                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition text-base shadow"
                        >
                            Back to Dashboard
                        </button>

                        {documentBlob && (
                            <button
                                onClick={handleDownloadSignedDocument}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition text-base shadow"
                            >
                                Download Document
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignDocumentPage;