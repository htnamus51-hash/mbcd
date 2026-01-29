import { Calendar, Clock, UserPlus, ClipboardList, Plus, FileText, Upload, Users, Activity, CheckCircle2, TrendingUp, X, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState, useEffect } from 'react';
import { apiUrl } from '@/config';
import { NewPatientRegistrations } from './NewPatientRegistrations';

interface DashboardHomeProps {
  onNavigate?: (page: string) => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [todaysSessions, setTodaysSessions] = useState<any[]>([]);
  const [todaysNotes, setTodaysNotes] = useState<any[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [thisWeekSessions, setThisWeekSessions] = useState(0);
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Note form state
  const [noteType, setNoteType] = useState('Progress Note');
  const [noteContent, setNoteContent] = useState('');
  const [noteDate, setNoteDate] = useState(getTodayDateStr());
  const [noteTime, setNoteTime] = useState('09:00');
  // Add Client form state
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientDob, setClientDob] = useState('');
  const [clientGender, setClientGender] = useState('');
  
  // Appointment form state
  const [appointmentDoctor, setAppointmentDoctor] = useState('Dr. Rebecca Smith');
  const [appointmentClient, setAppointmentClient] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(getTodayDateStr());
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [appointmentDuration, setAppointmentDuration] = useState('60');
  const [appointmentType, setAppointmentType] = useState('Therapy Session');

  // Submit new appointment to backend
  const createAppointment = async () => {
    if (!appointmentClient) {
      alert('Please select a patient');
      return;
    }

    // Get actual today's date and current time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    // Validate appointment date/time
    if (appointmentDate < today) {
      alert('⚠️ Cannot create appointment for a past date');
      return;
    }
    
    if (appointmentDate === today && appointmentTime <= currentTime) {
      alert('⚠️ Cannot create appointment for a time that has already passed. Please set a future time or choose tomorrow.');
      return;
    }

    // Create datetime with explicit Z suffix for UTC
    const datetime = `${appointmentDate}T${appointmentTime}:00Z`;
    const duration = parseInt(appointmentDuration);

    try {
      // First, check availability
      const availRes = await fetch(
        apiUrl(`/api/appointments/check-availability?doctor=${encodeURIComponent(appointmentDoctor)}&datetime_str=${encodeURIComponent(datetime)}&duration=${duration}`)
      );
      
      if (!availRes.ok) {
        alert('Error checking availability');
        return;
      }

      const availData = await availRes.json();
      if (!availData.available) {
        alert(`⚠️ Time slot not available!\n\n${availData.message}\n\nPlease choose a different time.`);
        return;
      }

      // If available, proceed with creating the appointment
      const payload = {
        doctor: appointmentDoctor,
        client: appointmentClient,
        datetime: datetime,
        purpose: appointmentType,
        duration: duration,
      };

      const res = await fetch(apiUrl('/api/appointments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Failed to create appointment', err);
        try {
          const errData = JSON.parse(err);
          alert(`Failed: ${errData.detail}`);
        } catch {
          alert('Failed to create appointment');
        }
        return;
      }

      const data = await res.json();
      console.log('Created appointment', data);
      // Dispatch event so AppointmentsPage can refresh
      try {
        window.dispatchEvent(new CustomEvent('appointment:created', { detail: data }));
      } catch (e) {
        // ignore
      }
      // Reset form and close modal
      setAppointmentDoctor('Dr. Rebecca Smith');
      setAppointmentClient('');
      setAppointmentDate('2025-11-18');
      setAppointmentTime('09:00');
      setAppointmentDuration('60');
      setAppointmentType('Therapy Session');
      setShowAppointmentModal(false);
      alert('✅ Appointment created successfully!');
    } catch (error) {
      console.error('Error creating appointment', error);
      alert('Error creating appointment');
    }
  };

  // Submit new client to backend
  const createClient = async () => {
    const payload = {
      first_name: clientFirstName,
      last_name: clientLastName,
      email: clientEmail,
      phone: clientPhone,
      date_of_birth: clientDob,
      gender: clientGender,
    };

    try {
      const res = await fetch(apiUrl('/api/clients'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Failed to create client', err);
        alert('Failed to create client');
        return;
      }

      const data = await res.json();
      console.log('Created client', data);
      // Dispatch a global event so other components (like ClientsPage) can refresh
      try {
        window.dispatchEvent(new CustomEvent('client:created', { detail: data }));
      } catch (e) {
        // ignore in non-browser environments
      }
      // Reset form and close modal
      setClientFirstName('');
      setClientLastName('');
      setClientEmail('');
      setClientPhone('');
      setClientDob('');
      setClientGender('');
      setShowAddClientModal(false);
      // Optional: notify user
      alert('Client added successfully');
    } catch (error) {
      console.error('Error creating client', error);
      alert('Error creating client');
    }
  };

  // Submit new note to backend
  const createNote = async () => {
    if (!noteContent.trim()) {
      alert('Please enter note content');
      return;
    }

    const today = '2025-11-20'; // Current date
    const currentTime = '15:34'; // Current time

    // Validate reminder date/time
    if (noteDate && noteTime) {
      // Don't allow past dates
      if (noteDate < today) {
        alert('⚠️ Cannot set reminder for a past date');
        return;
      }
      
      // If reminder is for today, check if time has passed
      if (noteDate === today && noteTime <= currentTime) {
        alert('⚠️ Cannot set reminder for a time that has already passed. Please set a future time or choose tomorrow.');
        return;
      }
    } else if (noteDate && !noteTime) {
      alert('Please set a reminder time');
      return;
    } else if (!noteDate && noteTime) {
      alert('Please set a reminder date');
      return;
    }

    const payload = {
      note_type: noteType,
      content: noteContent,
      client_id: null, // Could be extended to link to a specific client
      reminder_date: noteDate,
      reminder_time: noteTime,
    };

    try {
      const res = await fetch(apiUrl('/api/notes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Failed to create note', err);
        alert('Failed to create note');
        return;
      }

      const data = await res.json();
      console.log('Created note', data);
      // Dispatch event so NotesPage can refresh
      try {
        window.dispatchEvent(new CustomEvent('note:created', { detail: data }));
      } catch (e) {
        // ignore
      }
      // Reset form and close modal
      setNoteType('Progress Note');
      setNoteContent('');
      setNoteDate('2025-11-20');
      setNoteTime('09:00');
      setShowAddNoteModal(false);
      alert('✅ Note saved successfully!');
    } catch (error) {
      console.error('Error creating note', error);
      alert('Error creating note');
    }
  };

  // Mark note as completed
  const completeNote = async (noteId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/notes/${noteId}/complete`), {
        method: 'PATCH',
      });

      if (!res.ok) {
        alert('Failed to complete note');
        return;
      }

      // Remove from today's notes list
      setTodaysNotes(todaysNotes.filter((note: any) => note.id !== noteId));
      
      // Dispatch event to update NotesPage
      window.dispatchEvent(new CustomEvent('note:updated', { detail: { id: noteId, completed: true } }));
      
      console.log('✅ Note marked as completed:', noteId);
    } catch (error) {
      console.error('Error completing note', error);
      alert('Error completing note');
    }
  };

  // Delete note from database
  const deleteNoteFromDashboard = async (noteId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/notes/${noteId}`), {
        method: 'DELETE',
      });

      if (!res.ok) {
        alert('Failed to delete note');
        return;
      }

      // Remove from display
      setTodaysNotes(todaysNotes.filter((note: any) => note.id !== noteId));
      window.dispatchEvent(new CustomEvent('note:deleted', { detail: { id: noteId } }));
    } catch (error) {
      console.error('Error deleting note', error);
      alert('Error deleting note');
    }
  };

  // Fetch today's appointments, notes, clients and weekly sessions
  useEffect(() => {
    const fetchTodayData = async () => {
      // Get actual today's date
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;
      
      try {
        // Fetch all clients
        const clientRes = await fetch(apiUrl('/api/clients'));
        if (clientRes.ok) {
          const clients = await clientRes.json();
          setTotalClients(clients.length);
        }

        // Fetch all appointments
        const apptRes = await fetch(apiUrl('/api/appointments'));
        if (apptRes.ok) {
          const appts = await apptRes.json();
          
          // Count sessions for this week
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
          
          const weekSessions = appts.filter((appt: any) => {
            const apptDate = new Date(appt.datetime.split('T')[0]);
            return apptDate >= weekStart && apptDate <= weekEnd;
          });
          setThisWeekSessions(weekSessions.length);
          
          // Filter for today only AND future times only
          const todayAppts = appts.filter((appt: any) => {
            const apptDate = appt.datetime.split('T')[0];
            if (apptDate !== today) return false;
            
            // Filter out past times
            const timeStr = appt.datetime.split('T')[1].substring(0, 5);
            return timeStr >= currentTime; // Only show future appointments
          }).map((appt: any) => {
            const timeStr = appt.datetime.split('T')[1].substring(0, 5);
            const [hours, mins] = timeStr.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
            return {
              id: appt.id,
              client: appt.client,
              time: `${displayHour}:${mins} ${ampm}`,
              type: appt.purpose,
              status: 'upcoming',
              doctor: appt.doctor
            };
          });
          setTodaysSessions(todayAppts);
        }

        // Fetch all notes
        const notesRes = await fetch(apiUrl('/api/notes'));
        if (notesRes.ok) {
          const notes = await notesRes.json();
          
          // Filter for today based on REMINDER DATE - only if reminder_date is actually set
          // AND the reminder time hasn't passed yet
          const todayNotes = notes.filter((note: any) => {
            // Skip completed notes
            if (note.completed) return false;
            
            if (note.reminder_date !== today) return false;
            
            // If reminder has a time set, check if it has passed
            if (note.reminder_time) {
              return note.reminder_time >= currentTime; // Show only future times
            }
            
            return true; // Show if no time is set
          });
          setTodaysNotes(todayNotes);
        }
      } catch (error) {
        console.error('Error fetching today data', error);
      }
    };

    fetchTodayData();

    // Listen for appointment/note creation events
    const handleAppointmentCreated = () => fetchTodayData();
    const handleNoteCreated = () => fetchTodayData();
    const handleClientCreated = () => fetchTodayData();
    
    window.addEventListener('appointment:created', handleAppointmentCreated);
    window.addEventListener('note:created', handleNoteCreated);
    window.addEventListener('client:created', handleClientCreated);

    return () => {
      window.removeEventListener('appointment:created', handleAppointmentCreated);
      window.removeEventListener('note:created', handleNoteCreated);
      window.removeEventListener('client:created', handleClientCreated);
    };
  }, []);

  // const newRegistrations = [
  //   { id: 1, name: 'Amanda Foster', email: 'amanda.f@email.com', date: '2 hours ago', status: 'pending', source: 'mbctherapy.com' },
  //   { id: 2, name: 'Robert Kim', email: 'robert.kim@email.com', date: '5 hours ago', status: 'verified', source: 'mbctherapy.com' },
  //   { id: 3, name: 'Jessica Martinez', email: 'j.martinez@email.com', date: '1 day ago', status: 'new', source: 'mbctherapy.com' },
  // ];

  // const pendingTasks = [
  //   { id: 1, task: 'Complete progress notes for Sarah Johnson', type: 'note', priority: 'high' },
  //   { id: 2, task: 'Review intake form for Michael Chen', type: 'form', priority: 'medium' },
  //   { id: 3, task: 'Respond to message from Emily Rodriguez', type: 'message', priority: 'high' },
  //   { id: 4, task: 'Upload treatment plan for David Thompson', type: 'document', priority: 'low' },
  // ];

  const quickActions = [
    { icon: UserPlus, label: 'Add Client', color: 'from-sky-500 to-blue-500', action: () => setShowAddClientModal(true) },
    { icon: Calendar, label: 'Create Appointment', color: 'from-cyan-500 to-teal-500', action: () => setShowAppointmentModal(true) },
    { icon: FileText, label: 'Add Note', color: 'from-blue-500 to-cyan-500', action: () => setShowAddNoteModal(true) },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-slate-900">Welcome back, Dr. Smith</h1>
        <p className="text-slate-600 mt-1">Here's what's happening with your practice today.</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-slate-200 rounded-2xl cursor-pointer hover:shadow-lg transition-all" onClick={() => onNavigate?.('clients')}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Clients</p>
                <p className="text-slate-900 mt-2">{totalClients}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
                  <TrendingUp className="w-3 h-3" />
                  <span>Monthly registrations</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 rounded-2xl cursor-pointer hover:shadow-lg transition-all" onClick={() => onNavigate?.('appointments')}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600">Sessions This Week</p>
                <p className="text-slate-900 mt-2">{thisWeekSessions}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Appointments scheduled</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 rounded-2xl cursor-pointer hover:shadow-lg transition-all" onClick={() => onNavigate?.('notes')}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending Tasks</p>
                <p className="text-slate-900 mt-2">{todaysNotes.length}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                  <span>Notes to complete</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Important Notes */}
        <Card className="lg:col-span-2 border-slate-200 rounded-2xl cursor-pointer hover:shadow-lg transition-all" onClick={() => onNavigate?.('notes')}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Important Notes</span>
              </CardTitle>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            {todaysNotes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-600">No pending notes</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddNoteModal(true);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                >
                  + Add Note
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysNotes.slice(0, 3).map((note: any) => (
                  <div 
                    key={note.id} 
                    className="group flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={note.completed || false}
                      onChange={() => completeNote(note.id)}
                      className="mt-1 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {note.note_type}
                        </Badge>
                        {note.reminder_time && (
                          <span className="text-xs text-slate-500">{note.reminder_time}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {note.content}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNoteFromDashboard(note.id);
                      }}
                      className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {todaysNotes.length > 3 && (
                  <button className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    View all notes ({todaysNotes.length})
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-slate-200 rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  onClick={action.action}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-slate-900">{action.label}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* New Patient Registrations from Contact Form */}
      <NewPatientRegistrations />

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setShowAppointmentModal(false)}
          />
          
          {/* Modal Card */}
          <Card className="relative w-full max-w-lg border-slate-200 rounded-2xl shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Create New Appointment</CardTitle>
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-700 mb-2 block">Doctor Name</label>
                <select
                  value={appointmentDoctor}
                  onChange={(e) => setAppointmentDoctor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option>Dr. Rebecca Smith</option>
                  <option>Dr. John Anderson</option>
                  <option>Dr. Sarah Williams</option>
                  <option>Dr. Michael Brown</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-700 mb-2 block">Patient Name</label>
                <select
                  value={appointmentClient}
                  onChange={(e) => setAppointmentClient(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="">Select a patient</option>
                  <option value="Sarah Johnson">Sarah Johnson</option>
                  <option value="Michael Chen">Michael Chen</option>
                  <option value="Emily Rodriguez">Emily Rodriguez</option>
                  <option value="David Thompson">David Thompson</option>
                  <option value="Lisa Anderson">Lisa Anderson</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-700 mb-2 block">Date</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm text-slate-700 mb-2 block">Time</label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm text-slate-700 mb-2 block">Duration (minutes)</label>
                <select
                  value={appointmentDuration}
                  onChange={(e) => setAppointmentDuration(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="30">30</option>
                  <option value="45">45</option>
                  <option value="60">60</option>
                  <option value="90">90</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-700 mb-2 block">Session Type</label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option>Initial Consultation</option>
                  <option>Follow-up Session</option>
                  <option>Therapy Session</option>
                  <option>CBT Session</option>
                  <option>Couples Therapy</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    createAppointment();
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl text-sm hover:from-cyan-700 hover:to-teal-700 transition-all"
                >
                  Create Appointment
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setShowAddClientModal(false)}
          />
          
          {/* Modal Card */}
          <Card className="relative w-full max-w-lg border-slate-200 rounded-2xl shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Add New Client</CardTitle>
                <button
                  onClick={() => setShowAddClientModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-700 mb-2 block">First Name</label>
                  <input
                    type="text"
                    value={clientFirstName}
                    onChange={(e) => setClientFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
              </div>

              <div>
                <label className="text-sm text-slate-700 mb-2 block">Last Name</label>
                  <input
                    type="text"
                    value={clientLastName}
                    onChange={(e) => setClientLastName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
              </div>

              <div>
                <label className="text-sm text-slate-700 mb-2 block">Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
              </div>

              <div>
                <label className="text-sm text-slate-700 mb-2 block">Phone Number</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
              </div>

              <div>
                <label className="text-sm text-slate-700 mb-2 block">Date of Birth</label>
                  <input
                    type="date"
                    value={clientDob}
                    onChange={(e) => setClientDob(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
              </div>

              <div>
                <label className="text-sm text-slate-700 mb-2 block">Gender</label>
                <select
                  value={clientGender}
                  onChange={(e) => setClientGender(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="">Select a gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddClientModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    createClient();
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl text-sm hover:from-cyan-700 hover:to-teal-700 transition-all"
                >
                  Add Client
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setShowAddNoteModal(false)}
          />
          
          {/* Modal Card */}
          <Card className="relative w-full max-w-lg border-slate-200 rounded-2xl shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Add Note</CardTitle>
                <button
                  onClick={() => setShowAddNoteModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-700 mb-2 block">Note Type</label>
                <select 
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option>Progress Note</option>
                  <option>Intake Form</option>
                  <option>Session Summary</option>
                  <option>Treatment Plan</option>
                  <option>Assessment</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-700 mb-2 block">Note Content</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter your note here..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-700 mb-2 block">Reminder Date</label>
                  <input
                    type="date"
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                    min="2025-11-20"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500 mt-1">Min date: Nov 20, 2025</p>
                </div>
                <div>
                  <label className="text-sm text-slate-700 mb-2 block">Reminder Time</label>
                  <input
                    type="time"
                    value={noteTime}
                    onChange={(e) => setNoteTime(e.target.value)}
                    min={noteDate === '2025-11-20' ? '15:34' : undefined}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  {noteDate === '2025-11-20' && (
                    <p className="text-xs text-slate-500 mt-1">Min time today: 15:34</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddNoteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createNote}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl text-sm hover:from-cyan-700 hover:to-teal-700 transition-all"
                >
                  Add Note
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}