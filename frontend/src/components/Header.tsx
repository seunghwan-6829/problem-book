import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">📈</span>
          <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Coin Trading Guide
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  🛡️ 관리자
                </Link>
              )}
              <span className="text-gray-400">
                안녕하세요, <span className="font-medium text-white">{user.name}</span>님
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                로그인
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
