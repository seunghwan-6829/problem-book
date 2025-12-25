import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // 관리자 또는 마스터는 대시보드 접근 가능
  const canAccessAdmin = user?.role === 'admin' || user?.role === 'master';
  
  // 모의시험 접근 가능 여부 (심화, 마스터, 관리자)
  const canAccessMockExam = user?.role === 'admin' || user?.role === 'master' || user?.tier === 'premium';

  const handleMockExamClick = () => {
    if (!user) {
      setShowAccessDenied(true);
      return;
    }
    if (!canAccessMockExam) {
      setShowAccessDenied(true);
      return;
    }
    navigate('/mock-exam');
  };

  return (
    <>
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-black text-gray-900">
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              박본질 크립토
            </span>
          </Link>
          
          {/* 네비게이션 메뉴 */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={handleMockExamClick}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              모의시험
            </button>
            <Link
              to="/coming"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              준비중
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {canAccessAdmin && (
                <Link
                  to="/admin"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  관리자
                </Link>
              )}
              <span className="text-gray-600">
                안녕하세요, <span className="font-medium text-gray-900">{user.name}</span>님
                {user.role === 'admin' && (
                  <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">관리자</span>
                )}
                {user.role === 'master' && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">마스터</span>
                )}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                로그인
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>

    {/* 모의시험 접근 불가 모달 */}
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
    </>
  );
}

export default Header;
