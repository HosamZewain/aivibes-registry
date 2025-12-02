import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, UserCheck, Loader, AlertCircle, Upload, CheckCircle, TrendingUp, BarChart, Search, Plus, Trash2, Edit2, X, Save } from 'lucide-react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('imports');
    const [imports, setImports] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Import state
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [uploadResult, setUploadResult] = useState(null);

    // Filter state
    const [filter, setFilter] = useState('');

    // CRUD State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ phoneNumber: '', fullName: '', email: '' });
    const [crudStatus, setCrudStatus] = useState('idle'); // idle, saving, deleting

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [importsRes, registrationsRes] = await Promise.all([
                api.get('/attendees'),
                api.get('/registrations')
            ]);
            setImports(importsRes.data.attendees || []);
            setRegistrations(registrationsRes.data.registrations || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploadStatus('uploading');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUploadResult(response.data);
            setUploadStatus('success');
            setFile(null);
            fetchData();
        } catch (error) {
            console.error(error);
            setUploadStatus('error');
        }
    };

    // CRUD Handlers
    const handleEdit = (attendee) => {
        setEditingId(attendee.id);
        setFormData({
            phoneNumber: attendee.phoneNumber,
            fullName: attendee.fullName || '',
            email: attendee.email || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this attendee?')) return;

        try {
            await api.delete(`/attendees/${id}`);
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Failed to delete attendee');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setCrudStatus('saving');

        try {
            if (editingId) {
                await api.put(`/attendees/${editingId}`, formData);
            } else {
                await api.post('/attendees', formData);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ phoneNumber: '', fullName: '', email: '' });
            fetchData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to save attendee');
        } finally {
            setCrudStatus('idle');
        }
    };

    // Filtering Logic
    const filteredImports = imports.filter(item => {
        const search = filter.toLowerCase();
        return (
            item.phoneNumber?.toLowerCase().includes(search) ||
            item.fullName?.toLowerCase().includes(search) ||
            item.email?.toLowerCase().includes(search)
        );
    });

    const filteredRegistrations = registrations.filter(item => {
        const search = filter.toLowerCase();
        return (
            item.phoneNumber?.toLowerCase().includes(search) ||
            item.fullName?.toLowerCase().includes(search) ||
            item.email?.toLowerCase().includes(search)
        );
    });

    const stats = {
        totalImports: imports.length,
        totalRegistrations: registrations.length,
        registrationRate: imports.length > 0 ? ((registrations.length / imports.length) * 100).toFixed(1) : 0,
        sessionsAttendees: registrations.filter(r => r.attendeeMode === 'sessions_attendee').length,
        hackathonParticipants: registrations.filter(r => r.attendeeMode === 'hackathon_participant').length,
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ phoneNumber: '', fullName: '', email: '' });
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" /> Add Attendee
                    </button>
                </div>

                {/* Import Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">Import Attendees</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload CSV File
                            </label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                        <p className="text-sm text-gray-500">
                                            <span className="font-semibold">Click to upload</span>
                                        </p>
                                        <p className="text-xs text-gray-500">CSV files only</p>
                                    </div>
                                    <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                                </label>
                            </div>
                            {file && <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>}
                        </div>

                        <div className="flex flex-col justify-center">
                            <button
                                onClick={handleUpload}
                                disabled={!file || uploadStatus === 'uploading'}
                                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors mb-2"
                            >
                                {uploadStatus === 'uploading' ? 'Uploading...' : 'Import Attendees'}
                            </button>

                            {uploadStatus === 'success' && uploadResult && (
                                <div className="p-3 bg-green-50 rounded-md flex items-start">
                                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-green-800">Import Successful</p>
                                        <p className="text-green-700">
                                            Success: {uploadResult.success} | Errors: {uploadResult.errors}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {uploadStatus === 'error' && (
                                <div className="p-3 bg-red-50 rounded-md flex items-center">
                                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                                    <p className="text-sm text-red-700">Failed to upload file.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pre-Registered</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalImports}</p>
                            </div>
                            <Users className="w-10 h-10 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Registered</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalRegistrations}</p>
                            </div>
                            <UserCheck className="w-10 h-10 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Registration Rate</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.registrationRate}%</p>
                            </div>
                            <TrendingUp className="w-10 h-10 text-purple-500" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Sessions</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.sessionsAttendees}</p>
                            </div>
                            <BarChart className="w-10 h-10 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Hackathon</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.hackathonParticipants}</p>
                            </div>
                            <BarChart className="w-10 h-10 text-purple-600" />
                        </div>
                    </div>
                </div>

                {/* Filter Input */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center gap-4">
                    <Search className="text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Filter by Name, Phone, or Email..."
                        className="flex-1 outline-none text-gray-700"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                    {filter && (
                        <button onClick={() => setFilter('')} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}

                <div className="flex space-x-4 mb-6 border-b border-gray-300">
                    <button
                        onClick={() => setActiveTab('imports')}
                        className={`pb-2 px-4 font-semibold transition ${activeTab === 'imports'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Users className="inline w-5 h-5 mr-2" />
                        Pre-Registered ({filteredImports.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('registrations')}
                        className={`pb-2 px-4 font-semibold transition ${activeTab === 'registrations'
                            ? 'border-b-2 border-green-600 text-green-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <UserCheck className="inline w-5 h-5 mr-2" />
                        Registered ({filteredRegistrations.length})
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader className="w-10 h-10 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {activeTab === 'imports' && (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Phone Number
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Full Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Title
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Created At
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredImports.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                                        No pre-registered attendees found
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredImports.map((attendee) => (
                                                    <tr key={attendee.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {attendee.phoneNumber}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {attendee.fullName || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {attendee.email || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {attendee.titleRole || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(attendee.createdAt).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => handleEdit(attendee)}
                                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(attendee.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'registrations' && (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Phone
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Full Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Mode
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Created At
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredRegistrations.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                                        No registrations found
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredRegistrations.map((reg) => (
                                                    <tr key={reg.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {reg.phoneNumber}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {reg.fullName}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {reg.email}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <span
                                                                className={`px-2 py-1 rounded-full text-xs font-medium ${reg.attendeeMode === 'hackathon_participant'
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                                    }`}
                                                            >
                                                                {reg.attendeeMode === 'hackathon_participant' ? 'Hackathon' : 'Sessions'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {reg.attendeeType || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(reg.createdAt).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* CRUD Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">{editingId ? 'Edit Attendee' : 'Add New Attendee'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSave}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={crudStatus === 'saving'}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
                                    >
                                        {crudStatus === 'saving' ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
