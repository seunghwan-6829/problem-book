import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'normal' | 'advanced';
  thumbnail_url?: string;
  content_image_url?: string;
  created_at: string;
}

const difficultyColors = {
  normal: 'bg-green-100 text-green-700',
  advanced: 'bg-purple-100 text-purple-700',
};

const difficultyLabels = {
  normal: '일반',
  advanced: '심화',
};

function Home() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('전체');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

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

  const handleProblemClick = (problem: Problem) => {
    // 심화 자료인데 승인받지 않은 유저면 접근 불가
    if (problem.difficulty === 'advanced' && (!user || user.tier !== 'premium')) {
      setShowAccessDenied(true);
      return;
    }
    setSelectedProblem(problem);
  };

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
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-4xl font-bold mb-3">
            박본질 크립토
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Difficulty Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['전체', 'normal', 'advanced'].map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => setSelectedDifficulty(difficulty)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedDifficulty === difficulty
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {difficulty === '전체' ? '전체' : 
               difficulty === 'normal' ? '일반' : '심화'}
            </button>
          ))}
        </div>

        {/* Grid Layout - 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredProblems.map((problem) => (
            <div
              key={problem.id}
              onClick={() => handleProblemClick(problem)}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer"
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
                    <span className="text-6xl opacity-30">📊</span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[problem.difficulty] || difficultyColors.normal}`}>
                    {difficultyLabels[problem.difficulty] || '일반'}
                  </span>
                </div>
                {/* 심화 자료 잠금 표시 */}
                {problem.difficulty === 'advanced' && (!user || user.tier !== 'premium') && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-4xl">🔒</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-1">
                  {problem.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {problem.description.substring(0, 60)}...
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredProblems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">매매법이 없습니다.</p>
          </div>
        )}
      </main>

      {/* Content Modal */}
      {selectedProblem && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProblem(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedProblem.title}</h2>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[selectedProblem.difficulty] || difficultyColors.normal}`}>
                  {difficultyLabels[selectedProblem.difficulty] || '일반'}
                </span>
              </div>
              <button
                onClick={() => setSelectedProblem(null)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              {/* 본문 이미지 */}
              {selectedProblem.content_image_url && (
                <div className="mb-6 rounded-xl overflow-hidden">
                  <img 
                    src={selectedProblem.content_image_url} 
                    alt={selectedProblem.title}
                    className="w-full"
                  />
                </div>
              )}

              {/* 설명 */}
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {selectedProblem.description}
              </div>

              {/* 매매 팁 */}
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                <h3 className="text-base font-semibold text-blue-700 mb-2">💡 매매 팁</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 항상 손절라인을 미리 설정하세요</li>
                  <li>• 한 번에 전체 자금을 투입하지 마세요</li>
                  <li>• 패턴이 완성될 때까지 기다리세요</li>
                </ul>
              </div>

              {/* 위험 경고 */}
              <div className="mt-4 bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-red-600 text-sm">
                  ⚠️ 투자에는 항상 위험이 따릅니다. 본 정보는 교육 목적이며 투자 조언이 아닙니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Access Denied Modal */}
      {showAccessDenied && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAccessDenied(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">별도 승인이 필요합니다</h3>
            <p className="text-gray-500 mb-6">
              심화 자료는 승인된 회원만 열람할 수 있습니다.<br/>
              관리자에게 승인을 요청해주세요.
            </p>
            <button
              onClick={() => setShowAccessDenied(false)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
