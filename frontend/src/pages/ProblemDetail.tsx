import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  thumbnail_url?: string;
  content_image_url?: string;
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

function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`https://backend-six-lyart-32.vercel.app/problems/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setProblem(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching problem:', err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">매매법을 찾을 수 없습니다.</p>
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Sub Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-flex items-center gap-1"
          >
            ← 목록으로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {problem.title}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${difficultyColors[problem.difficulty]}`}>
              {difficultyLabels[problem.difficulty]}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* 본문 이미지 */}
        {problem.content_image_url && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
            <img 
              src={problem.content_image_url} 
              alt={problem.title}
              className="w-full"
            />
          </div>
        )}

        {/* 매매법 설명 */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            📖 매매법 설명
          </h2>
          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
            {problem.description}
          </div>
        </div>

        {/* 매매 팁 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center gap-2">
            💡 매매 팁
          </h3>
          <ul className="text-gray-700 space-y-2 text-sm">
            <li>• 항상 손절라인을 미리 설정하세요</li>
            <li>• 한 번에 전체 자금을 투입하지 마세요</li>
            <li>• 패턴이 완성될 때까지 기다리세요</li>
            <li>• 거래량을 함께 확인하세요</li>
          </ul>
        </div>

        {/* 위험 경고 */}
        <div className="mt-6 bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-red-600 text-sm flex items-center gap-2">
            ⚠️ 투자에는 항상 위험이 따릅니다. 본 정보는 교육 목적이며 투자 조언이 아닙니다.
          </p>
        </div>
      </main>
    </div>
  );
}

export default ProblemDetail;
