'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user' | 'vip' | 'svip';
  isSuperAdmin: boolean;
  isVip: boolean;
  isSvip: boolean;
  vipExpiresAt: string | null;
  svipExpiresAt: string | null;
}

export default function CreateWorkflowPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [content, setContent] = useState('');
  const [titleFontSize, setTitleFontSize] = useState('text-base');
  const [contentFontSize, setContentFontSize] = useState('text-sm');
  const [videoUrl, setVideoUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [benchmarkAccounts, setBenchmarkAccounts] = useState<Array<{ name: string; url: string }>>([]); // 对标账号数组
  const [videoSource, setVideoSource] = useState('url'); // 'url' 或 'upload'
  const [videoFileUrl, setVideoFileUrl] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [uploadSettings, setUploadSettings] = useState({
    maxFileSize: 50,
    allowedExtensions: '.zip,.rar,.7z,.mp4,.mov',
  });

  useEffect(() => {
    // 获取用户信息
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userStr);
    setUser(parsedUser);

    // 检查是否为管理员
    if (parsedUser.role !== 'admin' && parsedUser.role !== 'superadmin') {
      router.push('/');
      return;
    }

    // 获取上传设置
    fetchUploadSettings(token);
  }, [router]);

  // 获取上传设置
  const fetchUploadSettings = async (token: string) => {
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.settings) {
        setUploadSettings({
          maxFileSize: data.settings.maxFileSize,
          allowedExtensions: data.settings.allowedExtensions,
        });
      }
    } catch (err) {
      console.error('获取上传设置失败:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '文件上传失败');
      }

      setFileUrl(data.file.url);
      setSuccess('文件上传成功');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '视频上传失败');
      }

      setVideoFileUrl(data.file.url);
      setSuccess('视频上传成功');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVideoUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 根据视频来源选择视频URL
      const finalVideoUrl = videoSource === 'url' ? videoUrl : videoFileUrl;

      if (!finalVideoUrl) {
        throw new Error('请提供视频链接或上传视频');
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, workflowName, content, videoUrl: finalVideoUrl, fileUrl, benchmarkAccounts, titleFontSize, contentFontSize }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '创建工作流失败');
      }

      setSuccess('工作流创建成功');
      // 3秒后跳转到工作流列表
      setTimeout(() => {
        router.push('/admin/articles');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-56 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:relative`}>
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">管理后台</h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 侧边栏导航 */}
        <nav className="mt-4">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            主菜单
          </div>
          <ul className="space-y-1 px-2">
            <li>
              <Link 
                href="/admin" 
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                仪表盘
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/articles" 
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-900 bg-blue-50 border-l-4 border-blue-500 rounded-r-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                工作流管理
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/users" 
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                用户管理
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/settings" 
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                系统设置
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col md:ml-56">
        {/* 顶部导航栏 */}
        <div className="bg-white shadow-sm z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center space-x-4 ml-4 md:ml-0">
                <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm font-medium">网站首页</span>
                </Link>
                <h2 className="text-xl font-bold text-gray-900">创建工作流</h2>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* 搜索框 */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索..."
                  className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* 通知图标 */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* 用户菜单 */}
              <div className="relative" onMouseEnter={() => setShowUserMenu(true)} onMouseLeave={() => setShowUserMenu(false)}>
                <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.username}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ${showUserMenu ? 'block' : 'hidden'}`}>
                  <a 
                    href="#" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    个人资料
                  </a>
                  <a 
                    href="#" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    账户设置
                  </a>
                  <div className="border-t border-gray-100"></div>
                  <a 
                    href="#" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleLogout}
                  >
                    登出
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 p-4 md:p-6">
          {/* 面包屑导航 */}
          <div className="mb-6 flex items-center text-sm">
            <Link href="/admin" className="text-gray-500 hover:text-blue-500">
              仪表盘
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/admin/articles" className="text-gray-500 hover:text-blue-500">
              工作流管理
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-700 font-medium">创建工作流</span>
          </div>

          {/* 表单卡片 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* 卡片头部 */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">创建新工作流</h1>
                <Link 
                  href="/admin/articles" 
                  className="bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  返回列表
                </Link>
              </div>
            </div>

            {/* 卡片内容 */}
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-4 mb-6">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{success}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">基本信息</h2>
                  
                  {/* 工作流标题 */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      工作流标题
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="请输入工作流标题"
                      />
                      <select
                        value={titleFontSize}
                        onChange={(e) => setTitleFontSize(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
                      >
                        <option value="text-xs">极小</option>
                        <option value="text-sm">小</option>
                        <option value="text-base">中</option>
                        <option value="text-lg">大</option>
                        <option value="text-xl">极大</option>
                      </select>
                    </div>
                  </div>

                  {/* 工作流名称 */}
                  <div>
                    <label htmlFor="workflowName" className="block text-sm font-medium text-gray-700 mb-2">
                      工作流名称
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      id="workflowName"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="请输入工作流名称"
                    />
                  </div>
                </div>

                {/* 详细信息 */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">详细信息</h2>
                  
                  {/* 工作流介绍 */}
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                      工作流介绍
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="flex gap-4">
                      <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        rows={6}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="请详细描述工作流的功能、使用方法和注意事项"
                      ></textarea>
                      <select
                        value={contentFontSize}
                        onChange={(e) => setContentFontSize(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
                      >
                        <option value="text-xs">极小</option>
                        <option value="text-sm">小</option>
                        <option value="text-base">中</option>
                        <option value="text-lg">大</option>
                        <option value="text-xl">极大</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 媒体信息 */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">媒体信息</h2>
                  
                  {/* 视频选项 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      视频来源
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="videoSource"
                          value="url"
                          checked={videoSource === 'url'}
                          onChange={(e) => setVideoSource(e.target.value)}
                          className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">视频链接</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="videoSource"
                          value="upload"
                          checked={videoSource === 'upload'}
                          onChange={(e) => setVideoSource(e.target.value)}
                          className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">上传视频</span>
                      </label>
                    </div>
                  </div>

                  {/* 视频链接 */}
                  {videoSource === 'url' && (
                    <div>
                      <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        视频链接
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        id="videoUrl"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="例如：https://www.youtube.com/watch?v=123456789"
                      />
                    </div>
                  )}

                  {/* 上传视频 */}
                  {videoSource === 'upload' && (
                    <div>
                      <label htmlFor="videoFile" className="block text-sm font-medium text-gray-700 mb-2">
                        上传视频
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
                        <div className="flex flex-col items-center justify-center text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-gray-600 mb-2">拖放视频到此处，或点击上传</p>
                          <p className="text-xs text-gray-500 mb-4">支持 .mp4, .mov, .avi, .wmv 格式，最大 {uploadSettings.maxFileSize}MB</p>
                          <div className="relative">
                            <input
                              type="file"
                              id="videoFile"
                              onChange={handleVideoUpload}
                              disabled={videoUploading}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              accept=".mp4,.mov,.avi,.wmv"
                            />
                            <button
                              type="button"
                              disabled={videoUploading}
                              className="bg-blue-500 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                            >
                              {videoUploading ? '上传中...' : '选择视频'}
                            </button>
                          </div>
                          {videoUploading && (
                            <div className="mt-4 flex items-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                              <span className="text-sm text-gray-600">正在上传视频，请稍候...</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {videoFileUrl && (
                        <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-gray-700">视频已上传：{videoFileUrl.split('/').pop()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 对标账号 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      对标账号
                    </label>
                    <button
                      type="button"
                      onClick={() => setBenchmarkAccounts([...benchmarkAccounts, { name: '', url: '' }])}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      + 添加对标账号
                    </button>
                  </div>
                  
                  {benchmarkAccounts.map((account, index) => (
                    <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">对标账号 {index + 1}</span>
                        {benchmarkAccounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setBenchmarkAccounts(benchmarkAccounts.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            删除
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label htmlFor={`benchmarkName-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                            对标账号名称
                          </label>
                          <input
                            type="text"
                            id={`benchmarkName-${index}`}
                            value={account.name}
                            onChange={(e) => {
                              const newAccounts = [...benchmarkAccounts];
                              newAccounts[index].name = e.target.value;
                              setBenchmarkAccounts(newAccounts);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="例如：抖音热门账号"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`benchmarkUrl-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                            对标账号链接
                          </label>
                          <input
                            type="url"
                            id={`benchmarkUrl-${index}`}
                            value={account.url}
                            onChange={(e) => {
                              const newAccounts = [...benchmarkAccounts];
                              newAccounts[index].url = e.target.value;
                              setBenchmarkAccounts(newAccounts);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="例如：https://www.douyin.com/"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {benchmarkAccounts.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">暂无对标账号，点击上方按钮添加</p>
                    </div>
                  )}
                </div>

                {/* 上传工作流文件 */}
                <div>
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                      上传工作流文件
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
                      <div className="flex flex-col items-center justify-center text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-600 mb-2">拖放文件到此处，或点击上传</p>
                          <p className="text-xs text-gray-500 mb-4">支持 {uploadSettings.allowedExtensions} 格式，最大 {uploadSettings.maxFileSize}MB</p>
                        <div className="relative">
                          <input
                            type="file"
                            id="file"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept=".zip,.rar,.7z"
                          />
                          <button
                            type="button"
                            disabled={uploading}
                            className="bg-blue-500 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                          >
                            {uploading ? '上传中...' : '选择文件'}
                          </button>
                        </div>
                        {uploading && (
                          <div className="mt-4 flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                            <span className="text-sm text-gray-600">正在上传文件，请稍候...</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {fileUrl && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-gray-700">文件已上传：{fileUrl.split('/').pop()}</span>
                        </div>
                      </div>
                    )}
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/articles')}
                    className="px-6 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !fileUrl || (videoSource === 'upload' && !videoFileUrl)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        创建中...
                      </div>
                    ) : (
                      '创建工作流'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
