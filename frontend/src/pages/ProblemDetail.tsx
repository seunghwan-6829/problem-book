import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  createdAt: string;
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

const difficultyLabels = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">문제를 찾을 수 없습니다.</p>
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
    <div className="min-h-screen bg-white">
      <Header />

      {/* Sub Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block"
          >
            ← 목록으로
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">
            {problem.title}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${difficultyColors[problem.difficulty]}`}
            >
              {difficultyLabels[problem.difficulty]}
            </span>
            <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
              {problem.category}
            </span>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              문제 설명
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {problem.description}
            </p>
          </div>
        </div>

        {/* Code Editor Placeholder */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">코드 작성</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              제출
            </button>
          </div>
          <div className="bg-gray-950 rounded-lg p-4 min-h-[300px]">
            <pre className="text-gray-400 text-sm font-mono">
              {`// 여기에 코드를 작성하세요
function solution() {
  // ...
}`}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProblemDetail;

