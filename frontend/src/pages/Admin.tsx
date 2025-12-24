import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

interface UserInfo {
  id: string;
  username: string;
  name: string;
  role: 'user' | 'admin';
  visit_count: number;
  last_visit: string;
  created_at: string;
}

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  adminCount: number;
  userCount: number;
  todayVisits: number;
}

const API_URL = 'https://backend-six-lyart-32.vercel.app';

const categories = ['캔들 패턴', '차트 패턴', '기술적 지표', '매매 전략', '리스크 관리', '심리 분석'];

function Admin() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'content'>('users');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 폼 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    category: '캔들 패턴',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes, problemsRes] = await Promise.all([
        fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/problems`),
      ]);

      if (!usersRes.ok || !statsRes.ok) {
        throw new Error('데이터를 불러올 수 없습니다.');
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      const problemsData = await problemsRes.json();

      setUsers(usersData);
      setStats(statsData);
      setProblems(problemsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        ));
      }
    } catch (err) {
      console.error('역할 변경 실패:', err);
    }
  };

  const handleSubmitProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingProblem 
        ? `${API_URL}/problems/${editingProblem.id}`
        : `${API_URL}/problems`;
      
      const res = await fetch(url, {
        method: editingProblem ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchData();
        resetForm();
      }
    } catch (err) {
      console.error('저장 실패:', err);
    }
  };

  const handleDeleteProblem = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const res = await fetch(`${API_URL}/problems/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setProblems(problems.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('삭제 실패:', err);
    }
  };

  const handleEditProblem = (problem: Problem) => {
    setEditingProblem(problem);
    setFormData({
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      category: problem.category,
    });
    setIsEditing(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingProblem(null);
    setFormData({
      title: '',
      description: '',
      difficulty: 'easy',
      category: '캔들 패턴',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">🛡️ 관리자 대시보드</h1>
          <p className="text-gray-400 mt-1">사용자 및 콘텐츠 관리</p>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="text-3xl font-bold text-blue-400">{stats.totalUsers}</div>
              <div className="text-gray-400 text-sm mt-1">전체 사용자</div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="text-3xl font-bold text-purple-400">{stats.adminCount}</div>
              <div className="text-gray-400 text-sm mt-1">관리자</div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="text-3xl font-bold text-green-400">{problems.length}</div>
              <div className="text-gray-400 text-sm mt-1">매매법</div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="text-3xl font-bold text-orange-400">{stats.todayVisits}</div>
              <div className="text-gray-400 text-sm mt-1">오늘 방문</div>
            </div>
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            👥 사용자 관리
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'content'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📝 콘텐츠 관리
          </button>
        </div>

        {/* 사용자 관리 탭 */}
        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">사용자 목록</h2>
            </div>

            {users.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                등록된 사용자가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">사용자</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">아이디</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">등급</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">방문</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">가입일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                              {u.name.charAt(0)}
                            </div>
                            <div className="ml-3 text-white">{u.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{u.username}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-600/20 text-gray-400'
                          }`}>
                            {u.role === 'admin' ? '관리자' : '일반'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{u.visit_count}회</td>
                        <td className="px-6 py-4 text-gray-400">{formatDate(u.created_at)}</td>
                        <td className="px-6 py-4">
                          {u.id !== user?.id && (
                            <button
                              onClick={() => updateRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                u.role === 'admin'
                                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
                              }`}
                            >
                              {u.role === 'admin' ? '관리자 해제' : '관리자 지정'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 콘텐츠 관리 탭 */}
        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 작성/수정 폼 */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                {editingProblem ? '✏️ 매매법 수정' : '➕ 새 매매법 추가'}
              </h2>
              
              <form onSubmit={handleSubmitProblem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="매매법 제목"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">난이도</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white"
                    >
                      <option value="easy">초급</option>
                      <option value="medium">중급</option>
                      <option value="hard">고급</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">카테고리</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">내용</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white h-64 font-mono text-sm"
                    placeholder="매매법 설명을 입력하세요...&#10;&#10;📊 차트 패턴:&#10;📖 설명:&#10;🎯 매매 전략:"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-blue-700 transition-all"
                  >
                    {editingProblem ? '수정 완료' : '추가하기'}
                  </button>
                  {editingProblem && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-500"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* 매매법 목록 */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">📚 매매법 목록 ({problems.length})</h2>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto">
                {problems.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">
                    등록된 매매법이 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {problems.map((problem) => (
                      <div key={problem.id} className="px-6 py-4 hover:bg-gray-700/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{problem.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                problem.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                                problem.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {problem.difficulty === 'easy' ? '초급' : problem.difficulty === 'medium' ? '중급' : '고급'}
                              </span>
                              <span className="text-gray-500 text-xs">{problem.category}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditProblem(problem)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteProblem(problem.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Admin;
