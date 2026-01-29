import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Video, Calendar as CalendarIcon, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { apiUrl } from '@/config';

export function AppointmentsPage() {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date()); // Use actual today's date
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  
  // Appointment form state
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentDoctor, setAppointmentDoctor] = useState('Dr. Rebecca Smith');
  const [appointmentClient, setAppointmentClient] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
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
      // Dispatch event so AppointmentsPage can refresh (and self)
      try {
        window.dispatchEvent(new CustomEvent('appointment:created', { detail: data }));
      } catch (e) {
        // ignore
      }
      
      // Refresh local list immediately as well
      fetchAppointments();

      // Reset form and close modal
      setAppointmentDoctor('Dr. Rebecca Smith');
      setAppointmentClient('');
      // Keep date as is or reset to today? Let's keep it reset to today to be safe
      const now2 = new Date();
      setAppointmentDate(now2.toISOString().split('T')[0]);
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

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/appointments'));
      if (!res.ok) {
        console.error('Failed to fetch appointments');
        setAppointments([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      // Normalize backend response with proper date/time extraction
      const list = (data || []).map((appt: any) => {
        // Parse datetime string directly from ISO format (e.g., "2025-11-20T09:00:00Z")
        const parts = appt.datetime.split('T');
        const dateStr = parts[0]; // YYYY-MM-DD
        const timeStr = parts[1]; // HH:MM:SSZ
        const timeOnly = timeStr.split(':').slice(0, 2).join(':'); // HH:MM
        
        // Convert 24-hour to 12-hour format
        const [hoursStr, minutesStr] = timeOnly.split(':');
        const hours = parseInt(hoursStr);
        const minutes = minutesStr;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 === 0 ? 12 : hours % 12;
        const formattedTime = `${displayHours}:${minutes} ${ampm}`;
        
        return {
          id: appt.id || appt._id || Math.random(),
          client: appt.client || '',
          doctor: appt.doctor || 'Dr. TBD',
          datetime: appt.datetime,
          date: dateStr,
          time: formattedTime,
          hour24: hours, // Store 24-hour format specifically
          duration: appt.duration || 60,
          purpose: appt.purpose || 'Session',
          type: 'video',
          status: appt.status || 'confirmed',
          image: '',
        };
      });
      setAppointments(list);
      console.log('Appointments fetched:', list);
    } catch (err) {
      console.error('Error fetching appointments', err);
      setAppointments([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();

    const handler = () => fetchAppointments();
    window.addEventListener('appointment:created', handler as EventListener);
    return () => window.removeEventListener('appointment:created', handler as EventListener);
  }, []);

  // Get today's date in YYYY-MM-DD format
  const getTodayDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateStr = getTodayDateStr();

  // Get appointments for today
  const getTodayAppointments = () => {
    return appointments.filter((appt) => appt.date === todayDateStr).sort((a, b) => {
      const timeA = a.time.split(':')[0] + a.time.split(':')[1];
      const timeB = b.time.split(':')[0] + b.time.split(':')[1];
      return timeA.localeCompare(timeB);
    });
  };

  // WEEK VIEW HELPERS
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentDate);
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Create 24-hour slots to ensure all appointments (e.g. 7 PM, 9 PM) are visible
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const ampm = i >= 12 ? 'PM' : 'AM';
    const hour = i % 12 || 12; // 0 -> 12, 1 -> 1, ..., 12 -> 12, 13 -> 1
    return `${String(hour).padStart(2, '0')}:00 ${ampm}`;
  });

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekDisplayText = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${weekEnd.getFullYear()}`;

  const getAppointmentsForDayAndTime = (dayIndex: number, timeSlot: string) => {
    const targetDate = new Date(weekStart);
    targetDate.setDate(targetDate.getDate() + dayIndex);
    
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${day}`;

    // Convert timeSlot to hour (e.g. "09:00 AM" -> 9, "01:00 PM" -> 13)
    const [timeStr, ampm] = timeSlot.split(' ');
    let slotHour = parseInt(timeStr.split(':')[0]);
    if (ampm === 'PM' && slotHour !== 12) slotHour += 12;
    if (ampm === 'AM' && slotHour === 12) slotHour = 0;

    return appointments.filter((appt) => {
      if (appt.date !== targetDateStr) return false;
      // Match appointment to slot if it falls within the hour
      // Using hour24 computed earlier
      return appt.hour24 === slotHour;
    });
  };

  // DAY VIEW HELPERS
  const getDayDateStr = () => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDayAppointments = () => {
    const dayStr = getDayDateStr();
    return appointments.filter((appt) => appt.date === dayStr).sort((a, b) => {
      return (a.hour24 || 0) - (b.hour24 || 0);
    });
  };


  // ------------------------------------------------------------------
  // DATA PROCESSING & LOOKUPS :
  // ------------------------------------------------------------------
  // Create a lookup map for faster access: { "YYYY-MM-DD-H": [appt, ...] }
  // keys like: "2026-01-28-19" for 7 PM
  const appointmentsMap = appointments.reduce((acc, appt) => {
    // appt.hour24 is already parsed as integer 0-23
    const key = `${appt.date}-${appt.hour24}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(appt);
    return acc;
  }, {} as Record<string, any[]>);

  const getAppointmentsForSlot = (dateStr: string, hour: number) => {
    const key = `${dateStr}-${hour}`;
    return appointmentsMap[key] || [];
  };

  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter(a => a.date === dateStr);
  };
  // ------------------------------------------------------------------
  // CALENDAR GRID GENERATION (Month View)
  // ------------------------------------------------------------------ 
  const generateMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed
    
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Start from the Sunday before the 1st (or the 1st if it is Sunday)
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(1 - startDayOfWeek);

    const days = [];
    const today = new Date();

    // Generate fixed 6 weeks (42 days)
    for (let i = 0; i < 42; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const isCurrentMonth = d.getMonth() === month;
        const isToday = d.getDate() === today.getDate() && 
                        d.getMonth() === today.getMonth() && 
                        d.getFullYear() === today.getFullYear();
        
        days.push({
            date: d,
            dateStr,
            dayOfMonth: d.getDate(),
            isCurrentMonth,
            isToday,
            appointments: getAppointmentsForDate(dateStr)
        });
    }
    return days;
  };
  
  const calendarGridDays = generateMonthGrid();

  // ------------------------------------------------------------------
  // WEEK VIEW GENERATION
  // ------------------------------------------------------------------
  
  const weekDates = weekDays.map((_, index) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + index);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
        date: d,
        dateStr,
        dayName: weekDays[index]
    };
  });

  // Helper needed for DatePicker
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Navigation helpers
  const goToPreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Date picker helpers
  const handleDateSelect = (day: number) => {
    const newDate = new Date(tempDate);
    newDate.setDate(day);
    setCurrentDate(newDate);
    setShowDatePicker(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Appointments</h1>
          <p className="text-slate-600 mt-1">Manage your schedule and upcoming sessions</p>
        </div>
        <button 
          onClick={() => setShowAppointmentModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Schedule Appointment
        </button>
      </div>

      <Card className="border-slate-200 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={goToPreviousPeriod}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div 
                  className="text-slate-900 cursor-pointer hover:bg-slate-100 px-3 py-1 rounded-lg transition-colors relative"
                  onClick={() => {
                    setTempDate(currentDate);
                    setShowDatePicker(!showDatePicker);
                  }}
                >
                  {viewMode === 'month' 
                    ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : viewMode === 'week'
                    ? weekDisplayText
                    : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
                  }
                  {showDatePicker && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50">
                      <div className="w-64">
                        <div className="flex items-center justify-between mb-4">
                          <button onClick={() => setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth() - 1))}>
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="font-semibold">{tempDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                          <button onClick={() => setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth() + 1))}>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        <div 
                          className="grid grid-cols-7 gap-2 text-center text-sm"
                          style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
                        >
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="font-semibold text-slate-500 text-xs">{day}</div>
                          ))}
                          {Array.from({ length: new Date(tempDate.getFullYear(), tempDate.getMonth(), 1).getDay() }).map((_, i) => (
                            <div key={`empty-${i}`}></div>
                          ))}
                          {Array.from({ length: getDaysInMonth(tempDate) }).map((_, i) => {
                            const day = i + 1;
                            const isSelected = day === currentDate.getDate() && tempDate.getMonth() === currentDate.getMonth() && tempDate.getFullYear() === currentDate.getFullYear();
                            return (
                              <button
                                key={day}
                                onClick={() => handleDateSelect(day)}
                                className={`p-2 rounded text-sm ${isSelected ? 'bg-cyan-500 text-white' : 'hover:bg-slate-100'}`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={goToNextPeriod}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <button className="px-3 py-1.5 text-sm text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors" onClick={goToToday}>
                Today
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  viewMode === 'day'
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  viewMode === 'week'
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  viewMode === 'month'
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col min-h-[600px] overflow-hidden">
          {viewMode === 'week' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
              {/* Header Row */}
              <div 
                className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 shrink-0 w-full"
                style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}
              >
                <div className="p-3 text-xs font-semibold text-slate-500 border-r border-slate-200 text-center">Time</div>
                {weekDates.map((d) => {
                   const isToday = d.date.toDateString() === new Date().toDateString();
                   return (
                    <div key={d.dateStr} className={`p-2 text-center border-r border-slate-200 last:border-r-0 ${isToday ? 'bg-cyan-50' : ''}`}>
                      <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-cyan-700' : 'text-slate-500'}`}>{d.dayName}</div>
                      <div className={`text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto ${isToday ? 'bg-cyan-600 text-white' : 'text-slate-900'}`}>
                        {d.date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time Slots Grid */}
              <div className="overflow-y-auto flex-1 h-full scrollbar-thin scrollbar-thumb-slate-300 w-full">
                {timeSlots.map((timeLabel, hourIndex) => (
                  <div 
                    key={timeLabel} 
                    className="grid grid-cols-8 border-b border-slate-100 min-h-[60px] w-full"
                    style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}
                  >
                    {/* Time Label Column */}
                    <div className="p-2 text-xs text-slate-500 text-right bg-slate-50 border-r border-slate-200 sticky left-0 z-10 flex items-start justify-end">
                      <span className="-mt-2.5 bg-slate-50 px-1">{timeLabel}</span>
                    </div>

                    {/* Days Columns */}
                    {weekDates.map((d) => {
                      const slotAppts = getAppointmentsForSlot(d.dateStr, hourIndex);
                      return (
                        <div
                          key={`${d.dateStr}-${hourIndex}`}
                          className="border-r border-slate-100 last:border-r-0 relative p-1 transition-colors hover:bg-slate-50"
                        >
                          {slotAppts.map((appt) => {
                             const isTherapy = appt.purpose.toLowerCase().includes('therapy') || appt.purpose.toLowerCase().includes('consultation');
                             const isYoga = appt.purpose.toLowerCase().includes('yoga');
                             const bgColor = isTherapy ? 'bg-blue-100 text-blue-700 border-blue-200' : isYoga ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-cyan-100 text-cyan-700 border-cyan-200';
                             
                             return (
                              <div 
                                key={appt.id} 
                                className={`text-[11px] p-1.5 rounded mb-1 border-l-2 shadow-sm cursor-pointer hover:brightness-95 truncate font-medium ${bgColor}`}
                                title={`${appt.time} - ${appt.client} (${appt.purpose})`}
                              >
                                {appt.client}
                              </div>
                             );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'day' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
               {/* Day Header */}
               <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0 text-center w-full">
                  <h2 className="text-lg font-bold text-slate-800">
                    {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h2>
               </div>

               {/* Day Slots */}
               <div className="overflow-y-auto flex-1 h-full w-full">
                  {timeSlots.map((timeLabel, hourIndex) => {
                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                    const slotAppts = getAppointmentsForSlot(dateStr, hourIndex);
                    
                    return (
                        <div 
                            key={timeLabel} 
                            className="grid grid-cols-12 border-b border-slate-100 min-h-[80px] w-full"
                            style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}
                        >
                            <div className="col-span-2 md:col-span-1 p-3 text-sm text-slate-500 text-right border-r border-slate-200 bg-slate-50 pt-2">
                                {timeLabel}
                            </div>
                            <div className="col-span-10 md:col-span-11 p-2 relative hover:bg-slate-50 transition-colors group">
                                {slotAppts.length > 0 ? (
                                    <div className="flex gap-2 flex-wrap">
                                        {slotAppts.map((appt) => (
                                            <div key={appt.id} className="flex-1 min-w-[200px] p-3 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-cyan-500">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{appt.client}</div>
                                                        <div className="text-xs text-slate-500 mt-1">{appt.purpose} • {appt.duration} min</div>
                                                    </div>
                                                    <div className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">{appt.doctor}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full w-full opacity-0 group-hover:opacity-100 flex items-center pl-4 text-xs text-slate-400">
                                        Click to add
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                  })}
               </div>
            </div>
          )}

          {viewMode === 'month' && (
            <div className="flex-1 flex flex-col h-full bg-white w-full">
              {/* Header Days */}
              <div 
                className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 shrink-0 w-full"
                style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
              >
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                  <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 border-r border-slate-200 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div 
                className="grid grid-cols-7 flex-1 bg-slate-200 gap-px border-b border-slate-200 overflow-y-auto w-full"
                style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
              >
                {calendarGridDays.map((dayObj, i) => (
                  <div
                    key={i}
                    className={`
                      bg-white p-2 min-h-[120px] flex flex-col gap-1 relative transition-colors hover:bg-slate-50
                      ${!dayObj.isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : ''}
                      ${dayObj.isToday ? 'bg-cyan-50/30' : ''}
                      cursor-pointer
                    `}
                    onClick={() => {
                        setCurrentDate(dayObj.date);
                        setViewMode('day');
                    }}
                  >
                    {/* Date Number */}
                    <div className="flex justify-between items-start">
                      <span className={`
                        text-xs font-semibold h-7 w-7 flex items-center justify-center rounded-full
                        ${dayObj.isToday ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-700'}
                      `}>
                        {dayObj.dayOfMonth}
                      </span>
                      {dayObj.appointments.length > 0 && (
                        <span className="text-[10px] font-medium text-slate-400">
                           {dayObj.appointments.length} events
                        </span>
                      )}
                    </div>

                    {/* Appointments Stack */}
                    <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                        {dayObj.appointments.slice(0, 3).map((appt: any) => {
                            const isTherapy = appt.purpose.toLowerCase().includes('therapy') || appt.purpose.toLowerCase().includes('consultation');
                            const isYoga = appt.purpose.toLowerCase().includes('yoga');
                            const bgClass = isTherapy ? 'bg-blue-100 text-blue-700 border-blue-200' : isYoga ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-cyan-100 text-cyan-700 border-cyan-200';
                            
                            return (
                                <div 
                                    key={appt.id} 
                                    className={`${bgClass} border text-[10px] px-1.5 py-1 rounded-[4px] truncate font-medium shadow-sm transition-transform hover:scale-[1.02]`}
                                    title={`${appt.time} - ${appt.client} (${appt.purpose})`}
                                >
                                    <span className="opacity-75 mr-1">{appt.time.split(' ')[0]}</span>
                                    {appt.client}
                                </div>
                            );
                        })}
                        {dayObj.appointments.length > 3 && (
                            <div className="text-[10px] text-slate-500 pl-1 font-medium hover:text-cyan-600">
                                +{dayObj.appointments.length - 3} more
                            </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Appointments List */}
      <Card className="border-slate-200 rounded-2xl">
        <CardHeader>
          <CardTitle>Today's Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-slate-600">Loading appointments...</p>
          ) : (
            (() => {
              const todayAppts = getTodayAppointments();
              if (todayAppts.length === 0) {
                return <p className="text-slate-600">No appointments scheduled for today.</p>;
              }
              return todayAppts.map((appointment) => {
                const isTherapy = appointment.purpose.toLowerCase().includes('therapy') || appointment.purpose.toLowerCase().includes('consultation') || appointment.purpose.toLowerCase().includes('cbt');
                const isYoga = appointment.purpose.toLowerCase().includes('yoga');
                const bgColor = isTherapy ? 'bg-blue-50' : isYoga ? 'bg-green-50' : 'bg-slate-50';
                const borderColor = isTherapy ? 'border-blue-200' : isYoga ? 'border-green-200' : 'border-slate-200';

                return (
                  <div
                    key={appointment.id}
                    className={`flex items-center gap-4 p-4 ${bgColor} border ${borderColor} rounded-xl hover:shadow-md transition-all`}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={appointment.image} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
                        {appointment.client.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="text-slate-900 font-semibold">{appointment.client}</div>
                      <div className="text-sm text-slate-600 mt-0.5">{appointment.doctor}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-slate-600">{appointment.time}</span>
                        <span className="text-sm text-slate-400">•</span>
                        <span className="text-sm text-slate-600">{appointment.duration} min</span>
                        <span className="text-sm text-slate-400">•</span>
                        <span className={`text-sm font-medium ${isTherapy ? 'text-blue-600' : isYoga ? 'text-green-600' : 'text-cyan-600'}`}>{appointment.purpose}</span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`${
                        appointment.status === 'confirmed'
                          ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                          : 'border-amber-300 text-amber-700 bg-amber-50'
                      }`}
                    >
                      {appointment.status}
                    </Badge>

                    <div className="flex gap-2">
                      {appointment.type === 'video' && (
                        <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700 transition-colors">
                          Join Session
                        </button>
                      )}
                      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                        Details
                      </button>
                    </div>
                  </div>
                );
              });
            })()
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {(() => {
        // Calculate week stats
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Get last week for comparison
        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);

        // Format dates for comparison
        const formatDateStr = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const weekStartStr = formatDateStr(weekStart);
        const weekEndStr = formatDateStr(weekEnd);
        const lastWeekStartStr = formatDateStr(lastWeekStart);
        const lastWeekEndStr = formatDateStr(lastWeekEnd);

        // Count appointments this week
        const thisWeekAppts = appointments.filter((appt) => appt.date >= weekStartStr && appt.date <= weekEndStr);
        
        // Count appointments last week
        const lastWeekAppts = appointments.filter((appt) => appt.date >= lastWeekStartStr && appt.date <= lastWeekEndStr);
        
        // Count pending confirmations
        const pendingAppts = appointments.filter((appt) => appt.status === 'pending' || appt.status === 'tentative');
        
        // Count cancellations (assuming cancelled appointments exist or can be tracked)
        const cancelledAppts = appointments.filter((appt) => appt.status === 'cancelled');
        
        const weekDifference = thisWeekAppts.length - lastWeekAppts.length;
        const differenceColor = weekDifference >= 0 ? 'text-emerald-600' : 'text-red-600';
        const differenceSign = weekDifference >= 0 ? '+' : '';

        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 rounded-2xl">
              <CardContent className="p-6">
                <div className="text-sm text-slate-600">This Week</div>
                <div className="text-slate-900 mt-2">{thisWeekAppts.length} appointments</div>
                <div className={`text-xs ${differenceColor} mt-1`}>{differenceSign}{weekDifference} from last week</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 rounded-2xl">
              <CardContent className="p-6">
                <div className="text-sm text-slate-600">Pending Confirmations</div>
                <div className="text-slate-900 mt-2">{pendingAppts.length} appointments</div>
                <div className={`text-xs ${pendingAppts.length > 0 ? 'text-amber-600' : 'text-emerald-600'} mt-1`}>
                  {pendingAppts.length > 0 ? `${pendingAppts.length} require attention` : 'All confirmed'}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 rounded-2xl">
              <CardContent className="p-6">
                <div className="text-sm text-slate-600">Cancellations</div>
                <div className="text-slate-900 mt-2">{cancelledAppts.length} this week</div>
                <div className={`text-xs ${cancelledAppts.length === 0 ? 'text-emerald-600' : 'text-red-600'} mt-1`}>
                  {cancelledAppts.length === 0 ? 'Within policy' : 'Review needed'}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

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
    </div>
  );
}
