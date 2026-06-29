import React, { useState, useEffect } from 'react';
import { bookmarkService } from '../services/api';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';
import MathText from '../components/MathText';
import ZoomableImage from '../components/ui/ZoomableImage';

const Bookmark = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await bookmarkService.list();
        setBookmarks(res.data.data);
      } catch (error) {
        console.error('Failed to load bookmarks');
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  const handleRemove = async (questionId, e) => {
    e.stopPropagation();
    try {
      await bookmarkService.toggle(questionId);
      setBookmarks(prev => prev.filter(b => b.id !== questionId));
      toast.success('Bookmark dihapus');
    } catch (error) {
      toast.error('Gagal menghapus bookmark');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="bg-white min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-800">Bookmarked Questions</h1>
          <p className="text-gray-500 text-sm mt-1">Review soal yang kamu simpan</p>
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-20 border border-gray-200 rounded-xl">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-600">Belum ada bookmark</h3>
            <p className="text-gray-400 mt-2">Soal yang kamu tandai saat latihan akan muncul di sini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((q, index) => {
              const isExpanded = expandedId === q.id;
              const correctChoice = q.choices?.find(c => c.is_correct);

              return (
                <div
                  key={q.id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-medium">#{index + 1}</span>
                        <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'danger'}>
                          {q.difficulty?.toUpperCase() || 'MEDIUM'}
                        </Badge>
                      </div>
                      <button
                        onClick={(e) => handleRemove(q.id, e)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                        title="Hapus Bookmark"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
                        </svg>
                      </button>
                    </div>

                    <MathText className="text-gray-800 line-clamp-3" text={q.content || ''} />

                    {!isExpanded && (
                      <div className="mt-4 flex justify-center">
                        <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-200 p-5">
                      {/* TOP IMAGE */}
                      {q.image_url && ['top', 'before', 'atas'].includes(q.image_position) && (
                        <ZoomableImage src={q.image_url} alt="Question" className="max-h-64 object-contain mb-5 rounded-lg border border-gray-200" />
                      )}

                      {/* STIMULUS */}
                      {q.stimulus && (
                        <div className="mb-5 text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                          <MathText text={q.stimulus} />
                        </div>
                      )}

                      {/* MIDDLE IMAGE */}
                      {q.image_url && ['middle', 'ditengah', 'tengah'].includes(q.image_position) && (
                        <ZoomableImage src={q.image_url} alt="Question" className="max-h-64 object-contain mb-5 rounded-lg border border-gray-200" />
                      )}

                      <MathText className="text-gray-800 mb-5" text={q.content || ''} />

                      {/* BOTTOM IMAGE */}
                      {q.image_url && !['top', 'before', 'atas', 'middle', 'ditengah', 'tengah'].includes(q.image_position) && (
                        <ZoomableImage src={q.image_url} alt="Question" className="max-h-64 object-contain mb-5 rounded-lg border border-gray-200" />
                      )}

                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pilihan Jawaban</h4>
                      <div className="space-y-2 mb-5">
                        {q.choices?.map(c => (
                          <div
                            key={c.id}
                            className={`p-3 rounded-lg flex gap-3 border ${
                              c.is_correct ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                            }`}
                          >
                            <span className={`font-bold ${c.is_correct ? 'text-green-600' : 'text-gray-400'}`}>
                              {c.label}
                            </span>
                            <MathText className={c.is_correct ? 'text-gray-800' : 'text-gray-600'} text={c.content || ''} />
                          </div>
                        ))}
                      </div>

                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Penjelasan</h4>
                      <div className="bg-white rounded-lg p-4 text-gray-600 border border-gray-200 text-sm leading-relaxed">
                        <MathText text={correctChoice?.explanation || 'Belum ada penjelasan.'} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmark;