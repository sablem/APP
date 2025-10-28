import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Gamepad2, Play, Trophy, Users, Loader2 } from 'lucide-react';
import { TicTacToe } from './games/TicTacToe';
import { RockPaperScissors } from './games/RockPaperScissors';

type GameRoom = {
  id: string;
  game_type: string;
  player1_id: string;
  player2_id: string | null;
  status: string;
  winner_id: string | null;
  created_at: string;
};

export const Games = () => {
  const { user } = useAuth();
  const [availableRooms, setAvailableRooms] = useState<GameRoom[]>([]);
  const [activeGame, setActiveGame] = useState<GameRoom | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<string | null>(null);
  const [stats, setStats] = useState({ played: 0, won: 0 });
  const [isJoining, setIsJoining] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableRooms();
    loadStats();

    const channel = supabase
      .channel('game_rooms_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms' }, () => {
        loadAvailableRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAvailableRooms = async () => {
    const { data } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('status', 'waiting')
      .is('player2_id', null)
      .order('created_at', { ascending: false })
      .limit(10);

    setAvailableRooms(data || []);
  };

  const loadStats = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_activity_stats')
      .select('games_played, games_won')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setStats({ played: data.games_played, won: data.games_won });
    }
  };

  const createRoom = async (gameType: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('game_rooms')
      .insert([
        {
          game_type: gameType,
          player1_id: user.id,
          status: 'waiting',
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setActiveGame(data);
      setSelectedGameType(gameType);
    }
  };

  const joinRoom = async (room: GameRoom) => {
    if (!user) return;

    if (room.player1_id === user.id) {
      alert('Vous ne pouvez pas rejoindre votre propre partie!');
      return;
    }

    if (room.player2_id) {
      alert('Cette partie est déjà complète!');
      await loadAvailableRooms();
      return;
    }

    setIsJoining(room.id);

    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .update({
          player2_id: user.id,
          status: 'in_progress',
        })
        .eq('id', room.id)
        .eq('player2_id', null)
        .select()
        .single();

      if (error) {
        console.error('Error joining room:', error);
        alert('Impossible de rejoindre la partie. Elle est peut-être déjà complète.');
        await loadAvailableRooms();
        return;
      }

      if (data) {
        setActiveGame(data);
        setSelectedGameType(room.game_type);
      }
    } finally {
      setIsJoining(null);
    }
  };

  const handleGameComplete = () => {
    setActiveGame(null);
    setSelectedGameType(null);
    loadStats();
    loadAvailableRooms();
  };

  if (activeGame && selectedGameType) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleGameComplete}
          className="mb-4 text-teal-600 hover:text-teal-700 font-medium"
        >
          ← Quitter la partie
        </button>

        {selectedGameType === 'tic_tac_toe' && (
          <TicTacToe gameRoom={activeGame} onComplete={handleGameComplete} />
        )}
        {selectedGameType === 'rock_paper_scissors' && (
          <RockPaperScissors gameRoom={activeGame} onComplete={handleGameComplete} />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Jeux Relaxants</h2>
        <p className="text-gray-600">Détendez-vous avec des jeux amicaux</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-500">Victoires</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.won}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Gamepad2 className="w-5 h-5 text-teal-500" />
            <span className="text-sm text-gray-500">Parties jouées</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.played}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Taux de victoire</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Créer une nouvelle partie</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => createRoom('tic_tac_toe')}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition text-left"
          >
            <div className="flex items-center mb-2">
              <Gamepad2 className="w-6 h-6 text-teal-600 mr-2" />
              <h4 className="font-semibold text-gray-800">Tic-Tac-Toe</h4>
            </div>
            <p className="text-sm text-gray-600">Jeu classique de stratégie en 2 joueurs</p>
          </button>

          <button
            onClick={() => createRoom('rock_paper_scissors')}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition text-left"
          >
            <div className="flex items-center mb-2">
              <Gamepad2 className="w-6 h-6 text-green-600 mr-2" />
              <h4 className="font-semibold text-gray-800">Pierre-Feuille-Ciseaux</h4>
            </div>
            <p className="text-sm text-gray-600">Jeu rapide de chance en 2 joueurs</p>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Parties disponibles ({availableRooms.length})
        </h3>

        {availableRooms.length === 0 ? (
          <div className="text-center py-8">
            <Play className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune partie en attente</p>
            <p className="text-sm text-gray-400 mt-1">Créez une nouvelle partie pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableRooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center">
                  <Gamepad2 className="w-5 h-5 text-teal-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">
                      {room.game_type === 'tic_tac_toe' ? 'Tic-Tac-Toe' : 'Pierre-Feuille-Ciseaux'}
                    </p>
                    <p className="text-sm text-gray-500">En attente d'un joueur</p>
                  </div>
                </div>

                {room.player1_id !== user?.id && (
                  <button
                    onClick={() => joinRoom(room)}
                    disabled={isJoining === room.id}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isJoining === room.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Connexion...</span>
                      </>
                    ) : (
                      'Rejoindre'
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
