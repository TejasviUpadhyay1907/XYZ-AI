import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, User, ChevronDown } from 'lucide-react';

interface SlotSubject {
  key: string;
  name: string;
  short: string;
  color: string;
  teacher: string;
  teacherId: string;
  unit: string;
  topic: string;
  chapter: string;
}

interface TimeSlot {
  slot_id: number;
  time: string;
  start: string;
  end: string;
  type: 'period' | 'break' | 'lunch' | 'end' | 'free';
  label: string;
  subject: SlotSubject | null;
}

interface ChildData {
  student: { id: string; name: string; grade: string; section: string };
  timetable: { class: string; schedule: Record<string, TimeSlot[]> };
  today: { day: string; is_school_day: boolean; schedule: TimeSlot[] };
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat'
};

export function Timetable() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>('');

  useEffect(() => {
    fetchTimetable();
    // Set today's day
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDay = days[new Date().getDay()];
    setSelectedDay(DAYS.includes(todayDay) ? todayDay : 'monday');
  }, [token]);

  const fetchTimetable = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/academic/timetable', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
        // For parent, select first child
        if (user?.role === 'parent' && d.children) {
          const firstChildId = Object.keys(d.children)[0];
          setSelectedChild(firstChildId);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getSchedule = (): TimeSlot[] => {
    if (!data) return [];
    if (user?.role === 'parent') {
      const childData: ChildData = data.children?.[selectedChild];
      return childData?.timetable?.schedule?.[selectedDay] || [];
    }
    return data.timetable?.schedule?.[selectedDay] || [];
  };

  const getSlotBg = (slot: TimeSlot) => {
    if (slot.type === 'break') return 'bg-amber-50 border-amber-200';
    if (slot.type === 'lunch') return 'bg-green-50 border-green-200';
    if (slot.type === 'end') return 'bg-gray-50 border-gray-100';
    if (slot.type === 'free') return 'bg-gray-50 border-gray-100';
    return 'bg-white border-gray-100';
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Loading timetable...</p>
    </div>
  );

  const schedule = getSchedule();

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Timetable
              </h2>
              <p className="text-sm text-gray-500">
                {user?.role === 'parent' && data?.children?.[selectedChild]?.student?.name
                  ? `${data.children[selectedChild].student.name} — Grade ${data.children[selectedChild].student.grade}-${data.children[selectedChild].student.section}`
                  : `Grade ${data?.timetable?.class || '10-B'}`}
              </p>
            </div>
          </div>

          {/* Child selector for parent */}
          {user?.role === 'parent' && data?.children && Object.keys(data.children).length > 1 && (
            <select
              value={selectedChild}
              onChange={e => setSelectedChild(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(data.children).map(([childId, childData]: [string, any]) => (
                <option key={childId} value={childId}>{childData.student?.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Day selector tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {DAYS.map(day => {
            const isToday = day === (() => {
              const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
              return days[new Date().getDay()];
            })();
            return (
              <button
                key={day}
                onClick={() => { setSelectedDay(day); setExpandedSlot(null); }}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedDay === day
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isToday
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {DAY_LABELS[day]}
                {isToday && selectedDay !== day && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                )}
              </button>
            );
          })}
        </div>

        {/* Timetable slots */}
        <div className="space-y-2">
          {schedule.map((slot) => {
            if (slot.type === 'end') {
              return (
                <div key={slot.slot_id} className="flex items-center gap-3 py-3 px-4 bg-gray-100 rounded-xl border border-gray-200">
                  <span className="text-xs font-mono text-gray-400 w-20 flex-shrink-0">{slot.start}</span>
                  <span className="text-sm font-semibold text-gray-600">🏫 School Ends</span>
                </div>
              );
            }

            if (slot.type === 'break' || slot.type === 'lunch') {
              return (
                <div key={slot.slot_id} className={`flex items-center gap-3 py-2.5 px-4 rounded-xl border ${getSlotBg(slot)}`}>
                  <span className="text-xs font-mono text-gray-400 w-20 flex-shrink-0">{slot.time}</span>
                  <span className="text-sm font-medium text-gray-500">
                    {slot.type === 'lunch' ? '🍱' : '☕'} {slot.label}
                  </span>
                </div>
              );
            }

            if (!slot.subject) {
              return (
                <div key={slot.slot_id} className="flex items-center gap-3 py-2.5 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs font-mono text-gray-400 w-20 flex-shrink-0">{slot.time}</span>
                  <span className="text-sm text-gray-400">Free Period</span>
                </div>
              );
            }

            const isExpanded = expandedSlot === slot.slot_id;
            const s = slot.subject;

            return (
              <div key={slot.slot_id} className={`rounded-xl border shadow-sm overflow-hidden transition-all ${getSlotBg(slot)}`}>
                <button
                  onClick={() => setExpandedSlot(isExpanded ? null : slot.slot_id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  {/* Color bar */}
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />

                  {/* Time */}
                  <span className="text-xs font-mono text-gray-400 w-20 flex-shrink-0">{slot.time}</span>

                  {/* Subject */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500 truncate">{s.unit} · {s.topic}</p>
                  </div>

                  {/* Teacher */}
                  <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                    <User className="w-3 h-3" />
                    {s.teacher}
                  </div>

                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">📚 Chapter</p>
                        <p className="text-sm text-gray-700">{s.chapter}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">🎯 Current Topic</p>
                        <p className="text-sm text-gray-700">{s.topic}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">👤 Teacher</p>
                        <p className="text-sm text-gray-700">{s.teacher}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {schedule.length === 0 && (
          <div className="bg-white rounded-xl border p-12 text-center">
            <p className="text-gray-400">No schedule for {selectedDay}</p>
          </div>
        )}
      </div>
    </div>
  );
}
