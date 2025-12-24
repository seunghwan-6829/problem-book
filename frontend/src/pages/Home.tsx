import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  thumbnail_url?: string;
  created_at: string;
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

const difficultyLabels = {
  easy: '초급',
  medium: '중급',
  hard: '고급',
};

function Home() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('전체');

  useEffect(() => {
    fetch('https://backend-six-lyart-32.vercel.app/problems')
      .then((res) => res.json())
      .then((data) => {
        setProblems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching problems:', err);
        setLoading(false);
      });
  }, []);

  const filteredProblems = selectedDifficulty === '전체' 
    ? problems 
    : problems.filter(p => p.difficulty === selectedDifficulty);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-4xl font-bold mb-3">
            💎 박본질 크립토
          </h2>
          <p className="text-blue-100 text-lg">
            차트 패턴과 기술적 분석으로 성공적인 트레이딩을 시작하세요
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {problems.length}개 매매법
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Difficulty Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['전체', 'easy', 'medium', 'hard'].map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => setSelectedDifficulty(difficulty)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedDifficulty === difficulty
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {difficulty === '전체' ? '📌 전체' : 
               difficulty === 'easy' ? '🟢 초급' :
               difficulty === 'medium' ? '🟡 중급' : '🔴 고급'}
            </button>
          ))}
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProblems.map((problem) => (
            <Link
              key={problem.id}
              to={`/problems/${problem.id}`}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300"
            >
              {/* Thumbnail - 1:1 비율 */}
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-50 relative overflow-hidden">
                {problem.thumbnail_url ? (
                  <img 
                    src={problem.thumbnail_url} 
                    alt={problem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl opacity-30">📊</span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[problem.difficulty]}`}>
                    {difficultyLabels[problem.difficulty]}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  {problem.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {problem.description.substring(0, 80)}...
                </p>
              </div>
            </Link>
          ))}
        </div>

        {filteredProblems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">매매법이 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;
