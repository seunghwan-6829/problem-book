import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  created_at: string;
}

const difficultyColors = {
  easy: 'bg-green-500/20 text-green-400 border border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const difficultyLabels = {
  easy: '초급',
  medium: '중급',
  hard: '고급',
};

const categoryIcons: Record<string, string> = {
  '캔들 패턴': '🕯️',
  '차트 패턴': '📊',
  '기술적 지표': '📈',
  '매매 전략': '🎯',
  '리스크 관리': '🛡️',
  '심리 분석': '🧠',
};

function Home() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

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

  const categories = ['전체', ...new Set(problems.map(p => p.category))];
  const filteredProblems = selectedCategory === '전체' 
    ? problems 
    : problems.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-4xl font-bold text-white mb-3">
            📈 코인 매매법 가이드
          </h2>
          <p className="text-gray-400 text-lg">
            차트 패턴과 기술적 분석으로 성공적인 트레이딩을 시작하세요
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {problems.length}개 매매법
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Category Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {categoryIcons[category] || '📌'} {category}
            </button>
          ))}
        </div>

        {/* Trading Method List */}
        <div className="grid gap-4">
          {filteredProblems.map((problem) => (
            <Link
              key={problem.id}
              to={`/problems/${problem.id}`}
              className="block bg-gray-800/50 rounded-2xl border border-gray-700 p-6 hover:bg-gray-800 hover:border-gray-600 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{categoryIcons[problem.category] || '📌'}</span>
                    <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {problem.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[problem.difficulty]}`}
                    >
                      {difficultyLabels[problem.difficulty]}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-3 line-clamp-2 pl-9">
                    {problem.description.substring(0, 100)}...
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 pl-9">
                    <span className="px-3 py-1 bg-gray-700/50 rounded-lg">
                      {problem.category}
                    </span>
                  </div>
                </div>
                <svg
                  className="w-6 h-6 text-gray-600 group-hover:text-blue-400 flex-shrink-0 ml-4 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
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
