import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Exercise } from '../lib/supabase';
import { Calendar, Play, Clock, Star } from 'lucide-react';

export const Exercises = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .order('duration_minutes');

    setExercises(data || []);
    setLoading(false);
  };

  const handleComplete = async (exerciseId: string, rating: number) => {
    if (!user) return;

    await supabase
      .from('exercise_completions')
      .insert([
        {
          user_id: user.id,
          exercise_id: exerciseId,
          rating,
        },
      ]);

    setSelectedExercise(null);
  };

  const filteredExercises = exercises.filter(
    (ex) => filterType === 'all' || ex.type === filterType
  );

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      breathing: 'bg-blue-50 text-blue-700',
      meditation: 'bg-green-50 text-green-700',
      mindfulness: 'bg-teal-50 text-teal-700',
      grounding: 'bg-orange-50 text-orange-700',
    };
    return colors[type] || 'bg-gray-50 text-gray-700';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'text-green-600',
      intermediate: 'text-yellow-600',
      advanced: 'text-red-600',
    };
    return colors[difficulty] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-500">Loading exercises...</p>
      </div>
    );
  }

  if (selectedExercise) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setSelectedExercise(null)}
          className="mb-4 text-teal-600 hover:text-teal-700 font-medium"
        >
          ← Back to exercises
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {selectedExercise.title}
          </h2>

          <div className="flex items-center gap-4 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedExercise.type)}`}>
              {selectedExercise.type}
            </span>
            <span className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              {selectedExercise.duration_minutes} min
            </span>
            <span className={`text-sm font-medium ${getDifficultyColor(selectedExercise.difficulty)}`}>
              {selectedExercise.difficulty}
            </span>
          </div>

          <p className="text-gray-700 mb-6">{selectedExercise.description}</p>

          <div className="bg-teal-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Instructions</h3>
            {Array.isArray(selectedExercise.instructions.steps) ? (
              <ol className="space-y-3">
                {selectedExercise.instructions.steps.map((step: string, index: number) => (
                  <li key={index} className="flex">
                    <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-700">Follow the guided exercise</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              How helpful was this exercise?
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleComplete(selectedExercise.id, rating)}
                  className="flex-1 py-2 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition"
                >
                  <Star className="w-5 h-5 mx-auto text-yellow-500" />
                  <span className="text-xs text-gray-600 mt-1">{rating}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Wellness Exercises</h2>
        <p className="text-gray-600">Guided practices to support your mental health</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterType === 'all'
              ? 'bg-teal-600 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('breathing')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterType === 'breathing'
              ? 'bg-teal-600 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Breathing
        </button>
        <button
          onClick={() => setFilterType('meditation')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterType === 'meditation'
              ? 'bg-teal-600 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Meditation
        </button>
        <button
          onClick={() => setFilterType('mindfulness')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterType === 'mindfulness'
              ? 'bg-teal-600 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Mindfulness
        </button>
        <button
          onClick={() => setFilterType('grounding')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterType === 'grounding'
              ? 'bg-teal-600 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Grounding
        </button>
      </div>

      {filteredExercises.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No exercises available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  {exercise.title}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(exercise.type)}`}>
                  {exercise.type}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {exercise.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {exercise.duration_minutes} min
                  </span>
                  <span className={getDifficultyColor(exercise.difficulty)}>
                    {exercise.difficulty}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedExercise(exercise)}
                  className="flex items-center px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
