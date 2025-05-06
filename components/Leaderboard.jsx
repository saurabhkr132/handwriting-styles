'use client';
import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';

const trophyColors = ['text-yellow-400', 'text-gray-400', 'text-orange-500'];
const bgHighlightColors = ['bg-yellow-100', 'bg-gray-300', 'bg-orange-100'];

export default function LeaderboardComponent() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();

        if (res.ok && Array.isArray(data.leaderboard)) {
          const sortedTop10 = data.leaderboard
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
          setLeaderboard(sortedTop10);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (err) {
        console.error('Leaderboard error:', err);
        setError('Failed to load leaderboard.');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  if (loading) return <p className="text-center mt-4">Loading leaderboard...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (leaderboard.length === 0) return <p className="text-center">No leaderboard data found.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto mt-2 bg-gradient-to-b from-white to-blue-50 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center text-blue-800 mb-6">🏆 Leaderboard</h2>

      <div className="space-y-4">
        {leaderboard.map((entry, index) => {
          const isTopThree = index < 3;
          return (
            <div
              key={entry.user}
              className={`flex items-center justify-between px-4 py-3 rounded-xl shadow-md ${
                isTopThree ? bgHighlightColors[index] : 'bg-white hover:bg-blue-100'
              } transition-all`}
            >
              <div className="flex items-center gap-1">
                <div className="text-xl font-bold text-blue-700 w-8 text-center">
                  {index + 1}
                </div>

                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-semibold text-blue-800">
                  {entry.user[0].toUpperCase()}
                </div>

                <div className="text-lg font-medium text-gray-800">{entry.user}</div>
              </div>

              <div className="flex items-center gap-2 font-semibold text-blue-700">
                {isTopThree && (
                  <Trophy className={`w-5 h-5 ${trophyColors[index]}`} />
                )}
                {entry.score}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
