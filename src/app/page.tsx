'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Workflow {
  _id: string;
  title: string;
  workflowName: string;
  content: string;
  titleFontSize?: string; // 标题字体大小
  contentFontSize?: string; // 内容字体大小
  videoUrl: string;
  fileUrl: string;
  author: {
    username: string;
  };
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user' | 'vip' | 'svip';
  isSuperAdmin: boolean;
  isVip: boolean;
  isSvip: boolean;
  vipExpiresAt: string | null;
  avatar: string;
}

export default function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const pageRef = useRef(1);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 检查用户登录状态
  useEffect(() => {
    const checkUserStatus = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          console.log('用户信息:', userData);
          setUser(userData);
        } catch (error) {
          console.error('解析用户信息失败:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } else {
        console.log('localStorage中没有用户信息');
      }
    };

    checkUserStatus();
  }, []);

  useEffect(() => {
    // 获取工作流列表
    const fetchWorkflows = async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (!append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        
        let url = `/api/articles?page=${pageNum}&limit=8`;
        if (searchKeyword.trim()) {
          url += `&search=${encodeURIComponent(searchKeyword.trim())}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
          const newWorkflows = data.articles || [];
          
          if (append) {
            setWorkflows(prev => [...prev, ...newWorkflows]);
          } else {
            setWorkflows(newWorkflows);
          }
          
          // 检查是否还有更多数据
          setHasMore(newWorkflows.length === 8);
        }
      } catch (error) {
        console.error('获取工作流列表失败:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchWorkflows();

    // 添加滚动事件监听器
    const handleScroll = () => {
      if (isLoadingMore || !hasMore) return;
      
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // 当滚动到距离底部100px时加载更多
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        // 清除之前的定时器
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // 设置新的定时器，防止频繁触发
        scrollTimeoutRef.current = setTimeout(() => {
          setIsLoadingMore(true);
          const nextPage = pageRef.current + 1;
          pageRef.current = nextPage;
          setPage(nextPage);
          fetchWorkflows(nextPage, true).finally(() => {
            setIsLoadingMore(false);
          });
        }, 300);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [hasMore, isLoadingMore, searchKeyword]);

  // 模拟分类数据
  const categories = [
    '火狸', 'SVIP免费', '推荐', '育儿', '历史', '英语', '认知', '养生', '心理学', '情感', '创业',
    '玄学', '职场', '电商', '法律', '商业', 'TK', '其他'
  ];

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);
    setPage(1);
    pageRef.current = 1;
  };

  // 处理搜索提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    pageRef.current = 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900">
      {/* 顶部导航栏 */}
      <nav className="bg-white border-b border-gray-200 shadow-md z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-transparent bg-clip-text">工作流商店</span>
              </a>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    placeholder="搜索智能体..."
                    value={searchKeyword}
                    onChange={handleSearch}
                    className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow"
                    style={{ width: '300px' }}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-200 hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </form>
              </div>
              {user ? (
                // 登录状态
                <div className="flex items-center gap-4">
                  {(user.role === 'admin' || user.role === 'superadmin') && (
                    <Link href="/admin" className="text-sm text-gray-700 hover:text-blue-600 transition-colors duration-200">
                      管理后台
                    </Link>
                  )}
                  <div className="relative group">
                    <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {user.username}
                      {user.role === 'vip' && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                          VIP
                        </span>
                      )}
                      {user.role === 'svip' && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                          SVIP
                        </span>
                      )}
                      {user.role === 'superadmin' && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full border border-red-200">
                          超级管理员
                        </span>
                      )}
                      <span>▼</span>
                    </button>
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <Link 
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                      >
                        个人资料
                      </Link>
                      <a 
                        href="#" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                      >
                        账户设置
                      </a>
                      <div className="border-t border-gray-100"></div>
                      <a 
                        href="#" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                        onClick={handleLogout}
                      >
                        登出
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                // 未登录状态
                <>
                  <Link href="/login" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-300 transition-all duration-200">
                    登录
                  </Link>
                  <Link href="/register" className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200">
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧导航栏 */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl shadow-md p-5 transition-all duration-300 hover:shadow-lg">
              <h3 className="font-bold text-lg mb-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-transparent bg-clip-text">导航</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/" className="flex items-center p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 font-medium transition-all duration-300 hover:bg-blue-100 hover:shadow hover:shadow-blue-100/50 transform hover:-translate-y-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    工作流商店
                  </a>
                </li>
                <li>
                  <a href="/workflows" className="flex items-center p-3 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-300 transform hover:-translate-y-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    智能体集合
                  </a>
                </li>
                <li>
                  <a href="/batch-download" className="flex items-center p-3 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-300 transform hover:-translate-y-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    批量下载
                  </a>
                </li>
                <li>
                  <a href="/purchase-history" className="flex items-center p-3 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-300 transform hover:-translate-y-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    我的购买记录
                  </a>
                </li>
              </ul>
              
              {/* 科技感装饰元素 */}
              <div className="mt-8 relative">
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-200 to-cyan-100 rounded-full opacity-50 blur-sm animate-pulse"></div>
                <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-gradient-to-tr from-purple-200 to-pink-100 rounded-full opacity-50 blur-sm animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="relative p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100 transition-all duration-300 hover:shadow-md hover:border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">AI 助手</h4>
                  <p className="text-xs text-gray-600">有任何问题？随时咨询我们的智能助手</p>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1">
            {/* 分类标签 */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-md p-5 mb-8 relative overflow-hidden">
              {/* 装饰元素 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-cyan-50 rounded-full opacity-70 blur-md"></div>
              <div className="relative">
                <h3 className="font-bold text-lg mb-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-transparent bg-clip-text">分类</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category, index) => (
                    <a 
                      key={index} 
                      href={`/?category=${category}`} 
                      className="px-3 py-1.5 text-sm rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
                    >
                      {category}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* 工作流列表 */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-md p-5">
              {/* 装饰元素 */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-50 rounded-full opacity-70 blur-md"></div>
              <div className="relative">
                <h3 className="font-bold text-lg mb-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-transparent bg-clip-text">推荐工作流</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {loading ? (
                    // 加载状态
                    Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
                        <div className="h-48 bg-gray-100"></div>
                        <div className="p-4">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </div>
                    ))
                  ) : workflows.length > 0 ? (
                    // 工作流卡片
                  workflows.map((workflow) => {
                    return (
                      <Link 
                        key={workflow._id} 
                        href={`/workflows/${workflow._id}`}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer block relative group transform hover:-translate-y-1"
                      >
                        {/* 工作流封面 - 视频预览 */}
                        <div className="h-48 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                          {/* SVIP免费标签 */}
                          <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                            <div className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded shadow-md transform transition-all duration-300 group-hover:scale-105">
                              SVIP免费
                            </div>
                            <div className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-red-400 to-red-500 text-white rounded shadow-md line-through transform transition-all duration-300 group-hover:scale-105">
                              原价199
                            </div>
                          </div>
                          {workflow.videoUrl ? (
                            <video
                              src={workflow.videoUrl}
                              className="w-full h-full object-cover transition-opacity duration-300"
                              muted
                              loop
                              playsInline
                              onLoadedData={(e) => {
                                const video = e.currentTarget;
                                video.currentTime = 1;
                                video.pause();
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.play();
                              }}
                              onMouseLeave={(e) => {
                                const video = e.currentTarget;
                                video.pause();
                                video.currentTime = 1;
                              }}
                            />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-400 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {/* 科技感覆盖层 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"></div>
                          {/* 悬停效果 */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                          {/* 科技感装饰元素 */}
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-400/20 to-cyan-500/20 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-sm"></div>
                          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-400/20 to-pink-500/20 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-sm"></div>
                        </div>
                        
                        {/* 工作流信息 */}
                        <div className="p-4">
                          {/* 标签 */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className="px-2 py-0.5 text-xs bg-blue-100 border border-blue-200 text-blue-700 rounded transform transition-all duration-300 group-hover:scale-105">
                              对标账号
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-cyan-100 border border-cyan-200 text-cyan-700 rounded transform transition-all duration-300 group-hover:scale-105">
                              {workflow.workflowName}
                            </span>
                          </div>
                          
                          {/* 标题 */}
                          <h3 className={`font-bold text-gray-900 mb-2 line-clamp-2 transition-colors duration-200 group-hover:text-blue-600 ${workflow.titleFontSize || 'text-sm'}`}>
                            {workflow.title}
                          </h3>
                          
                          {/* 描述 */}
                          <p className={`${workflow.contentFontSize || 'text-xs'} text-gray-600 mb-4 line-clamp-2`}>
                            {workflow.content.substring(0, 60)}...
                          </p>
                          
                          {/* 作者信息 */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xs font-medium text-white transition-transform duration-300 group-hover:scale-110">
                                {workflow.author.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="ml-2 transition-colors duration-200 group-hover:text-blue-600">创建者：{workflow.author.username}</span>
                            </div>
                            <span className="transition-colors duration-200 group-hover:text-blue-600">1个工作流</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                  ) : (
                    // 无数据状态
                    <div className="col-span-full py-16 text-center bg-gray-50 rounded-lg border border-gray-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">暂无工作流</h3>
                      <p className="text-sm text-gray-500">敬请期待更多精彩内容</p>
                    </div>
                  )}
                </div>
                
                {/* 加载更多按钮 */}
                {!loading && workflows.length > 0 && (
                  <div className="mt-8 text-center">
                    {loadingMore ? (
                      <button className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 bg-white cursor-not-allowed">
                        加载中...
                      </button>
                    ) : hasMore ? (
                      <button className="px-6 py-2.5 rounded-lg border border-blue-300 text-blue-600 bg-white hover:bg-blue-50 hover:shadow hover:shadow-blue-100/50 transition-all duration-200">
                        加载更多
                      </button>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        没有更多数据了
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-center text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} 工作流商店. 保留所有权利.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors duration-200">关于我们</a>
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors duration-200">使用条款</a>
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors duration-200">隐私政策</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
