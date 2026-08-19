import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, ChevronDown, ChevronUp, Edit3, Check } from 'lucide-react';interface ExamResult {
  exam: { id: string; name: string; type: string; max_marks: number; date: string };
  subjects: Record<string, { obtained: number | null; max: number }>;
  total_obtained: number;
  total_max: number;
  percentage: string | null;
  rank: number | null;
  class_size: number;
}

const SUBJECT_NAMES: Record<string, string> = {
  math: 'Mathematics', science: 'Science', english: 'English',
  history: 'History', geography: 'Geography', computer: 'Computer Sc.',
  hindi: 'Hindi', pe: 'Physical Ed.'
};

const SUBJECT_COLORS: Record<string, string> = {
  math: '#6366f1', science: '#10b981', english: '#f59e0b',
  history: '#ef4444', geography: '#8b5cf6', computer: '#06b6d4',
  hindi: '#ec4899', pe: '#84cc16'
};

const getGrade = (pct: number) => {
  if (pct >= 90) return { grade: 'A+', color: 'text-green-600' };
  if (pct >= 80) return { grade: 'A',  color: 'text-green-500' };
  if (pct >= 70) return { grade: 'B+', color: 'text-blue-600' };
  if (pct >= 60) return { grade: 'B',  color: 'text-blue-500' };
  if (pct >= 50) return { grade: 'C',  color: 'text-yellow-600' };
  return { grade: 'D', color: 'text-red-600' };
};

const getRankBadge = (rank: number | null, _classSize: number) => {
  if (!rank) return null;
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

export function Marks() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedExam, setExpandedExam] = useState<string | null>('hy');
  const [selectedChild, setSelectedChild] = useState<string>('');

  // Teacher: mark entry state
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState('student123');

  useEffect(() => { fetchMarks(); }, [token]);

  const fetchMarks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/academic/marks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (user?.role === 'parent' && d.children) {
          setSelectedChild(Object.keys(d.children)[0]);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveMarks = async () => {
    if (!editValues || !selectedStudentForEdit) return;
    setSaving(true);
    try {
      for (const [examId, subjects] of Object.entries(editValues)) {
        for (const [subject, marksStr] of Object.entries(subjects)) {
          const marks = parseFloat(marksStr);
          if (!isNaN(marks)) {
            await fetch('/api/academic/marks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ studentId: selectedStudentForEdit, examId, subject, marks })
            });
          }
        }
      }
      setSavedMsg('Marks saved! Students can see them instantly.');
      setTimeout(() => setSavedMsg(''), 3000);
      setEditMode(false);
      setEditValues({});
      fetchMarks();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Loading marks...</p>
    </div>
  );

  // Student view
  const renderStudentMarks = (marks: Record<string, ExamResult>) => {
    const examOrder = ['ct1', 'ct2', 'ct3', 'hy', 'fin'];
    return (
      <div className="space-y-3">
        {examOrder.map(examId => {
          const result = marks[examId];
          if (!result) return null;
          const isExpanded = expandedExam === examId;
          const hasData = result.total_obtained !== undefined && result.subjects;
          const isClassTest = result.exam.type === 'class_test';

          return (
            <div key={examId} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedExam(isExpanded ? null : examId)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{result.exam.name}</p>
                    <p className="text-xs text-gray-400">{result.exam.date} · Max: {result.exam.max_marks} per subject</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasData && (
                    <>
                      {/* Rank badge */}
                      {result.rank && (
                        <span className="text-sm font-bold text-gray-700">
                          {getRankBadge(result.rank, result.class_size)} of {result.class_size}
                        </span>
                      )}
                      {/* Percentage (only HY/Final) */}
                      {!isClassTest && result.percentage && (() => {
                        const pct = parseFloat(result.percentage);
                        const { grade, color } = getGrade(pct);
                        return (
                          <div className="text-right">
                            <p className={`text-lg font-bold ${color}`}>{result.percentage}%</p>
                            <p className={`text-xs font-medium ${color}`}>{grade}</p>
                          </div>
                        );
                      })()}
                      {/* Total for class tests */}
                      {isClassTest && result.total_obtained !== undefined && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-700">{result.total_obtained}/{result.total_max}</p>
                        </div>
                      )}
                    </>
                  )}
                  {!hasData && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Pending</span>}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Subject-wise marks */}
              {isExpanded && hasData && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(result.subjects).map(([subj, subjData]) => {
                      const pct = subjData.obtained !== null ? (subjData.obtained / subjData.max) * 100 : 0;
                      const barColor = SUBJECT_COLORS[subj] || '#6366f1';
                      return (
                        <div key={subj} className="bg-gray-50 rounded-lg p-2.5">
                          <p className="text-xs font-medium text-gray-600 truncate">{SUBJECT_NAMES[subj] || subj}</p>
                          <div className="flex items-end justify-between mt-1">
                            <p className="text-lg font-bold text-gray-800">
                              {subjData.obtained !== null ? subjData.obtained : '—'}
                            </p>
                            <p className="text-xs text-gray-400">/{subjData.max}</p>
                          </div>
                          {subjData.obtained !== null && (
                            <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Teacher view
  const renderTeacherView = () => {
    const classPerf = data?.class_performance;
    if (!classPerf) return null;

    const studentNames: Record<string, string> = {
      student123: 'Rahul Sharma', student456: 'Priya Patel', student789: 'Arjun Singh'
    };

    const examOrder = ['ct1', 'ct2', 'ct3', 'hy'];

    return (
      <div className="space-y-4">
        {savedMsg && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <Check className="w-4 h-4" /> {savedMsg}
          </div>
        )}

        {/* Enter Marks Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-600" /> Enter / Update Marks
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedStudentForEdit}
                onChange={e => setSelectedStudentForEdit(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white"
              >
                {Object.entries(studentNames).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              {!editMode ? (
                <button onClick={() => setEditMode(true)} className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 font-medium">
                  Edit Marks
                </button>
              ) : (
                <button onClick={saveMarks} disabled={saving} className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-medium disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save All'}
                </button>
              )}
            </div>
          </div>

          {editMode && (
            <div className="space-y-3">
              {['ct3', 'hy'].map(examId => {
                const examNames: Record<string, string> = { ct1: 'CT1 (max 25)', ct2: 'CT2 (max 25)', ct3: 'CT3 (max 25)', hy: 'Half Yearly (max 100)' };
                const maxMarks: Record<string, number> = { ct1: 25, ct2: 25, ct3: 25, hy: 100 };
                return (
                  <div key={examId}>
                    <p className="text-xs font-medium text-gray-600 mb-2">{examNames[examId]}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.keys(SUBJECT_NAMES).map(subj => (
                        <div key={subj}>
                          <label className="text-xs text-gray-500 block mb-0.5">{SUBJECT_NAMES[subj]}</label>
                          <input
                            type="number"
                            min={0}
                            max={maxMarks[examId]}
                            placeholder="0"
                            value={editValues[examId]?.[subj] || ''}
                            onChange={e => setEditValues(prev => ({
                              ...prev,
                              [examId]: { ...(prev[examId] || {}), [subj]: e.target.value }
                            }))}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Class performance summary */}
        {examOrder.map(examId => {
          const perf = classPerf[examId];
          if (!perf || !perf.students) return null;
          const isExpanded = expandedExam === examId;

          return (
            <div key={examId} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedExam(isExpanded ? null : examId)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <p className="text-sm font-semibold text-gray-800">{perf.exam?.name}</p>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-100">
                        <th className="pb-2 text-left font-medium">Student</th>
                        <th className="pb-2 text-center font-medium">Total</th>
                        {perf.exam?.type !== 'class_test' && <th className="pb-2 text-center font-medium">%</th>}
                        <th className="pb-2 text-center font-medium">Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perf.students.map((s: any) => (
                        <tr key={s.studentId} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 font-medium text-gray-700">{studentNames[s.studentId] || s.studentId}</td>
                          <td className="py-2 text-center text-gray-600">{s.total ?? '—'}/{s.maxTotal}</td>
                          {perf.exam?.type !== 'class_test' && <td className="py-2 text-center font-medium text-indigo-600">{s.percentage ?? '—'}%</td>}
                          <td className="py-2 text-center font-bold text-gray-700">{getRankBadge(s.rank, perf.class_size)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Subject averages */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">Class Average per Subject</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Object.entries(perf.subjectAverages || {}).map(([subj, avg]: [string, any]) => (
                        <div key={subj} className="text-center bg-gray-50 rounded-lg px-2 py-1.5">
                          <p className="text-xs text-gray-500">{SUBJECT_NAMES[subj]?.split(' ')[0]}</p>
                          <p className="text-sm font-bold text-gray-700">{avg}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

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
                <Award className="w-5 h-5 text-indigo-600" />
                {user?.role === 'teacher' ? 'Class Marks' : 'My Marks'}
              </h2>
              <p className="text-sm text-gray-500">
                {user?.role === 'teacher' ? 'Enter and view class performance' : 'Academic performance & rankings'}
              </p>
            </div>
          </div>

          {/* Child selector for parent */}
          {user?.role === 'parent' && data?.children && Object.keys(data.children).length > 1 && (
            <select
              value={selectedChild}
              onChange={e => setSelectedChild(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            >
              {Object.entries(data.children).map(([childId, childData]: [string, any]) => (
                <option key={childId} value={childId}>{childData.student?.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Student / Parent view */}
        {(user?.role === 'student') && data?.marks && renderStudentMarks(data.marks)}
        {user?.role === 'parent' && data?.children?.[selectedChild]?.marks && renderStudentMarks(data.children[selectedChild].marks)}

        {/* Teacher view */}
        {user?.role === 'teacher' && renderTeacherView()}
      </div>
    </div>
  );
}
