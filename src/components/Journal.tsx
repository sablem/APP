import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, JournalEntry } from '../lib/supabase';
import { BookOpen, Plus, Star, Trash2, Edit } from 'lucide-react';

export const Journal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodAtWriting, setMoodAtWriting] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setEntries(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    if (editingEntry) {
      const { error } = await supabase
        .from('journal_entries')
        .update({
          title,
          content,
          mood_at_writing: moodAtWriting,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingEntry.id);

      if (!error) {
        resetForm();
        loadEntries();
      }
    } else {
      const { error } = await supabase
        .from('journal_entries')
        .insert([
          {
            user_id: user.id,
            title,
            content,
            mood_at_writing: moodAtWriting,
          },
        ]);

      if (!error) {
        resetForm();
        loadEntries();
      }
    }

    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setMoodAtWriting(5);
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setMoodAtWriting(entry.mood_at_writing || 5);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    loadEntries();
  };

  const toggleFavorite = async (entry: JournalEntry) => {
    await supabase
      .from('journal_entries')
      .update({ is_favorite: !entry.is_favorite })
      .eq('id', entry.id);

    loadEntries();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Private Journal</h2>
          <p className="text-gray-600">Your safe space for thoughts and feelings</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="Give your entry a title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How are you feeling? ({moodAtWriting}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={moodAtWriting}
                onChange={(e) => setMoodAtWriting(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your thoughts
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="Write freely... This is your private space"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No journal entries yet</p>
            <p className="text-sm text-gray-400 mt-1">Start writing to express your thoughts</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">{entry.title}</h3>
                    {entry.is_favorite && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(entry)}
                    className="p-2 text-gray-400 hover:text-yellow-500 transition"
                    title={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-5 h-5 ${entry.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-2 text-gray-400 hover:text-teal-600 transition"
                    title="Edit entry"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition"
                    title="Delete entry"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {entry.mood_at_writing && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-600">Mood:</span>
                  <span className="px-2 py-1 bg-teal-50 text-teal-700 text-sm rounded-full">
                    {entry.mood_at_writing}/10
                  </span>
                </div>
              )}

              <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
