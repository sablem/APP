import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, MoodEntry } from '../lib/supabase';
import { TrendingUp, Battery, Moon } from 'lucide-react';

const emotionOptions = [
  'Happy', 'Sad', 'Anxious', 'Stressed', 'Calm', 'Energetic',
  'Tired', 'Angry', 'Grateful', 'Lonely', 'Hopeful', 'Overwhelmed'
];

type MoodTrackerProps = {
  onMoodLogged?: () => void;
};

export const MoodTracker = ({ onMoodLogged }: MoodTrackerProps) => {
  const { user } = useAuth();
  const [moodScore, setMoodScore] = useState(5);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [energyLevel, setEnergyLevel] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);

  useEffect(() => {
    loadMoodHistory();
  }, []);

  const loadMoodHistory = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(14);

    setMoodHistory(data || []);
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSuccess(false);

    const { error } = await supabase
      .from('mood_entries')
      .insert([
        {
          user_id: user.id,
          mood_score: moodScore,
          emotions: selectedEmotions,
          notes,
          energy_level: energyLevel,
          sleep_quality: sleepQuality,
        },
      ]);

    setLoading(false);

    if (!error) {
      setSuccess(true);
      setNotes('');
      setSelectedEmotions([]);
      loadMoodHistory();
      if (onMoodLogged) onMoodLogged();

      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const getMoodColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 5) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getMoodLabel = (score: number) => {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Okay';
    if (score >= 3) return 'Not great';
    return 'Struggling';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Mood Tracker</h2>
        <p className="text-gray-600">Track your emotional well-being over time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How are you feeling today?
              </label>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">1</span>
                <span className="text-lg font-semibold text-gray-800">
                  {moodScore} - {getMoodLabel(moodScore)}
                </span>
                <span className="text-xs text-gray-500">10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={moodScore}
                onChange={(e) => setMoodScore(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between mt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <div
                    key={num}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition ${
                      moodScore >= num
                        ? `${getMoodColor(num)} text-white`
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What emotions are you experiencing?
              </label>
              <div className="flex flex-wrap gap-2">
                {emotionOptions.map((emotion) => (
                  <button
                    key={emotion}
                    type="button"
                    onClick={() => toggleEmotion(emotion)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      selectedEmotions.includes(emotion)
                        ? 'bg-teal-100 text-teal-700 border-2 border-teal-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Battery className="w-4 h-4 inline mr-1" />
                  Energy Level
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">Low</span>
                  <span className="text-xs font-medium text-gray-700">{energyLevel}/5</span>
                  <span className="text-xs text-gray-500">High</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Moon className="w-4 h-4 inline mr-1" />
                  Sleep Quality
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">Poor</span>
                  <span className="text-xs font-medium text-gray-700">{sleepQuality}/5</span>
                  <span className="text-xs text-gray-500">Great</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="Anything specific on your mind?"
              />
            </div>

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">Mood logged successfully!</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Log Mood'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-teal-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Mood History</h3>
          </div>

          {moodHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No mood entries yet</p>
              <p className="text-sm text-gray-400 mt-1">Start tracking to see your progress</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {moodHistory.map((entry) => (
                <div key={entry.id} className="border-l-4 border-teal-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800">
                      {entry.mood_score}/10 - {getMoodLabel(entry.mood_score)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {entry.emotions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {entry.emotions.map((emotion) => (
                        <span
                          key={emotion}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  )}
                  {entry.notes && (
                    <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Energy: {entry.energy_level}/5</span>
                    <span>Sleep: {entry.sleep_quality}/5</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
