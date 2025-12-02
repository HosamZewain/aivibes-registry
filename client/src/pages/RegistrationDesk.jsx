import React, { useState } from 'react';
import api from '../api';
import { Search, User, Briefcase, Check, AlertCircle, QrCode } from 'lucide-react';

export default function RegistrationDesk() {
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [attendeeData, setAttendeeData] = useState(null); // From search
    const [mode, setMode] = useState(null); // 'sessions_attendee' | 'hackathon_participant'
    const [formData, setFormData] = useState({});
    const [registrationResult, setRegistrationResult] = useState(null);
    const [error, setError] = useState('');

    // Step 1: Search
    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.get(`/search?phone=${phone}`);
            if (res.data.isRegistered) {
                setError('This person is already registered.');
                return;
            }
            setAttendeeData(res.data.attendee);
            // Pre-fill form data
            setFormData({
                fullName: res.data.attendee.fullName || '',
                email: res.data.attendee.email || '',
                phoneNumber: res.data.attendee.phoneNumber,
                titleRole: res.data.attendee.titleRole || '',
            });
            setStep(2);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError('This phone number is not pre-registered. Please ask an admin to add you.');
            } else {
                setError('Search failed. Please try again.');
            }
        }
    };

    // Step 2: Mode Selection
    const selectMode = (selectedMode) => {
        setMode(selectedMode);
        setFormData(prev => ({ ...prev, attendeeMode: selectedMode }));
        setStep(3);
    };

    // Step 3: Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                isHackathonParticipant: mode === 'hackathon_participant',
                attendeeMode: mode,
            };
            const res = await api.post('/register', payload);
            setRegistrationResult(res.data);
            setStep(4);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Registration failed.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            // Handle interestedInSessions array
            if (name === 'interestedInSessions') {
                const current = formData.interestedInSessions || [];
                if (checked) {
                    setFormData({ ...formData, interestedInSessions: [...current, value] });
                } else {
                    setFormData({ ...formData, interestedInSessions: current.filter(item => item !== value) });
                }
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const reset = () => {
        setStep(1);
        setPhone('');
        setAttendeeData(null);
        setMode(null);
        setFormData({});
        setRegistrationResult(null);
        setError('');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Registration Desk</h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Enter phone number..."
                                    autoFocus
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
                            Search
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <p className="text-center text-gray-600 mb-4">Select Attendee Category for <strong>{attendeeData.fullName || phone}</strong></p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => selectMode('sessions_attendee')}
                                className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                            >
                                <User className="w-10 h-10 text-blue-500 mb-2" />
                                <span className="font-semibold text-gray-800">Sessions Attendee</span>
                            </button>
                            <button
                                onClick={() => selectMode('hackathon_participant')}
                                className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
                            >
                                <Briefcase className="w-10 h-10 text-purple-500 mb-2" />
                                <span className="font-semibold text-gray-800">Hackathon Participant</span>
                            </button>
                        </div>
                        <button onClick={() => setStep(1)} className="w-full text-gray-500 mt-4 hover:underline">Back</button>
                    </div>
                )}

                {step === 3 && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                            {mode === 'sessions_attendee' ? 'Sessions Attendee Details' : 'Hackathon Participant Details'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                                <input
                                    name="fullName"
                                    value={formData.fullName || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md py-2 px-3 mt-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                                <input
                                    name="phoneNumber"
                                    value={formData.phoneNumber || ''}
                                    readOnly
                                    className="w-full border border-gray-300 rounded-md py-2 px-3 mt-1 bg-gray-100 text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email *</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md py-2 px-3 mt-1"
                                />
                            </div>

                            {mode === 'sessions_attendee' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Attendee Type *</label>
                                    <select
                                        name="attendeeType"
                                        value={formData.attendeeType || ''}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md py-2 px-3 mt-1"
                                    >
                                        <option value="">Select...</option>
                                        <option value="Attendee">Attendee</option>
                                        <option value="VIP">VIP</option>
                                        <option value="Mentor">Mentor</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title / Role</label>
                                <input
                                    name="titleRole"
                                    value={formData.titleRole || ''}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-md py-2 px-3 mt-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Company / University</label>
                                <input
                                    name="companyUniversity"
                                    value={formData.companyUniversity || ''}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-md py-2 px-3 mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Place of Residence</label>
                            <input
                                name="placeOfResidence"
                                value={formData.placeOfResidence || ''}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 mt-1"
                            />
                        </div>

                        {mode === 'sessions_attendee' && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Interested in sessions</label>
                                <div className="space-y-2">
                                    {['Dr. Ahmed Galal – Shaping Your Business Idea', 'Eng. Ahmad Alfy – Idea to Business Plan', 'Eng. Hosam Zewain – Vibe Coding'].map(session => (
                                        <label key={session} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                name="interestedInSessions"
                                                value={session}
                                                onChange={handleInputChange}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="text-sm text-gray-700">{session}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {mode === 'hackathon_participant' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Project Title *</label>
                                <input
                                    name="projectTitle"
                                    value={formData.projectTitle || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md py-2 px-3 mt-1"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">How did you hear about us?</label>
                            <textarea
                                name="howDidYouHear"
                                value={formData.howDidYouHear || ''}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 mt-1"
                                rows={3}
                            />
                        </div>

                        <div className="flex space-x-3 pt-4">
                            <button type="button" onClick={() => setStep(2)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition">
                                Back
                            </button>
                            <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition">
                                Complete Registration
                            </button>
                        </div>
                    </form>
                )}

                {step === 4 && registrationResult && (
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-green-100 p-4 rounded-full">
                                <Check className="w-12 h-12 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Registration Complete!</h2>
                        <p className="text-gray-600">
                            Welcome, <strong>{registrationResult.registration.fullName}</strong>.
                            <br />
                            An email has been sent to {registrationResult.registration.email}.
                        </p>

                        <div className="flex justify-center my-6">
                            <img src={registrationResult.qrCodeImage} alt="QR Code" className="w-48 h-48 border p-2 rounded-lg" />
                        </div>

                        <button onClick={reset} className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition">
                            Next Attendee
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
