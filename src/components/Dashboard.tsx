import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, MoodEntry, Profile } from '../lib/supabase';
import {
  Heart, Smile, Meh, Frown, TrendingUp, Calendar,
  BookOpen, Users, Phone, LogOut, Menu, X, Gamepad2
} from 'lucide-react';
import { MoodTracker } from './MoodTracker';
import { Journal } from './Journal';
import { Exercises } from './Exercises';
import { Resources } from './Resources';
import { Professionals } from './Professionals';
import { Emergency } from './Emergency';
import { Activities } from './Activities';

type View = 'dashboard' | 'mood' | 'journal' | 'exercises' | 'resources' | 'professionals' | 'emergency' | 'activities';

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    loadRecentMoods();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    setProfile(data);
    setLoading(false);
  };

  const loadRecentMoods = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(7);

    setRecentMoods(data || []);
  };

  const getMoodIcon = (score: number) => {
    if (score >= 8) return <Smile className="w-5 h-5 text-green-500" />;
    if (score >= 5) return <Meh className="w-5 h-5 text-yellow-500" />;
    return <Frown className="w-5 h-5 text-orange-500" />;
  };

  const calculateAverageMood = () => {
    if (recentMoods.length === 0) return 0;
    const sum = recentMoods.reduce((acc, mood) => acc + mood.mood_score, 0);
    return (sum / recentMoods.length).toFixed(1);
  };

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Heart },
    { id: 'mood', label: 'Mood Tracker', icon: TrendingUp },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'exercises', label: 'Exercises', icon: Calendar },
    { id: 'activities', label: 'Activities', icon: Gamepad2 },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'professionals', label: 'Professionals', icon: Users },
    { id: 'emergency', label: 'Emergency', icon: Phone },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4 animate-pulse">
            <Heart className="w-8 h-8 text-teal-600" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-teal-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="w-8 h-8 text-teal-600" />
              <span className="ml-2 text-xl font-bold text-gray-800">MindSpace</span>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      currentView === item.id
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 inline mr-1" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-800">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="hidden md:flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id as View);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                      currentView === item.id
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}
              <button
                onClick={() => signOut()}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-gray-600">How are you feeling today?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Average Mood</h3>
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{calculateAverageMood()}/10</p>
                <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Mood Entries</h3>
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{recentMoods.length}</p>
                <p className="text-xs text-gray-500 mt-1">This week</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Today's Mood</h3>
                  <Heart className="w-5 h-5 text-red-400" />
                </div>
                {recentMoods.length > 0 ? (
                  <div className="flex items-center">
                    {getMoodIcon(recentMoods[0].mood_score)}
                    <p className="text-3xl font-bold text-gray-800 ml-2">
                      {recentMoods[0].mood_score}/10
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No entry yet</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setCurrentView('mood')}
                    className="w-full text-left px-4 py-3 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
                  >
                    <TrendingUp className="w-5 h-5 inline text-teal-600 mr-2" />
                    <span className="font-medium text-gray-800">Log your mood</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('exercises')}
                    className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition"
                  >
                    <Calendar className="w-5 h-5 inline text-green-600 mr-2" />
                    <span className="font-medium text-gray-800">Start an exercise</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('journal')}
                    className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  >
                    <BookOpen className="w-5 h-5 inline text-blue-600 mr-2" />
                    <span className="font-medium text-gray-800">Write in journal</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Need Help?</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setCurrentView('professionals')}
                    className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                  >
                    <Users className="w-5 h-5 inline text-indigo-600 mr-2" />
                    <span className="font-medium text-gray-800">Connect with professionals</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('resources')}
                    className="w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition"
                  >
                    <BookOpen className="w-5 h-5 inline text-orange-600 mr-2" />
                    <span className="font-medium text-gray-800">Browse resources</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('emergency')}
                    className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition"
                  >
                    <Phone className="w-5 h-5 inline text-red-600 mr-2" />
                    <span className="font-medium text-gray-800">Emergency contacts</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'mood' && <MoodTracker onMoodLogged={loadRecentMoods} />}
        {currentView === 'journal' && <Journal />}
        {currentView === 'exercises' && <Exercises />}
        {currentView === 'activities' && <Activities />}
        {currentView === 'resources' && <Resources />}
        {currentView === 'professionals' && <Professionals />}
        {currentView === 'emergency' && <Emergency />}
      </main>
    </div>
  );
};
