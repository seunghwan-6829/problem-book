import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ImageCropper from '../components/ImageCropper';
import { useAuth } from '../contexts/AuthContext';

interface UserInfo {
  id: string;
  username: string;
  name: string;
  role: 'user' | 'master' | 'admin';
  tier: 'basic' | 'premium';
  visit_count: number;
  last_visit: string;
  created_at: string;
}

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'normal' | 'advanced';
  thumbnail_url?: string;
  content_image_url?: string;
  created_at: string;
}

interface MockExamSection {
  id: string;
  title: string;
  description: string;
  category: string;
  frequency: 'high' | 'medium' | 'low';
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
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'mockexam'>('content');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [mockExamSections, setMockExamSections] = useState<MockExamSection[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // 폼 상태
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'normal' as 'normal' | 'advanced',
    thumbnail_url: '',
    content_image_url: '',
  });

  // 모의시험 폼 상태
  const [editingMockExam, setEditingMockExam] = useState<MockExamSection | null>(null);
  const [mockExamFormData, setMockExamFormData] = useState({
    title: '',
    description: '',
    category: '기술적분석',
    frequency: 'medium' as 'high' | 'medium' | 'low',
    content_image_url: '',
  });

  // 모의시험 이미지 ref
  const mockExamContentInputRef = useRef<HTMLInputElement>(null);

  // 이미지 크롭 상태
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropperType, setCropperType] = useState<'thumbnail' | 'content' | 'mockexam-content'>('thumbnail');
  
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin';
  const isMaster = user?.role === 'master';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // 관리자 또는 마스터만 접근 가능
    if (user.role !== 'admin' && user.role !== 'master') {
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

      // 관리자 > 마스터 > 일반 순으로 정렬
      const sortedUsers = usersData.sort((a: UserInfo, b: UserInfo) => {
        const roleOrder = { admin: 0, master: 1, user: 2 };
        return (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2);
      });

      setUsers(sortedUsers);
      setStats(statsData);
      setProblems(problemsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 역할 변경 가능 여부 체크
  const canChangeRole = (targetUser: UserInfo) => {
    // 자기 자신은 변경 불가
    if (targetUser.id === user?.id) return false;
    // 관리자는 모든 사용자 변경 가능
    if (isAdmin) return true;
    // 마스터는 관리자 변경 불가
    if (isMaster && targetUser.role === 'admin') return false;
    // 마스터는 일반 사용자만 변경 가능
    if (isMaster) return targetUser.role === 'user';
    return false;
  };

  const updateRole = async (userId: string, newRole: 'user' | 'master') => {
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
        await fetchData();
        setSubmitMessage({ type: 'success', text: '역할이 변경되었습니다!' });
        setTimeout(() => setSubmitMessage(null), 3000);
      }
    } catch (err) {
      console.error('역할 변경 실패:', err);
    }
  };

  const updateTier = async (userId: string, newTier: 'basic' | 'premium') => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/tier`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: newTier }),
      });

      if (res.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, tier: newTier } : u
        ));
        setSubmitMessage({ type: 'success', text: '등급이 변경되었습니다!' });
        setTimeout(() => setSubmitMessage(null), 3000);
      }
    } catch (err) {
      console.error('등급 변경 실패:', err);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`정말 "${userName}" 사용자를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        setSubmitMessage({ type: 'success', text: '사용자가 삭제되었습니다.' });
        setTimeout(() => setSubmitMessage(null), 3000);
      }
    } catch (err) {
      console.error('삭제 실패:', err);
      setSubmitMessage({ type: 'error', text: '삭제에 실패했습니다.' });
    }
  };

  // 이미지 선택 핸들러
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'content' | 'mockexam-content') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
      setCropperType(type);
    };
    reader.readAsDataURL(file);
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
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || '업로드 실패');
      }

      const { url } = await res.json();

      if (cropperType === 'thumbnail') {
        setFormData(prev => ({ ...prev, thumbnail_url: url }));
      } else if (cropperType === 'content') {
        setFormData(prev => ({ ...prev, content_image_url: url }));
      } else if (cropperType === 'mockexam-content') {
        setMockExamFormData(prev => ({ ...prev, content_image_url: url }));
      }
      
      setSubmitMessage({ type: 'success', text: '이미지가 업로드되었습니다!' });
      setTimeout(() => setSubmitMessage(null), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setSubmitMessage({ type: 'error', text: `이미지 업로드 실패: ${err.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setSubmitMessage({ type: 'error', text: '제목을 입력해주세요.' });
      return;
    }
    
    if (!formData.description.trim()) {
      setSubmitMessage({ type: 'error', text: '내용을 입력해주세요.' });
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);
    
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
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          difficulty: formData.difficulty,
          thumbnail_url: formData.thumbnail_url || null,
          content_image_url: formData.content_image_url || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || '저장에 실패했습니다.');
      }

      setSubmitMessage({ 
        type: 'success', 
        text: editingProblem ? '매매법이 수정되었습니다!' : '새 매매법이 추가되었습니다!' 
      });
      
      await fetchData();
      resetForm();
      setTimeout(() => setSubmitMessage(null), 3000);
    } catch (err: any) {
      console.error('저장 실패:', err);
      setSubmitMessage({ type: 'error', text: `저장 실패: ${err.message}` });
    } finally {
      setSubmitting(false);
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
        setSubmitMessage({ type: 'success', text: '삭제되었습니다!' });
        setTimeout(() => setSubmitMessage(null), 3000);
      }
    } catch (err) {
      console.error('삭제 실패:', err);
      setSubmitMessage({ type: 'error', text: '삭제에 실패했습니다.' });
    }
  };

  const handleEditProblem = (problem: Problem) => {
    setEditingProblem(problem);
    setFormData({
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty || 'normal',
      thumbnail_url: problem.thumbnail_url || '',
      content_image_url: problem.content_image_url || '',
    });
    setSubmitMessage(null);
  };

  const resetForm = () => {
    setEditingProblem(null);
    setFormData({
      title: '',
      description: '',
      difficulty: 'normal',
      thumbnail_url: '',
      content_image_url: '',
    });
  };

  const resetMockExamForm = () => {
    setEditingMockExam(null);
    setMockExamFormData({
      title: '',
      description: '',
      category: '기술적분석',
      frequency: 'medium',
      content_image_url: '',
    });
  };

  const handleSubmitMockExam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mockExamFormData.title.trim()) {
      setSubmitMessage({ type: 'error', text: '제목을 입력해주세요.' });
      return;
    }

    setSubmitting(true);
    
    // 로컬 상태에 추가 (백엔드 API가 없으므로)
    const newSection: MockExamSection = {
      id: editingMockExam?.id || Date.now().toString(),
      title: mockExamFormData.title,
      description: mockExamFormData.description,
      category: mockExamFormData.category,
      frequency: mockExamFormData.frequency,
      content_image_url: mockExamFormData.content_image_url || undefined,
      created_at: new Date().toISOString(),
    };

    if (editingMockExam) {
      setMockExamSections(prev => prev.map(s => s.id === editingMockExam.id ? newSection : s));
      setSubmitMessage({ type: 'success', text: '모의시험 섹션이 수정되었습니다!' });
    } else {
      setMockExamSections(prev => [...prev, newSection]);
      setSubmitMessage({ type: 'success', text: '새 모의시험 섹션이 추가되었습니다!' });
    }

    resetMockExamForm();
    setSubmitting(false);
    setTimeout(() => setSubmitMessage(null), 3000);
  };

  const handleEditMockExam = (section: MockExamSection) => {
    setEditingMockExam(section);
    setMockExamFormData({
      title: section.title,
      description: section.description,
      category: section.category,
      frequency: section.frequency,
      content_image_url: section.content_image_url || '',
    });
  };

  const handleDeleteMockExam = (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setMockExamSections(prev => prev.filter(s => s.id !== id));
    setSubmitMessage({ type: 'success', text: '삭제되었습니다!' });
    setTimeout(() => setSubmitMessage(null), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">관리자</span>;
      case 'master':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">마스터</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">일반</span>;
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="text-gray-500 mt-1">
            {isAdmin ? '관리자' : '마스터'} 권한으로 접속 중
          </p>
        </div>

        {/* 메시지 표시 */}
        {submitMessage && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
            submitMessage.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {submitMessage.text}
          </div>
        )}

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
            매매법 관리
          </button>
          <button
            onClick={() => setActiveTab('mockexam')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'mockexam'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            모의시험 관리
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            사용자 관리
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
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
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                              u.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 
                              u.role === 'master' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                              'bg-gradient-to-br from-gray-400 to-gray-500'
                            }`}>
                              {u.name.charAt(0)}
                            </div>
                            <div className="ml-3 text-gray-900">{u.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{u.username}</td>
                        <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                        <td className="px-6 py-4">
                          {canChangeRole(u) ? (
                            <select
                              value={u.tier || 'basic'}
                              onChange={(e) => updateTier(u.id, e.target.value as 'basic' | 'premium')}
                              className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white"
                            >
                              <option value="basic">일반</option>
                              <option value="premium">심화</option>
                            </select>
                          ) : (
                            <span className="text-gray-500 text-sm">{u.tier === 'premium' ? '심화' : '일반'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{u.visit_count || 0}회</td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(u.created_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {canChangeRole(u) && (
                              <>
                                {u.role === 'user' && (
                                  <button
                                    onClick={() => updateRole(u.id, 'master')}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200"
                                  >
                                    마스터 지정
                                  </button>
                                )}
                                {u.role === 'master' && isAdmin && (
                                  <button
                                    onClick={() => updateRole(u.id, 'user')}
                                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300"
                                  >
                                    마스터 해제
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteUser(u.id, u.name)}
                                  className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
                                >
                                  삭제
                                </button>
                              </>
                            )}
                          </div>
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
                {editingProblem ? '매매법 수정' : '새 매매법 추가'}
              </h2>
              
              <form onSubmit={handleSubmitProblem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="매매법 제목"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">열람 등급</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                    disabled={submitting}
                  >
                    <option value="normal">일반 (모든 회원)</option>
                    <option value="advanced">심화 (승인 회원만)</option>
                  </select>
                </div>

                {/* 이미지 업로드 - 한 줄로 */}
                <div className="grid grid-cols-2 gap-4">
                  {/* 썸네일 이미지 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">썸네일 (1:1)</label>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, 'thumbnail')}
                      className="hidden"
                      disabled={submitting || uploading}
                    />
                    
                    {formData.thumbnail_url ? (
                      <div className="relative">
                        <img 
                          src={formData.thumbnail_url} 
                          alt="썸네일" 
                          className="w-full aspect-square rounded-xl object-cover border border-gray-200"
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
                        disabled={uploading || submitting}
                        className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                      >
                        {uploading && cropperType === 'thumbnail' ? (
                          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span className="text-xl mb-1">📷</span>
                            <span className="text-xs">썸네일</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* 본문 이미지 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">본문 이미지</label>
                    <input
                      ref={contentInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, 'content')}
                      className="hidden"
                      disabled={submitting || uploading}
                    />
                    
                    {formData.content_image_url ? (
                      <div className="relative">
                        <img 
                          src={formData.content_image_url} 
                          alt="본문 이미지" 
                          className="w-full aspect-square rounded-xl object-cover border border-gray-200"
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
                        disabled={uploading || submitting}
                        className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                      >
                        {uploading && cropperType === 'content' ? (
                          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span className="text-xl mb-1">🖼️</span>
                            <span className="text-xs">본문</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">내용 *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 h-40 text-sm"
                    placeholder="매매법 설명을 입력하세요..."
                    disabled={submitting}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        저장 중...
                      </>
                    ) : (
                      editingProblem ? '수정 완료' : '추가하기'
                    )}
                  </button>
                  {editingProblem && (
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={submitting}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 disabled:opacity-50"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* 매매법 목록 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">매매법 목록 ({problems.length})</h2>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto">
                {problems.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">
                    등록된 매매법이 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {problems.map((problem) => (
                      <div key={problem.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {problem.thumbnail_url ? (
                              <img src={problem.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">📊</div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 font-medium truncate">{problem.title}</h3>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                              problem.difficulty === 'advanced' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {problem.difficulty === 'advanced' ? '심화' : '일반'}
                            </span>
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

        {/* 모의시험 관리 탭 */}
        {activeTab === 'mockexam' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 작성/수정 폼 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingMockExam ? '모의시험 섹션 수정' : '새 모의시험 섹션 추가'}
              </h2>
              
              <form onSubmit={handleSubmitMockExam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
                  <input
                    type="text"
                    value={mockExamFormData.title}
                    onChange={(e) => setMockExamFormData({ ...mockExamFormData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="섹션 제목"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select
                    value={mockExamFormData.category}
                    onChange={(e) => setMockExamFormData({ ...mockExamFormData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                    disabled={submitting}
                  >
                    <option value="기술적분석">기술적분석</option>
                    <option value="가격분석">가격분석</option>
                    <option value="거래량">거래량</option>
                    <option value="단기매매">단기매매</option>
                    <option value="중기매매">중기매매</option>
                    <option value="리스크관리">리스크관리</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">출제 빈도</label>
                  <select
                    value={mockExamFormData.frequency}
                    onChange={(e) => setMockExamFormData({ ...mockExamFormData, frequency: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                    disabled={submitting}
                  >
                    <option value="high">상 (자주 출제)</option>
                    <option value="medium">중 (보통)</option>
                    <option value="low">하 (가끔 출제)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                  <textarea
                    value={mockExamFormData.description}
                    onChange={(e) => setMockExamFormData({ ...mockExamFormData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 h-32 text-sm"
                    placeholder="섹션 설명을 입력하세요..."
                    disabled={submitting}
                  />
                </div>

                {/* 본문 이미지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">본문 이미지</label>
                  <input
                    ref={mockExamContentInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e, 'mockexam-content')}
                    className="hidden"
                    disabled={submitting || uploading}
                  />
                  
                  {mockExamFormData.content_image_url ? (
                    <div className="relative">
                      <img 
                        src={mockExamFormData.content_image_url} 
                        alt="본문 이미지" 
                        className="w-full max-h-48 rounded-xl object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setMockExamFormData({ ...mockExamFormData, content_image_url: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => mockExamContentInputRef.current?.click()}
                      disabled={uploading || submitting}
                      className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors disabled:opacity-50"
                    >
                      {uploading && cropperType === 'mockexam-content' ? (
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="text-xl mb-1">🖼️</span>
                          <span className="text-xs">이미지 추가 (클릭 시에만 표시됨)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '저장 중...' : editingMockExam ? '수정 완료' : '추가하기'}
                  </button>
                  {editingMockExam && (
                    <button
                      type="button"
                      onClick={resetMockExamForm}
                      disabled={submitting}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 disabled:opacity-50"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* 모의시험 섹션 목록 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
                <h2 className="text-xl font-semibold text-gray-900">모의시험 섹션 ({mockExamSections.length})</h2>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto">
                {mockExamSections.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">
                    등록된 모의시험 섹션이 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {mockExamSections.map((section) => (
                      <div key={section.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold flex-shrink-0">
                            {section.category.charAt(0)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 font-medium truncate">{section.title}</h3>
                            <div className="flex gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                {section.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                section.frequency === 'high' ? 'bg-red-100 text-red-700' :
                                section.frequency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                빈도: {section.frequency === 'high' ? '상' : section.frequency === 'medium' ? '중' : '하'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleEditMockExam(section)}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteMockExam(section.id)}
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
