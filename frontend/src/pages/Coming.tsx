import Header from '../components/Header';

function Coming() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-8xl mb-8">🚧</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            준비중입니다
          </h1>
          <p className="text-xl text-gray-500 mb-8">
            더 좋은 서비스로 곧 찾아뵙겠습니다!
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
        </div>
      </main>
    </div>
  );
}

export default Coming;

