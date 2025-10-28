import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Target, CheckCircle, Award, TrendingUp } from 'lucide-react';

type Challenge = {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  difficulty: string;
};

type Completion = {
  challenge_id: string;
  completed_at: string;
};

export const WellnessChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    loadChallenges();
    loadCompletions();
  }, []);

  const loadChallenges = async () => {
    const { data } = await supabase
      .from('wellness_challenges')
      .select('*')
      .eq('is_active', true)
      .order('difficulty');

    setChallenges(data || []);
  };

  const loadCompletions = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('challenge_completions')
      .select('challenge_id, completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', `${today}T00:00:00`);

    setCompletions(data || []);

    const { data: stats } = await supabase
      .from('user_activity_stats')
      .select('total_wellness_points')
      .eq('user_id', user.id)
      .maybeSingle();

    setTotalPoints(stats?.total_wellness_points || 0);
  };

  const completeChallenge = async (challenge: Challenge) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const alreadyCompleted = completions.some(
      c => c.challenge_id === challenge.id &&
      c.completed_at.startsWith(today)
    );

    if (alreadyCompleted) return;

    const { error } = await supabase
      .from('challenge_completions')
      .insert([
        {
          user_id: user.id,
          challenge_id: challenge.id,
        },
      ]);

    if (!error) {
      const { data: currentStats } = await supabase
        .from('user_activity_stats')
        .select('challenges_completed, total_wellness_points')
        .eq('user_id', user.id)
        .maybeSingle();

      await supabase
        .from('user_activity_stats')
        .upsert({
          user_id: user.id,
          challenges_completed: (currentStats?.challenges_completed || 0) + 1,
          total_wellness_points: (currentStats?.total_wellness_points || 0) + challenge.points,
          updated_at: new Date().toISOString(),
        });

      loadCompletions();
    }
  };

  const isChallengeCompleted = (challengeId: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return completions.some(
      c => c.challenge_id === challengeId &&
      c.completed_at.startsWith(today)
    );
  };

  const categories = ['all', 'physical', 'mental', 'social', 'creative'];

  const filteredChallenges = challenges.filter(
    challenge => filterCategory === 'all' || challenge.category === filterCategory
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      physical: 'bg-blue-50 text-blue-700 border-blue-200',
      mental: 'bg-green-50 text-green-700 border-green-200',
      social: 'bg-orange-50 text-orange-700 border-orange-200',
      creative: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return colors[category] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'text-green-600',
      medium: 'text-yellow-600',
      hard: 'text-red-600',
    };
    return colors[difficulty] || 'text-gray-600';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Défis Bien-Être</h2>
        <p className="text-gray-600">Petites actions quotidiennes pour votre santé mentale</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-500">Points totaux</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalPoints}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Aujourd'hui</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{completions.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-teal-500" />
            <span className="text-sm text-gray-500">Défis disponibles</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{challenges.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilterCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
              filterCategory === category
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {category === 'all' ? 'Tous' : category}
          </button>
        ))}
      </div>

      {filteredChallenges.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun défi disponible</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChallenges.map((challenge) => {
            const completed = isChallengeCompleted(challenge.id);

            return (
              <div
                key={challenge.id}
                className={`bg-white rounded-xl shadow-sm p-6 border-2 transition ${
                  completed
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-100 hover:border-teal-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(challenge.category)}`}>
                        {challenge.category}
                      </span>
                      <span className={`text-sm font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty}
                      </span>
                      <span className="flex items-center text-sm font-medium text-gray-600">
                        <Award className="w-4 h-4 mr-1 text-yellow-500" />
                        {challenge.points} pts
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {challenge.title}
                    </h3>
                    <p className="text-gray-600">{challenge.description}</p>
                  </div>

                  <div className="ml-4">
                    {completed ? (
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                    ) : (
                      <button
                        onClick={() => completeChallenge(challenge)}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium whitespace-nowrap"
                      >
                        Compléter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
