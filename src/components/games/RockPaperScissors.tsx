import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Trophy, Hand } from 'lucide-react';

type GameRoom = {
  id: string;
  player1_id: string;
  player2_id: string | null;
  game_state: any;
  status: string;
  winner_id: string | null;
};

type RockPaperScissorsProps = {
  gameRoom: GameRoom;
  onComplete: () => void;
};

const choices = [
  { value: 'rock', label: 'Pierre', emoji: '🪨' },
  { value: 'paper', label: 'Feuille', emoji: '📄' },
  { value: 'scissors', label: 'Ciseaux', emoji: '✂️' },
];

export const RockPaperScissors = ({ gameRoom, onComplete }: RockPaperScissorsProps) => {
  const { user } = useAuth();
  const [myChoice, setMyChoice] = useState<string | null>(null);
  const [gameState, setGameState] = useState(gameRoom);
  const [result, setResult] = useState<string | null>(null);

  const isPlayer1 = user?.id === gameRoom.player1_id;

  useEffect(() => {
    const channel = supabase
      .channel(`game_${gameRoom.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${gameRoom.id}`,
      }, (payload) => {
        const updated = payload.new as GameRoom;
        setGameState(updated);

        if (updated.status === 'completed') {
          determineWinner(updated);
        }
      })
      .subscribe();

    if (gameRoom.game_state?.player1Choice || gameRoom.game_state?.player2Choice) {
      if (isPlayer1 && gameRoom.game_state?.player1Choice) {
        setMyChoice(gameRoom.game_state.player1Choice);
      } else if (!isPlayer1 && gameRoom.game_state?.player2Choice) {
        setMyChoice(gameRoom.game_state.player2Choice);
      }
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameRoom.id]);

  const determineWinner = (state: GameRoom) => {
    const p1Choice = state.game_state?.player1Choice;
    const p2Choice = state.game_state?.player2Choice;

    if (!p1Choice || !p2Choice) return;

    if (p1Choice === p2Choice) {
      setResult('draw');
      updateStats(false);
      return;
    }

    const winConditions: Record<string, string> = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper',
    };

    const player1Wins = winConditions[p1Choice] === p2Choice;
    const iWon = (isPlayer1 && player1Wins) || (!isPlayer1 && !player1Wins);

    setResult(iWon ? 'win' : 'lose');
    updateStats(iWon);
  };

  const updateStats = async (won: boolean) => {
    if (!user) return;

    const { data: currentStats } = await supabase
      .from('user_activity_stats')
      .select('games_played, games_won')
      .eq('user_id', user.id)
      .maybeSingle();

    await supabase
      .from('user_activity_stats')
      .upsert({
        user_id: user.id,
        games_played: (currentStats?.games_played || 0) + 1,
        games_won: (currentStats?.games_won || 0) + (won ? 1 : 0),
        updated_at: new Date().toISOString(),
      });
  };

  const makeChoice = async (choice: string) => {
    if (!user || myChoice) return;

    setMyChoice(choice);

    const updates: any = {
      game_state: {
        ...gameState.game_state,
        [isPlayer1 ? 'player1Choice' : 'player2Choice']: choice,
      },
    };

    const otherPlayerChoice = isPlayer1
      ? gameState.game_state?.player2Choice
      : gameState.game_state?.player1Choice;

    if (otherPlayerChoice) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();

      const p1Choice = isPlayer1 ? choice : otherPlayerChoice;
      const p2Choice = isPlayer1 ? otherPlayerChoice : choice;

      if (p1Choice !== p2Choice) {
        const winConditions: Record<string, string> = {
          rock: 'scissors',
          paper: 'rock',
          scissors: 'paper',
        };

        updates.winner_id = winConditions[p1Choice] === p2Choice
          ? gameRoom.player1_id
          : gameRoom.player2_id;
      }
    }

    await supabase
      .from('game_rooms')
      .update(updates)
      .eq('id', gameRoom.id);
  };

  if (!gameState.player2_id) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4 animate-pulse">
          <Hand className="w-8 h-8 text-teal-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">En attente d'un adversaire...</h3>
        <p className="text-gray-600">Patientez pendant qu'un autre joueur rejoint la partie</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Pierre-Feuille-Ciseaux</h3>

        {result ? (
          <div className="space-y-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
              result === 'win' ? 'bg-green-100 text-green-700' :
              result === 'lose' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              <Trophy className="w-5 h-5 mr-2" />
              <span className="font-semibold">
                {result === 'win' ? 'Vous avez gagné!' :
                 result === 'lose' ? 'Vous avez perdu' :
                 'Match nul!'}
              </span>
            </div>

            <div className="flex justify-center items-center gap-8">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Votre choix</p>
                <div className="text-6xl">{choices.find(c => c.value === myChoice)?.emoji}</div>
                <p className="text-sm font-medium text-gray-800 mt-2">
                  {choices.find(c => c.value === myChoice)?.label}
                </p>
              </div>

              <span className="text-2xl text-gray-400">vs</span>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Adversaire</p>
                <div className="text-6xl">
                  {choices.find(c => c.value === (isPlayer1 ? gameState.game_state?.player2Choice : gameState.game_state?.player1Choice))?.emoji}
                </div>
                <p className="text-sm font-medium text-gray-800 mt-2">
                  {choices.find(c => c.value === (isPlayer1 ? gameState.game_state?.player2Choice : gameState.game_state?.player1Choice))?.label}
                </p>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              Retour aux jeux
            </button>
          </div>
        ) : myChoice ? (
          <div className="space-y-4">
            <p className="text-gray-600">En attente du choix de l'adversaire...</p>
            <div className="text-6xl">{choices.find(c => c.value === myChoice)?.emoji}</div>
            <p className="font-medium text-gray-800">Vous avez choisi: {choices.find(c => c.value === myChoice)?.label}</p>
          </div>
        ) : (
          <p className="text-gray-600">Faites votre choix!</p>
        )}
      </div>

      {!myChoice && !result && (
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {choices.map((choice) => (
            <button
              key={choice.value}
              onClick={() => makeChoice(choice.value)}
              className="p-8 border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition transform hover:scale-105"
            >
              <div className="text-6xl mb-3">{choice.emoji}</div>
              <p className="font-semibold text-gray-800">{choice.label}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
