import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

interface MockExamSection {
  id: string;
  title: string;
  description: string;
  category: string;
  frequency: 'high' | 'medium' | 'low';
  thumbnail_url?: string;
  created_at: string;
}

const frequencyColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const frequencyLabels = {
  high: '상',
  medium: '중',
  low: '하',
};

const API_URL = 'https://backend-six-lyart-32.vercel.app';

// 기본 모의시험 섹션 데이터 (초기 12개)
const defaultSections: MockExamSection[] = [
  { id: '1', title: '이동평균선 돌파 전략', description: '이동평균선을 활용한 추세 추종 매매법. 골든크로스와 데드크로스를 활용합니다.', category: '기술적분석', frequency: 'high', created_at: new Date().toISOString() },
  { id: '2', title: 'RSI 과매수/과매도', description: 'RSI 지표를 활용하여 과매수와 과매도 구간에서의 진입/청산 전략.', category: '기술적분석', frequency: 'high', created_at: new Date().toISOString() },
  { id: '3', title: '볼린저밴드 스퀴즈', description: '볼린저밴드 수축 후 확장 시점을 포착하는 변동성 돌파 전략.', category: '기술적분석', frequency: 'medium', created_at: new Date().toISOString() },
  { id: '4', title: 'MACD 다이버전스', description: '가격과 MACD 지표 간의 다이버전스를 활용한 추세 전환 포착.', category: '기술적분석', frequency: 'high', created_at: new Date().toISOString() },
  { id: '5', title: '피보나치 되돌림', description: '피보나치 비율을 활용한 지지/저항 구간 설정 및 진입점 분석.', category: '가격분석', frequency: 'medium', created_at: new Date().toISOString() },
  { id: '6', title: '캔들패턴 분석', description: '망치형, 도지, 잉태형 등 주요 캔들 패턴을 활용한 단기 매매.', category: '가격분석', frequency: 'high', created_at: new Date().toISOString() },
  { id: '7', title: '거래량 분석', description: '거래량과 가격의 관계를 분석하여 추세의 강도를 판단합니다.', category: '거래량', frequency: 'medium', created_at: new Date().toISOString() },
  { id: '8', title: '지지/저항 매매', description: '주요 지지선과 저항선에서의 반등/돌파 매매 전략.', category: '가격분석', frequency: 'high', created_at: new Date().toISOString() },
  { id: '9', title: '스캘핑 전략', description: '초단타 매매를 위한 빠른 진입과 청산 전략.', category: '단기매매', frequency: 'low', created_at: new Date().toISOString() },
  { id: '10', title: '스윙 트레이딩', description: '며칠에서 몇 주간 포지션을 유지하는 중기 매매 전략.', category: '중기매매', frequency: 'medium', created_at: new Date().toISOString() },
  { id: '11', title: '브레이크아웃 전략', description: '박스권 돌파 시점을 포착하여 추세 초기에 진입하는 전략.', category: '가격분석', frequency: 'high', created_at: new Date().toISOString() },
  { id: '12', title: '자금 관리법', description: '리스크 관리와 포지션 사이징을 통한 안정적인 수익 관리.', category: '리스크관리', frequency: 'high', created_at: new Date().toISOString() },
];

function MockExam() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<MockExamSection[]>(defaultSections);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<MockExamSection | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'frequency'>('default');

  // 권한 체크
  const canAccess = user?.role === 'admin' || user?.role === 'master' || user?.tier === 'premium';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!canAccess) {
      navigate('/');
      return;
    }

    // API에서 모의시험 섹션 가져오기 (있으면)
    const fetchSections = async () => {
      try {
        const res = await fetch(`${API_URL}/mock-exams`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setSections(data);
          }
        }
      } catch (err) {
        console.log('Using default sections');
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [user, token, navigate, canAccess]);

  // 정렬
  const sortedSections = [...sections].sort((a, b) => {
    if (sortBy === 'name') {
      return a.title.localeCompare(b.title, 'ko');
    }
    if (sortBy === 'frequency') {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.frequency] - order[b.frequency];
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-500">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-5xl font-medium mb-3">
            모의시험
          </h2>
          <p className="text-purple-100 text-lg">
            코인 매매법을 학습하고 테스트해보세요
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {sections.length}개 섹션
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Sort Buttons */}
        <div className="flex justify-between items-center mb-8">
          <p className="text-gray-600">{sections.length}개의 개념</p>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('default')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === 'default'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              기본순
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === 'name'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              이름순
            </button>
            <button
              onClick={() => setSortBy('frequency')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === 'frequency'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              빈도순
            </button>
          </div>
        </div>

        {/* Grid Layout - 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sortedSections.map((section) => (
            <div
              key={section.id}
              onClick={() => setSelectedSection(section)}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-purple-300 transition-all duration-300 cursor-pointer"
            >
              {/* Card Header */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {section.category}
                  </span>
                  <div className="flex gap-1">
                    <button className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                      ☆
                    </button>
                    <button className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                      ✓
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-2">
                  {section.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                  {section.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★★★</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${frequencyColors[section.frequency]}`}>
                      출제빈도: {frequencyLabels[section.frequency]}
                    </span>
                  </div>
                  <span className="text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                    자세히 보기 →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedSection && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSection(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                  {selectedSection.category}
                </span>
                <h2 className="text-xl font-bold mt-2">{selectedSection.title}</h2>
              </div>
              <button
                onClick={() => setSelectedSection(null)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${frequencyColors[selectedSection.frequency]}`}>
                  출제빈도: {frequencyLabels[selectedSection.frequency]}
                </span>
              </div>

              <p className="text-gray-700 leading-relaxed text-lg mb-6">
                {selectedSection.description}
              </p>

              {/* 학습 가이드 */}
              <div className="bg-purple-50 rounded-xl p-5 border border-purple-200 mb-4">
                <h3 className="text-base font-semibold text-purple-700 mb-3">📚 학습 포인트</h3>
                <ul className="text-gray-700 space-y-2 text-sm">
                  <li>• 해당 전략의 핵심 원리를 이해하세요</li>
                  <li>• 실제 차트에서 패턴을 찾아보세요</li>
                  <li>• 백테스팅을 통해 승률을 확인하세요</li>
                </ul>
              </div>

              {/* 시험 시작 버튼 */}
              <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all">
                모의시험 시작하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MockExam;

