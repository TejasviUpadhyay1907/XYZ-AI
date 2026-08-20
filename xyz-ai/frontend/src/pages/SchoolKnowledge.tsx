import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Search, FileText, MessageCircle, ChevronRight, X } from 'lucide-react';

interface SchoolDoc {
  id: string;
  title: string;
  category: string;
  last_updated: string;
  preview: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Policy: 'bg-red-50 text-red-700 border-red-200',
  Academics: 'bg-blue-50 text-blue-700 border-blue-200',
  General: 'bg-green-50 text-green-700 border-green-200',
  Calendar: 'bg-purple-50 text-purple-700 border-purple-200',
  Finance: 'bg-amber-50 text-amber-700 border-amber-200',
};

const QUICK_QUESTIONS = [
  'What is the minimum attendance required?',
  'What happens if attendance is below 75%?',
  'When are the half-yearly exams?',
  'What is the grading system?',
  'When are the PTM dates?',
  'What are the school timings?',
  'Can I bring my mobile phone?',
  'How many books can I borrow from the library?',
  'What is the late payment fee for school fees?',
  'When is the annual sports day?',
];

export function SchoolKnowledge() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<SchoolDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDocuments(); }, [token]);

  const fetchDocuments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/knowledge/documents', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDocuments((await res.json()).documents || []);
      else console.error('Failed to load documents');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchDocument = async (id: string) => {
    const res = await fetch(`/api/knowledge/documents/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setSelectedDoc((await res.json()).document);
  };

  const doSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults(null);
    try {
      const res = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query })
      });
      if (res.ok) setSearchResults(await res.json());
    } catch (e) { console.error(e); }
    finally { setSearching(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/myday')} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> School Knowledge
              </h2>
              <p className="text-sm text-gray-500">Ask questions about school policies and get answers from official documents</p>
            </div>
          </div>
        </div>

        {/* Document view modal */}
        {selectedDoc && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-5 border-b">
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedDoc.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Last updated: {selectedDoc.last_updated}</p>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-5 flex-1">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{selectedDoc.content}</pre>
              </div>
              <div className="p-4 border-t flex gap-2">
                <button
                  onClick={() => { setSelectedDoc(null); navigate(`/?prompt=${encodeURIComponent(`Tell me about the ${selectedDoc.title}`)}`); }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                  <MessageCircle className="w-4 h-4" /> Ask AI about this
                </button>
                <button onClick={() => setSelectedDoc(null)} className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Search */}
          <div className="space-y-4">
            {/* Search box */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-600" /> Ask a Question
              </h3>
              <form onSubmit={e => { e.preventDefault(); doSearch(searchQuery); }} className="flex gap-2">
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="e.g. What is the attendance policy?"
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
                >
                  {searching ? '...' : 'Ask'}
                </button>
              </form>
            </div>

            {/* Search results */}
            {searchResults && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                {!searchResults.found ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No relevant information found in school documents.</p>
                    <button
                      onClick={() => navigate(`/?prompt=${encodeURIComponent(searchQuery)}`)}
                      className="mt-2 text-xs text-indigo-600 hover:underline"
                    >
                      Ask AI instead →
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xs font-semibold text-gray-600">Found in {searchResults.sources?.join(', ')}</p>
                    </div>
                    <div className="space-y-3">
                      {searchResults.results?.slice(0, 2).map((r: any, i: number) => (
                        <div key={i} className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                          <p className="text-xs font-medium text-indigo-700 mb-1.5 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {r.doc_title}
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">{r.content}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate(`/?prompt=${encodeURIComponent(searchQuery)}`)}
                      className="mt-3 w-full py-2 bg-indigo-50 text-indigo-700 text-sm rounded-lg hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" /> Ask AI for a full answer
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Quick questions */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Questions</h3>
              <div className="space-y-1">
                {QUICK_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => { setSearchQuery(q); doSearch(q); }}
                    className="w-full text-left text-xs text-gray-600 hover:text-indigo-600 px-2 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3 flex-shrink-0" /> {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Document browser */}
          <div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> School Documents
              </h3>
              {loading ? (
                <p className="text-sm text-gray-400 animate-pulse">Loading documents...</p>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => fetchDocument(doc.id)}
                      className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${CATEGORY_COLORS[doc.category] || 'bg-gray-50 text-gray-600'}`}>
                              {doc.category}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700 truncate">{doc.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.preview}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ask AI about school knowledge */}
            <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <p className="text-xs text-indigo-700 font-medium mb-2">💡 Tip: Ask XYZ AI directly!</p>
              <p className="text-xs text-gray-600 mb-2">You can ask questions like these in the chat and the AI will automatically search school documents:</p>
              <div className="flex flex-wrap gap-1">
                {['What\'s the attendance policy?', 'When are PTM dates?', 'School timings?'].map(q => (
                  <button key={q} onClick={() => navigate(`/?prompt=${encodeURIComponent(q)}`)}
                    className="text-xs px-2 py-1 bg-white text-indigo-600 rounded-full border border-indigo-200 hover:bg-indigo-50">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
