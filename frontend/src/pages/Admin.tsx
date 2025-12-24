import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ImageCropper from '../components/ImageCropper';
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
  thumbnail_url?: string;
  content_image_url?: string;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  adminCount: number;
  userCount: number;
  todayVisits: number;
}

const API_URL = 'https://backend-six-lyart-32.vercel.app';

function Admin() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'content'>('content');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // 폼 상태
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    thumbnail_url: '',
    content_image_url: '',
  });

  // 이미지 크롭 상태
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropperType, setCropperType] = useState<'thumbnail' | 'content'>('thumbnail');
  
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);

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

  // 이미지 선택 핸들러
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'content') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
      setCropperType(type);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  // 크롭 완료 후 업로드
  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperImage(null);
    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', croppedBlob, `${cropperType}-${Date.now()}.jpg`);

      const res = await fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      if (!res.ok) {
        throw new Error('업로드 실패');
      }

      const { url } = await res.json();

      if (cropperType === 'thumbnail') {
        setFormData(prev => ({ ...prev, thumbnail_url: url }));
      } else {
        setFormData(prev => ({ ...prev, content_image_url: url }));
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
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
      thumbnail_url: problem.thumbnail_url || '',
      content_image_url: problem.content_image_url || '',
    });
  };

  const resetForm = () => {
    setEditingProblem(null);
    setFormData({
      title: '',
      description: '',
      difficulty: 'easy',
      thumbnail_url: '',
      content_image_url: '',
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Image Cropper Modal */}
      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          aspectRatio={cropperType === 'thumbnail' ? 1 : null}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperImage(null)}
        />
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🛡️ 관리자 대시보드</h1>
          <p className="text-gray-500 mt-1">사용자 및 콘텐츠 관리</p>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
              <div className="text-gray-500 text-sm mt-1">전체 사용자</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-purple-600">{stats.adminCount}</div>
              <div className="text-gray-500 text-sm mt-1">관리자</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-green-600">{problems.length}</div>
              <div className="text-gray-500 text-sm mt-1">매매법</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-orange-600">{stats.todayVisits}</div>
              <div className="text-gray-500 text-sm mt-1">오늘 방문</div>
            </div>
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'content'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            📝 콘텐츠 관리
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            👥 사용자 관리
          </button>
        </div>

        {/* 사용자 관리 탭 */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">사용자 목록</h2>
            </div>

            {users.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                등록된 사용자가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">아이디</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등급</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">방문</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가입일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                              {u.name.charAt(0)}
                            </div>
                            <div className="ml-3 text-gray-900">{u.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{u.username}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {u.role === 'admin' ? '관리자' : '일반'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{u.visit_count}회</td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(u.created_at)}</td>
                        <td className="px-6 py-4">
                          {u.id !== user?.id && (
                            <button
                              onClick={() => updateRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                u.role === 'admin'
                                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingProblem ? '✏️ 매매법 수정' : '➕ 새 매매법 추가'}
              </h2>
              
              <form onSubmit={handleSubmitProblem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="매매법 제목"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">난이도</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                  >
                    <option value="easy">초급</option>
                    <option value="medium">중급</option>
                    <option value="hard">고급</option>
                  </select>
                </div>

                {/* 썸네일 이미지 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🖼️ 썸네일 이미지 (1:1 비율)
                  </label>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e, 'thumbnail')}
                    className="hidden"
                  />
                  
                  {formData.thumbnail_url ? (
                    <div className="relative">
                      <img 
                        src={formData.thumbnail_url} 
                        alt="썸네일" 
                        className="w-32 h-32 rounded-xl object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, thumbnail_url: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      disabled={uploading}
                      className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                    >
                      {uploading && cropperType === 'thumbnail' ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <>
                          <span className="text-2xl mb-1">📷</span>
                          <span className="text-xs">이미지 추가</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* 본문 이미지 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📸 본문 이미지 (자유 비율)
                  </label>
                  <input
                    ref={contentInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e, 'content')}
                    className="hidden"
                  />
                  
                  {formData.content_image_url ? (
                    <div className="relative inline-block">
                      <img 
                        src={formData.content_image_url} 
                        alt="본문 이미지" 
                        className="max-h-48 rounded-xl object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, content_image_url: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => contentInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                    >
                      {uploading && cropperType === 'content' ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <>
                          <span className="text-2xl mb-1">🖼️</span>
                          <span className="text-xs">본문 이미지 추가</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 h-48 font-mono text-sm"
                    placeholder="매매법 설명을 입력하세요..."
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
                  >
                    {editingProblem ? '수정 완료' : '추가하기'}
                  </button>
                  {editingProblem && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* 매매법 목록 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">📚 매매법 목록 ({problems.length})</h2>
              </div>
              
              <div className="max-h-[700px] overflow-y-auto">
                {problems.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">
                    등록된 매매법이 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {problems.map((problem) => (
                      <div key={problem.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                          {/* 썸네일 미리보기 */}
                          <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {problem.thumbnail_url ? (
                              <img src={problem.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">📊</div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 font-medium truncate">{problem.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                problem.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {problem.difficulty === 'easy' ? '초급' : problem.difficulty === 'medium' ? '중급' : '고급'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleEditProblem(problem)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteProblem(problem.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200"
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
