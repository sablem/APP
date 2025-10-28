import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Trophy, X as XIcon, Circle } from 'lucide-react';

type GameRoom = {
  id: string;
  game_type: string;
  player1_id: string;
  player2_id: string | null;
  game_state: any;
  status: string;
  winner_id: string | null;
};

type TicTacToeProps = {
  gameRoom: GameRoom;
  onComplete: () => void;
};

export const TicTacToe = ({ gameRoom, onComplete }: TicTacToeProps) => {
  const { user } = useAuth();
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState<string>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [gameState, setGameState] = useState(gameRoom);

  const isPlayer1 = user?.id === gameRoom.player1_id;
  const mySymbol = isPlayer1 ? 'X' : 'O';

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
        if (updated.game_state?.board) {
          setBoard(updated.game_state.board);
          setCurrentTurn(updated.game_state.currentTurn || 'X');
        }
        if (updated.winner_id) {
          setWinner(updated.winner_id === user?.id ? 'you' : 'opponent');
          updateStats(updated.winner_id === user?.id);
        }
      })
      .subscribe();

    if (gameRoom.game_state?.board) {
      setBoard(gameRoom.game_state.board);
      setCurrentTurn(gameRoom.game_state.currentTurn || 'X');
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameRoom.id]);

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

  const checkWinner = (squares: (string | null)[]): string | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }

    return null;
  };

  const handleClick = async (index: number) => {
    if (board[index] || winner) return;
    if ((currentTurn === 'X' && !isPlayer1) || (currentTurn === 'O' && isPlayer1)) return;
    if (gameState.status !== 'in_progress') return;

    const newBoard = [...board];
    newBoard[index] = currentTurn;

    const winningSymbol = checkWinner(newBoard);
    const isDraw = !winningSymbol && newBoard.every(cell => cell !== null);

    const newTurn = currentTurn === 'X' ? 'O' : 'X';

    const updates: any = {
      game_state: {
        board: newBoard,
        currentTurn: newTurn,
      },
    };

    if (winningSymbol) {
      updates.status = 'completed';
      updates.winner_id = winningSymbol === 'X' ? gameRoom.player1_id : gameRoom.player2_id;
      updates.completed_at = new Date().toISOString();
    } else if (isDraw) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }

    await supabase
      .from('game_rooms')
      .update(updates)
      .eq('id', gameRoom.id);
  };

  const renderCell = (index: number) => {
    const value = board[index];
    return (
      <button
        onClick={() => handleClick(index)}
        className={`w-24 h-24 border-2 border-gray-300 rounded-lg flex items-center justify-center text-4xl font-bold transition ${
          !value && gameState.status === 'in_progress' && ((currentTurn === 'X' && isPlayer1) || (currentTurn === 'O' && !isPlayer1))
            ? 'hover:bg-teal-50 cursor-pointer'
            : 'cursor-not-allowed'
        }`}
        disabled={!!value || winner !== null || gameState.status !== 'in_progress'}
      >
        {value === 'X' && <XIcon className="w-12 h-12 text-blue-600" />}
        {value === 'O' && <Circle className="w-12 h-12 text-red-600" />}
      </button>
    );
  };

  if (!gameState.player2_id) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4 animate-pulse">
          <Trophy className="w-8 h-8 text-teal-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">En attente d'un adversaire...</h3>
        <p className="text-gray-600">Patientez pendant qu'un autre joueur rejoint la partie</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Tic-Tac-Toe</h3>

        {winner ? (
          <div className="space-y-3">
            <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
              winner === 'you' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <Trophy className="w-5 h-5 mr-2" />
              <span className="font-semibold">
                {winner === 'you' ? 'Vous avez gagné!' : 'Vous avez perdu'}
              </span>
            </div>
            <button
              onClick={onComplete}
              className="block mx-auto px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              Retour aux jeux
            </button>
          </div>
        ) : gameState.status === 'completed' ? (
          <div className="space-y-3">
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
              <span className="font-semibold">Match nul!</span>
            </div>
            <button
              onClick={onComplete}
              className="block mx-auto px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              Retour aux jeux
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <div className={`px-4 py-2 rounded-lg ${
              currentTurn === mySymbol ? 'bg-teal-100 text-teal-700 font-semibold' : 'bg-gray-100 text-gray-600'
            }`}>
              Vous: {mySymbol}
            </div>
            <span className="text-gray-400">vs</span>
            <div className={`px-4 py-2 rounded-lg ${
              currentTurn !== mySymbol ? 'bg-teal-100 text-teal-700 font-semibold' : 'bg-gray-100 text-gray-600'
            }`}>
              Adversaire: {mySymbol === 'X' ? 'O' : 'X'}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
            <div key={index}>{renderCell(index)}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
