import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, ArrowRight, Check, X } from 'lucide-react';

function apiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${path}`;
}

interface Registration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: 'new' | 'pending' | 'verified' | 'rejected';
  created_at: string;
  source: 'Contact Form' | 'External Registration';
  details?: any; // Full object for modal
}

export function NewPatientRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'pending' | 'verified'>('all');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Modal State
  const [selectedPatient, setSelectedPatient] = useState<Registration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchRegistrations();
    // Refresh every 10 seconds
    const interval = setInterval(fetchRegistrations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchRegistrations = async () => {
    try {
      // setLoading(true); // Don't reload UI on interval
      
      // Fetch ONLY from contacts and patients (Strict separation from Auth/Users)
      const [contactsRes, patientsRes] = await Promise.all([
        fetch(apiUrl('/api/contacts')).catch(() => null),
        fetch(apiUrl('/api/patients')).catch(() => null),
      ]);

      const allRegistrations: Registration[] = [];

      // 1. External Patients (mbc_patients DB)
      if (patientsRes?.ok) {
        try {
          const patientData = await patientsRes.json();
          const patients = (patientData || [])
            .filter((p: any) => p.status !== 'converted_to_patient' && p.status !== 'rejected') // Only show pending/new
            .map((patient: any) => ({
              id: patient.id,
              first_name: patient.name?.split(' ')[0] || '',
              last_name: patient.name?.split(' ').slice(1).join(' ') || '',
              email: patient.email,
              phone: patient.phone,
              status: (patient.status === 'new' ? 'pending' : patient.status) as any, // Default external to pending
              created_at: patient.created_at,
              source: 'External Registration',
              details: patient
            }));
          allRegistrations.push(...patients);
        } catch (e) {
          console.error('Error parsing patients:', e);
        }
      }

      // 2. Contact Form Submissions
      if (contactsRes?.ok) {
        try {
          const contactData = await contactsRes.json();
          const contacts = (contactData || [])
            .filter((c: any) => c.status !== 'converted_to_patient' && c.status !== 'rejected')
            .map((contact: any) => ({
              id: contact.id || contact._id,
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email,
              phone: contact.phone,
              status: (contact.status === 'new' ? 'pending' : contact.status) as any,
              created_at: contact.created_at,
              source: 'Contact Form',
              details: contact
            }));
          allRegistrations.push(...contacts);
        } catch (e) {
          console.error('Error parsing contacts:', e);
        }
      }

      // Sort by date (newest first)
      const sorted = allRegistrations.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRegistrations(sorted);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reg: Registration, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let url = '';
      if (reg.source === 'Contact Form') {
        url = apiUrl(`/api/contacts/${reg.id}/convert-to-patient`);
        await fetch(url, { method: 'POST' });
      } else {
        url = apiUrl(`/api/patients/${reg.id}/convert-to-patient`);
        await fetch(url, { method: 'POST' });
      }
      // Refresh list immediately
      fetchRegistrations();
      // If modal is open, close it
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error approving patient:', err);
      alert('Failed to approve patient');
    }
  };

  const handleReject = async (reg: Registration, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to reject this patient? This will remove them from the list.')) return;
    
    try {
        let url = '';
        if (reg.source === 'Contact Form') {
          url = apiUrl(`/api/contacts/${reg.id}/reject`);
        } else {
          url = apiUrl(`/api/patients/${reg.id}/reject`);
        }
        await fetch(url, { method: 'PATCH' }); // Changed to PATCH to match backend
        fetchRegistrations();
        setIsModalOpen(false);
    } catch (err) {
        console.error('Error rejecting patient:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'verified': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const openModal = (reg: Registration) => {
    setSelectedPatient(reg);
    setIsModalOpen(true);
  };

  const totalPages = Math.ceil(registrations.length / ITEMS_PER_PAGE);
  const currentRegistrations = registrations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <Card className="border-slate-200 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              <CardTitle>New Patient Registrations</CardTitle>
            </div>
            <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full">
              Pending Action
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Registrations List */}
          <div className="space-y-3">
            {loading && registrations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Loading registrations...</div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No pending registrations</div>
            ) : (
              currentRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  onClick={() => openModal(reg)}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                      {reg.first_name?.[0]?.toUpperCase()}
                      {reg.last_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">
                            {reg.first_name} {reg.last_name}
                          </div>
                      </div>
                      <div className="text-xs text-slate-500 flex gap-2">
                         <span>{reg.source}</span>
                         <span>•</span>
                         <span className='italic'>{formatDate(reg.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => handleApprove(reg, e)}
                        className="p-1.5 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                        title="Approve & Convert"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={(e) => handleReject(reg, e)}
                        className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        title="Reject"
                    >
                        <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {registrations.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 rounded-lg transition-colors"
                >
                    Previous
                </button>
                <span className="text-xs text-slate-400">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 rounded-lg transition-colors"
                >
                    Next
                </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Detail Modal */}
      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">Patient Details</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                </button>
             </div>
             
             <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                      {selectedPatient.first_name?.[0]}
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-900">{selectedPatient.first_name} {selectedPatient.last_name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPatient.status)} uppercase`}>
                            {selectedPatient.status}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <label className="text-xs text-slate-500 block mb-1">Email Address</label>
                        <div className="text-sm font-medium text-slate-900">{selectedPatient.email}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <label className="text-xs text-slate-500 block mb-1">Phone Number</label>
                        <div className="text-sm font-medium text-slate-900">{selectedPatient.phone || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <label className="text-xs text-slate-500 block mb-1">Source</label>
                        <div className="text-sm font-medium text-slate-900">{selectedPatient.source}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <label className="text-xs text-slate-500 block mb-1">Submitted</label>
                        <div className="text-sm font-medium text-slate-900">{new Date(selectedPatient.created_at).toLocaleString()}</div>
                    </div>
                </div>

                {selectedPatient.source === 'Contact Form' && selectedPatient.details?.message && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <label className="text-xs text-slate-500 block mb-2 font-bold uppercase">Message</label>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedPatient.details.message}</p>
                    </div>
                )}
             </div>

             <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50">
                <button 
                    onClick={(e) => handleReject(selectedPatient, e)}
                    className="flex-1 py-2.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl font-medium transition-colors"
                >
                    Reject
                </button>
                <button 
                    onClick={(e) => handleApprove(selectedPatient, e)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl font-medium hover:brightness-110 transition-all shadow-sm"
                >
                    Approve & Convert
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}