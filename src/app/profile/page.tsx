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
  downloadCount: number;
  maxDownloads: number;
  createdAt: string;
  updatedAt: string;
  avatar: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setError('用户不存在');
          } else if (response.status === 401) {
            setError('未认证，请重新登录');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setTimeout(() => router.push('/login'), 2000);
          } else {
            throw new Error(data.message || '获取用户信息失败');
          }
          return;
        }

        setUser(data.user);
      } catch (err: any) {
        console.error('获取用户信息失败:', err);
        setError(err.message || '获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未设置';
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full border border-red-200">管理员</span>;
      case 'svip':
        return <span className="px-3 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200">SVIP</span>;
      case 'vip':
        return <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-full border border-blue-200">VIP</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-700 rounded-full border border-gray-200">普通用户</span>;
    }
  };

  const getMembershipStatus = () => {
    if (user?.role === 'svip') {
      const expiresAt = user.svipExpiresAt;
      const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
      return {
        status: isExpired ? '已过期' : '有效',
        expiresAt: expiresAt ? formatDate(expiresAt) : '永久',
        color: isExpired ? 'text-red-600' : 'text-green-600',
        bgColor: isExpired ? 'bg-red-50' : 'bg-green-50',
        borderColor: isExpired ? 'border-red-200' : 'border-green-200',
      };
    } else if (user?.role === 'vip') {
      const expiresAt = user.vipExpiresAt;
      const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
      return {
        status: isExpired ? '已过期' : '有效',
        expiresAt: expiresAt ? formatDate(expiresAt) : '永久',
        color: isExpired ? 'text-red-600' : 'text-green-600',
        bgColor: isExpired ? 'bg-red-50' : 'bg-green-50',
        borderColor: isExpired ? 'border-red-200' : 'border-green-200',
      };
    } else {
      return {
        status: '未开通',
        expiresAt: '-',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
      };
    }
  };

  const getMembershipPermissions = () => {
    if (user?.role === 'svip') {
      return [
        '无限制下载所有工作流',
        '优先获得新工作流访问权限',
        '专属客服支持',
        '参与平台内测功能',
        '定制化服务支持',
      ];
    } else if (user?.role === 'vip') {
      return [
        `每月可下载${user.maxDownloads}个工作流`,
        `本月已下载${user.downloadCount}个工作流`,
        '获得热门工作流访问权限',
        '基础客服支持',
      ];
    } else if (user?.role === 'admin') {
      return [
        '管理员权限',
        '管理所有工作流',
        '管理用户账户',
        '平台配置权限',
        '数据分析权限',
      ];
    } else {
      return [
        '浏览所有工作流',
        '查看工作流详情',
        '购买会员服务',
        '注册账户',
      ];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="bg-white border border-red-200 rounded-lg p-8 max-w-md shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-4 text-center">错误</h2>
          <p className="text-gray-700 mb-6 text-center">{error}</p>
          <div className="flex flex-col gap-3">
            <Link href="/" className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              返回首页
            </Link>
            <Link href="/login" className="w-full text-center border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors">
              重新登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const membershipStatus = getMembershipStatus();
  const membershipPermissions = getMembershipPermissions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* 顶部导航栏 */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-transparent bg-clip-text">工作流商店</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-gray-700 hover:text-blue-600 transition-colors duration-200">
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{user?.username}</h1>
                <p className="text-blue-100">{user?.email}</p>
                <div className="mt-2">{getRoleBadge(user?.role || 'user')}</div>
              </div>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-8">
            {/* 基本信息 */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📋</span>
                基本信息
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">用户名</p>
                  <p className="font-semibold text-gray-900">{user?.username}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">邮箱</p>
                  <p className="font-semibold text-gray-900">{user?.email}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">注册时间</p>
                  <p className="font-semibold text-gray-900">{formatDate(user?.createdAt || null)}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">最后更新</p>
                  <p className="font-semibold text-gray-900">{formatDate(user?.updatedAt || null)}</p>
                </div>
              </div>
            </div>

            {/* 会员信息 */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>💎</span>
                会员信息
              </h2>
              <div className={`border rounded-lg p-6 ${membershipStatus.bgColor} ${membershipStatus.borderColor}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">会员状态</p>
                    <p className={`text-2xl font-bold ${membershipStatus.color}`}>
                      {membershipStatus.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">会员类型</p>
                    <p className="text-xl font-bold text-gray-900">
                      {user?.role === 'svip' ? 'SVIP会员' : user?.role === 'vip' ? 'VIP会员' : '普通用户'}
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 mb-1">会员有效期</p>
                  <p className="font-semibold text-gray-900">{membershipStatus.expiresAt}</p>
                </div>
              </div>
            </div>

            {/* 会员权限 */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🎯</span>
                会员权限
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <ul className="space-y-3">
                  {membershipPermissions.map((permission, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-gray-700">{permission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 下载统计（仅VIP用户） */}
            {user?.role === 'vip' && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  下载统计
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">本月下载次数</span>
                    <span className="font-bold text-blue-600">
                      {user.downloadCount} / {user.maxDownloads}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(user.downloadCount / user.maxDownloads) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {user.downloadCount >= user.maxDownloads ? '已达到本月下载限制' : `还可下载 ${user.maxDownloads - user.downloadCount} 个工作流`}
                  </p>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-4">
              {user?.role === 'user' && (
                <>
                  <Link
                    href="/"
                    className="flex-1 min-w-[200px] bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg text-center font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
                  >
                    浏览工作流
                  </Link>
                  <Link
                    href="/purchase"
                    className="flex-1 min-w-[200px] border border-blue-600 text-blue-600 px-6 py-3 rounded-lg text-center font-medium hover:bg-blue-50 transition-all duration-200"
                  >
                    升级会员
                  </Link>
                </>
              )}
              {user?.role === 'vip' && (
                <Link
                  href="/purchase"
                  className="flex-1 min-w-[200px] bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg text-center font-medium hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-200"
                >
                  升级为SVIP
                </Link>
              )}
              <Link
                href="/settings"
                className="flex-1 min-w-[200px] border border-gray-300 text-gray-700 px-6 py-3 rounded-lg text-center font-medium hover:bg-gray-50 transition-all duration-200"
              >
                账户设置
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}