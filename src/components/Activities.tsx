import { useState } from 'react';
import { Gamepad2, Trophy, Target, Heart } from 'lucide-react';
import { Games } from './Games';
import { SportsEvents } from './SportsEvents';
import { WellnessChallenges } from './WellnessChallenges';
import { GratitudeWall } from './GratitudeWall';

type ActivityView = 'games' | 'sports' | 'challenges' | 'gratitude';

export const Activities = () => {
  const [currentView, setCurrentView] = useState<ActivityView>('games');

  const navigation = [
    { id: 'games', label: 'Jeux', icon: Gamepad2, color: 'teal' },
    { id: 'sports', label: 'Sports', icon: Trophy, color: 'blue' },
    { id: 'challenges', label: 'Défis', icon: Target, color: 'green' },
    { id: 'gratitude', label: 'Gratitude', icon: Heart, color: 'red' },
  ];

  return (
    <div>
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as ActivityView)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                  currentView === item.id
                    ? 'bg-teal-50 text-teal-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {currentView === 'games' && <Games />}
      {currentView === 'sports' && <SportsEvents />}
      {currentView === 'challenges' && <WellnessChallenges />}
      {currentView === 'gratitude' && <GratitudeWall />}
    </div>
  );
};
