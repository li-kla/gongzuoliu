'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CurrentUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'vip' | 'svip';
  isVip: boolean;
  isSvip: boolean;
  vipExpiresAt: string | null;
  svipExpiresAt: string | null;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 系统设置状态
  const [siteSettings, setSiteSettings] = useState({
    siteName: '视频工作流商城',
    siteDescription: '专业的视频工作流下载平台',
    siteLogo: '',
    siteFavicon: '',
    enableRegistration: true,
    enableEmailVerification: false
  });

  // 上传设置状态
  const [uploadSettings, setUploadSettings] = useState({
    maxFileSize: 50,
    allowedExtensions: '.zip,.rar,.7z',
    uploadPath: './uploads',
    enableFileCompression: false
  });

  // 邮件设置状态
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUsername: 'noreply@example.com',
    smtpPassword: '',
    smtpFrom: 'noreply@example.com',
    enableEmailNotifications: true
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
    setCurrentUser(parsedUser);

    // 检查是否为管理员
    if (parsedUser.role !== 'admin' && parsedUser.role !== 'superadmin') {
      router.push('/');
      return;
    }

    // 获取系统设置
    fetchSettings(token);

    setLoading(false);
  }, [router]);

  // 获取系统设置
  const fetchSettings = async (token: string) => {
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.settings) {
        setSiteSettings({
          siteName: data.settings.siteName,
          siteDescription: data.settings.siteDescription,
          siteLogo: data.settings.siteLogo,
          siteFavicon: data.settings.siteFavicon,
          enableRegistration: data.settings.enableRegistration,
          enableEmailVerification: data.settings.enableEmailVerification,
        });

        setUploadSettings({
          maxFileSize: data.settings.maxFileSize,
          allowedExtensions: data.settings.allowedExtensions,
          uploadPath: data.settings.uploadPath,
          enableFileCompression: data.settings.enableFileCompression,
        });

        setEmailSettings({
          smtpHost: data.settings.smtpHost,
          smtpPort: data.settings.smtpPort,
          smtpUsername: data.settings.smtpUsername,
          smtpPassword: '', // 不返回密码
          smtpFrom: data.settings.smtpFrom,
          enableEmailNotifications: data.settings.enableEmailNotifications,
        });
      }
    } catch (err) {
      console.error('获取设置失败:', err);
    }
  };

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  // 处理设置保存
  const handleSaveSettings = async (settingsType: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('未授权，请重新登录');
        return;
      }

      let settingsData: any = {};
      
      switch (settingsType) {
        case '站点':
          settingsData = siteSettings;
          break;
        case '上传':
          settingsData = uploadSettings;
          break;
        case '邮件':
          settingsData = emailSettings;
          break;
      }

      const response = await fetch('/api/settings/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          settingsType: settingsType === '站点' ? 'site' : settingsType === '上传' ? 'upload' : 'email',
          settings: settingsData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || '保存设置失败');
        return;
      }

      setSuccess(`${settingsType}设置保存成功`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('保存设置失败:', err);
      setError('保存设置失败，请稍后重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:relative`}>
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
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-900 bg-blue-50 border-l-4 border-blue-500 rounded-r-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                系统设置
              </Link>
            </li>
            <li>
              <Link 
                href="/" 
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                返回主页
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col md:ml-64">
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
                <h2 className="text-xl font-bold text-gray-900">系统设置</h2>
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
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{currentUser.username}</span>
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
            <span className="text-gray-700 font-medium">系统设置</span>
          </div>

          {/* 状态提示 */}
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

          {/* 操作栏 */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          </div>

          {/* 设置卡片 */}
          <div className="space-y-6">
            {/* 站点设置 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">站点设置</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-2">
                      站点名称
                    </label>
                    <input
                      type="text"
                      id="siteName"
                      value={siteSettings.siteName}
                      onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-2">
                      站点描述
                    </label>
                    <input
                      type="text"
                      id="siteDescription"
                      value={siteSettings.siteDescription}
                      onChange={(e) => setSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="siteLogo" className="block text-sm font-medium text-gray-700 mb-2">
                      站点Logo
                    </label>
                    <input
                      type="text"
                      id="siteLogo"
                      value={siteSettings.siteLogo}
                      onChange={(e) => setSiteSettings({ ...siteSettings, siteLogo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Logo图片URL"
                    />
                  </div>
                  <div>
                    <label htmlFor="siteFavicon" className="block text-sm font-medium text-gray-700 mb-2">
                      站点图标
                    </label>
                    <input
                      type="text"
                      id="siteFavicon"
                      value={siteSettings.siteFavicon}
                      onChange={(e) => setSiteSettings({ ...siteSettings, siteFavicon: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Favicon图片URL"
                    />
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableRegistration"
                      checked={siteSettings.enableRegistration}
                      onChange={(e) => setSiteSettings({ ...siteSettings, enableRegistration: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enableRegistration" className="ml-2 block text-sm text-gray-700">
                      启用用户注册
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableEmailVerification"
                      checked={siteSettings.enableEmailVerification}
                      onChange={(e) => setSiteSettings({ ...siteSettings, enableEmailVerification: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enableEmailVerification" className="ml-2 block text-sm text-gray-700">
                      启用邮箱验证
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleSaveSettings('站点')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    保存站点设置
                  </button>
                </div>
              </div>
            </div>

            {/* 上传设置 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">上传设置</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="maxFileSize" className="block text-sm font-medium text-gray-700 mb-2">
                      最大文件大小 (MB)
                    </label>
                    <input
                      type="number"
                      id="maxFileSize"
                      value={uploadSettings.maxFileSize}
                      onChange={(e) => setUploadSettings({ ...uploadSettings, maxFileSize: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label htmlFor="allowedExtensions" className="block text-sm font-medium text-gray-700 mb-2">
                      允许的文件扩展名
                    </label>
                    <input
                      type="text"
                      id="allowedExtensions"
                      value={uploadSettings.allowedExtensions}
                      onChange={(e) => setUploadSettings({ ...uploadSettings, allowedExtensions: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder=".zip,.rar,.7z"
                    />
                  </div>
                  <div>
                    <label htmlFor="uploadPath" className="block text-sm font-medium text-gray-700 mb-2">
                      上传路径
                    </label>
                    <input
                      type="text"
                      id="uploadPath"
                      value={uploadSettings.uploadPath}
                      onChange={(e) => setUploadSettings({ ...uploadSettings, uploadPath: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableFileCompression"
                      checked={uploadSettings.enableFileCompression}
                      onChange={(e) => setUploadSettings({ ...uploadSettings, enableFileCompression: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enableFileCompression" className="ml-2 block text-sm text-gray-700">
                      启用文件压缩
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleSaveSettings('上传')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    保存上传设置
                  </button>
                </div>
              </div>
            </div>

            {/* 邮件设置 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">邮件设置</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP 主机
                    </label>
                    <input
                      type="text"
                      id="smtpHost"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP 端口
                    </label>
                    <input
                      type="number"
                      id="smtpPort"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="smtpUsername" className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP 用户名
                    </label>
                    <input
                      type="text"
                      id="smtpUsername"
                      value={emailSettings.smtpUsername}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP 密码
                    </label>
                    <input
                      type="password"
                      id="smtpPassword"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="smtpFrom" className="block text-sm font-medium text-gray-700 mb-2">
                      发件人邮箱
                    </label>
                    <input
                      type="email"
                      id="smtpFrom"
                      value={emailSettings.smtpFrom}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpFrom: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableEmailNotifications"
                      checked={emailSettings.enableEmailNotifications}
                      onChange={(e) => setEmailSettings({ ...emailSettings, enableEmailNotifications: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enableEmailNotifications" className="ml-2 block text-sm text-gray-700">
                      启用邮件通知
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleSaveSettings('邮件')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    保存邮件设置
                  </button>
                </div>
              </div>
            </div>

            {/* 系统信息 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">系统信息</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">系统版本</h3>
                    <p className="text-lg font-semibold text-gray-900">1.0.0</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">前端框架</h3>
                    <p className="text-lg font-semibold text-gray-900">Next.js 14</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">后端技术</h3>
                    <p className="text-lg font-semibold text-gray-900">Node.js + TypeScript</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">数据库</h3>
                    <p className="text-lg font-semibold text-gray-900">MongoDB</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">部署环境</h3>
                    <p className="text-lg font-semibold text-gray-900">开发环境</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">最后更新</h3>
                    <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
