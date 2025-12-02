import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Upload, CheckCircle, AlertCircle, LayoutDashboard } from 'lucide-react';

export default function AdminImport() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setResult(response.data);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Admin: Import Attendees</h1>
                <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                >
                    <LayoutDashboard className="w-4 h-4" />
                    View Dashboard
                </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload CSV File
                    </label>
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">CSV files only</p>
                            </div>
                            <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                        </label>
                    </div>
                    {file && <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>}
                </div>

                <button
                    onClick={handleUpload}
                    disabled={!file || status === 'uploading'}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                    {status === 'uploading' ? 'Uploading...' : 'Import Attendees'}
                </button>

                {status === 'success' && result && (
                    <div className="mt-6 p-4 bg-green-50 rounded-md flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-green-800">Import Successful</h3>
                            <p className="text-sm text-green-700 mt-1">
                                Processed {result.success + result.errors} rows.
                                <br />
                                Success: {result.success}
                                <br />
                                Errors: {result.errors}
                            </p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mt-6 p-4 bg-red-50 rounded-md flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <p className="text-sm text-red-700">Failed to upload file. Please try again.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
