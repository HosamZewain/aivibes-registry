import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function CheckIn() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('loading'); // loading, valid, invalid, error
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await api.get(`/check?token=${token}`);
                if (res.data.valid) {
                    setData(res.data.registration);
                    setStatus('valid');
                } else {
                    setStatus('invalid');
                }
            } catch (err) {
                console.error(err);
                if (err.response && err.response.status === 404) {
                    setStatus('invalid');
                } else {
                    setStatus('error');
                }
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700">Verifying...</h2>
                    </div>
                )}

                {status === 'valid' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
                        <h1 className="text-4xl font-bold text-green-600 mb-2">VALID</h1>
                        <div className="bg-green-50 p-4 rounded-lg w-full mt-4">
                            <p className="text-lg font-semibold text-gray-800">{data.fullName}</p>
                            <p className="text-gray-600 capitalize">{data.attendeeMode.replace('_', ' ')}</p>
                            {data.attendeeType && (
                                <span className="inline-block mt-2 px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
                                    {data.attendeeType}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {status === 'invalid' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="w-24 h-24 text-red-500 mb-6" />
                        <h1 className="text-4xl font-bold text-red-600 mb-2">NOT VALID</h1>
                        <p className="text-gray-600 mt-2">This QR code is invalid or does not exist.</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="w-24 h-24 text-orange-500 mb-6" />
                        <h1 className="text-2xl font-bold text-orange-600 mb-2">Error</h1>
                        <p className="text-gray-600 mt-2">Could not verify ticket. Please check connection.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
