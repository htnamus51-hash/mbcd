import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Mail, Phone, MessageSquare, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

function apiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${path}`;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  reason: string;
  message: string;
  preferred_contact_method: string;
  status: string;
  created_at: string;
  notes: string | null;
}

export function ContactsManagement() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/contacts'));
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setNotes(contact.notes || '');
  };

  const handleConvertToPatient = async (contactId: string) => {
    try {
      const response = await fetch(apiUrl(`/api/contacts/${contactId}/convert-to-patient`), {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to convert contact');
      alert('Contact converted to patient successfully!');
      fetchContacts();
      setSelectedContact(null);
    } catch (err) {
      alert('Error converting contact to patient');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      new: { bg: 'bg-blue-50', text: 'text-blue-700', icon: <AlertCircle className="w-3 h-3" /> },
      contacted: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Mail className="w-3 h-3" /> },
      converted_to_patient: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
      closed: { bg: 'bg-slate-50', text: 'text-slate-700', icon: <CheckCircle2 className="w-3 h-3" /> },
    };
    const config = statusConfig[status] || statusConfig.new;
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${config.bg} ${config.text} rounded-lg text-xs font-medium`}>
        {config.icon}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-slate-900 text-2xl font-bold">Contact Inquiries</h1>
        <p className="text-slate-600 mt-1">Manage patient contact form submissions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contacts List */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200 rounded-2xl max-h-[600px] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>All Inquiries</span>
                <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                  {contacts.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No inquiries yet</div>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      selectedContact?.id === contact.id
                        ? 'bg-cyan-50 border border-cyan-200'
                        : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-xs text-slate-600 truncate">{contact.email}</div>
                        <div className="text-xs text-slate-500 mt-1">{contact.reason}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contact Details */}
        <div className="lg:col-span-2">
          {selectedContact ? (
            <div className="space-y-4">
              {/* Main Info Card */}
              <Card className="border-slate-200 rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {selectedContact.first_name} {selectedContact.last_name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(selectedContact.status)}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {formatDate(selectedContact.created_at)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </div>
                      <div className="text-sm text-slate-900 break-all">{selectedContact.email}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Phone
                      </div>
                      <div className="text-sm text-slate-900">{selectedContact.phone || 'Not provided'}</div>
                    </div>
                  </div>

                  {/* Reason and Preference */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-600 mb-1">Reason</div>
                      <div className="text-sm text-slate-900">{selectedContact.reason}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-600 mb-1">Contact Method</div>
                      <div className="text-sm text-slate-900 capitalize">{selectedContact.preferred_contact_method}</div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-600 mb-2 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Message
                    </div>
                    <div className="text-sm text-slate-900 whitespace-pre-wrap">{selectedContact.message}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes and Actions */}
              <Card className="border-slate-200 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Notes & Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Internal Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Add follow-up notes, conversation details, etc."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm hover:bg-cyan-700 transition-colors">
                      Mark as Contacted
                    </button>
                    {selectedContact.status !== 'converted_to_patient' && (
                      <button
                        onClick={() => handleConvertToPatient(selectedContact.id)}
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition-colors"
                      >
                        Convert to Patient
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-slate-200 rounded-2xl h-96 flex items-center justify-center">
              <div className="text-center">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <div className="text-slate-500">Select a contact to view details</div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
