'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  benchmarkAccounts?: Array<{
    name: string; // 对标账号名称
    url: string; // 对标账号链接
  }>; // 对标账号数组
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
  svipExpiresAt: string | null;
  downloadCount: number;
  maxDownloads: number;
  avatar?: string;
}

export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [showPriceModal, setShowPriceModal] = useState(false);

  useEffect(() => {
    // 获取用户信息
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        console.log('工作流详情页用户信息:', parsedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('解析用户信息失败:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      console.log('工作流详情页localStorage中没有用户信息');
    }

    // 获取工作流详情
    const fetchWorkflow = async () => {
      try {
        const response = await fetch(`/api/articles/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setWorkflow(data.article);
        } else {
          throw new Error(data.message || '获取工作流详情失败');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflow();
  }, [id]);

  const handlePayment = async (amount: number) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setPaymentLoading(true);

    try {
      // 根据金额确定套餐ID
      let planId: string;
      if (amount === 99) {
        planId = 'vip-monthly';
      } else if (amount === 199) {
        planId = 'svip-monthly';
      } else if (amount === 2999) {
        planId = 'site-construction';
      } else {
        planId = 'vip-monthly'; // 默认
      }

      const response = await fetch('/api/pay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          paymentMethod: 'wechat',
          amount,
          planId,
          duration: 30,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '创建订单失败');
      }

      // 模拟支付成功
      setTimeout(async () => {
        // 模拟支付回调
        const callbackResponse = await fetch('/api/pay/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: data.order.orderId,
            userId: user.id,
            paymentMethod: 'wechat',
            status: 'success',
            amount,
            planId,
            duration: 30,
          }),
        });

        // 刷新用户信息
        const userResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const userData = await userResponse.json();
        if (userResponse.ok) {
          localStorage.setItem('user', JSON.stringify(userData.user));
          setUser(userData.user);
          if (amount === 2999) {
            alert('支付成功，我们将尽快联系您进行站点建设服务');
          } else {
            alert(`支付成功，已升级为${amount === 99 ? 'VIP' : 'SVIP'}会员`);
          }
        }
      }, 2000);

    } catch (err: any) {
      alert(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!user || (user.role !== 'vip' && user.role !== 'svip' && user.role !== 'admin')) {
      // 显示自定义会员购买选项模态框
      setShowPriceModal(true);
      return;
    }

    // 检查VIP用户下载次数
    if (user.role === 'vip' && user.downloadCount >= 10) {
      alert('VIP会员每月最多可下载10个工作流，您已达到本月下载限制。升级为SVIP会员可无限下载。');
      setShowPriceModal(true);
      return;
    }

    if (!workflow) return;

    setDownloading(true);

    try {
      // 构建文件下载URL
      const filename = workflow.fileUrl.split('/').pop();
      if (!filename) return;

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/download/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '下载失败');
      }

      // 创建下载链接
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 更新本地用户信息
      const updatedUserStr = localStorage.getItem('user');
      if (updatedUserStr) {
        const updatedUser = JSON.parse(updatedUserStr);
        if (updatedUser.role === 'vip' && updatedUser.downloadCount !== undefined) {
          updatedUser.downloadCount += 1;
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="alert alert-error">
            {error || '工作流不存在'}
          </div>
          <Link href="/workflows" className="btn btn-primary mt-4">
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-primary">工作流商店</span>
              </a>
            </div>
            <div className="flex items-center">
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
                      <img 
                          src={(user.avatar && user.avatar.trim()) ? user.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random&color=fff`} 
                          alt={user.username} 
                          className="w-6 h-6 rounded-full object-cover"
                        />
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
                        onClick={() => {
                          localStorage.removeItem('user');
                          localStorage.removeItem('token');
                          setUser(null);
                        }}
                      >
                        登出
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                // 未登录状态
                <>
                  <Link href="/login" className="btn btn-outline mr-2">
                    登录
                  </Link>
                  <Link href="/register" className="btn btn-primary">
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main>
        {/* 工作流头部信息 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm bg-yellow-400 text-purple-900 px-2 py-0.5 rounded">
                    对标账号
                  </span>
                  <span className="text-sm bg-blue-300 text-purple-900 px-2 py-0.5 rounded">
                    {workflow.workflowName}
                  </span>
                </div>
                <h1 className={`${workflow.titleFontSize || 'text-2xl'} md:${workflow.titleFontSize || 'text-3xl'} font-bold mb-4`}>
                  {workflow.title}
                </h1>
                <div className="text-sm mb-6">
                  <p>创建团队：{workflow.author.username}</p>
                  <p>1个工作流：一键生成{workflow.title}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <span>▶</span>
                    立即体验
                  </button>
                  <button className="bg-white hover:bg-gray-100 text-purple-600 px-4 py-2 rounded-lg border border-purple-300">
                    设备合适？试试定制
                  </button>
                  <button className="bg-white hover:bg-gray-100 text-purple-600 px-4 py-2 rounded-lg border border-purple-300">
                    想自己搭建？试试学习
                  </button>
                </div>
              </div>
              <div className="md:w-1/3">
                <div className="bg-gray-900 rounded-lg overflow-hidden cursor-pointer group relative" onClick={() => setIsVideoFullscreen(true)}>
                  {/* 处理不同类型的视频 */}
                  {workflow.videoUrl.includes('youtube.com') || workflow.videoUrl.includes('youtu.be') ? (
                    // YouTube视频嵌入
                    <iframe
                      src={workflow.videoUrl}
                      className="w-full h-64"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Workflow video"
                    ></iframe>
                  ) : (
                    // 普通视频文件（包括上传的视频）
                    <video
                      src={workflow.videoUrl}
                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                      playsInline
                      muted
                      ref={(el) => {
                        if (el) {
                          // 加载视频后跳转到1秒处作为封面
                          el.addEventListener('loadeddata', () => {
                            el.currentTime = 1; // 跳转到1秒处
                            el.pause();
                          });
                          // 鼠标悬停时播放
                          el.addEventListener('mouseenter', () => {
                            el.play();
                          });
                          // 鼠标离开时暂停并重置到封面帧
                          el.addEventListener('mouseleave', () => {
                            el.pause();
                            el.currentTime = 1;
                          });
                        }
                      }}
                    ></video>
                  )}
                </div>
                
                {/* 对标账号按钮 */}
                <div className="mt-4 space-y-2">
                  {workflow.benchmarkAccounts && workflow.benchmarkAccounts.length > 0 ? (
                    workflow.benchmarkAccounts.map((account, index) => (
                      <a
                        key={index}
                        href={account.url || "https://www.douyin.com/"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                      >
                        <span>🔍</span>
                        {account.name || `查看对标账号 ${index + 1}`}
                      </a>
                    ))
                  ) : (
                    <a
                      href="https://www.douyin.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                    >
                      <span>🔍</span>
                      查看对标账号
                    </a>
                  )}
                </div>
                
                {/* 视频全屏播放模态框 */}
                {isVideoFullscreen && workflow && (
                  <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
                    <div className="relative max-w-4xl w-full">
                      {/* 关闭按钮 */}
                      <button 
                        className="absolute -top-16 right-0 text-white text-3xl hover:text-gray-300 transition-colors"
                        onClick={() => {
                          setIsVideoFullscreen(false);
                          setShowPlayButton(true); // 重置播放按钮状态
                        }}
                      >
                        ×
                      </button>
                      
                      {/* 放大3倍的视频 */}
                      <div className="relative border-4 border-white rounded-lg overflow-hidden shadow-2xl">
                        {/* 播放按钮 */}
                        {showPlayButton && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <button 
                              className="w-20 h-20 bg-white bg-opacity-80 rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-100 transition-all transform hover:scale-110"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowPlayButton(false);
                                // 播放视频
                                const videoElement = document.querySelector('.fullscreen-video') as HTMLVideoElement;
                                if (videoElement) {
                                  videoElement.play();
                                }
                              }}
                            >
                              <span className="text-black text-3xl">▶</span>
                            </button>
                          </div>
                        )}
                        
                        {workflow.videoUrl.includes('youtube.com') || workflow.videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={workflow.videoUrl}
                            className="w-full h-[80vh]"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Workflow video"
                          ></iframe>
                        ) : (
                          <video
                            src={workflow.videoUrl}
                            className="w-full h-[80vh] object-contain fullscreen-video"
                            controls
                            playsInline
                            ref={(el) => {
                              if (el) {
                                // 点击播放时隐藏播放按钮
                                el.addEventListener('play', () => {
                                  setShowPlayButton(false);
                                });
                                // 暂停时显示播放按钮
                                el.addEventListener('pause', () => {
                                  setShowPlayButton(true);
                                });
                                // 结束时显示播放按钮
                                el.addEventListener('ended', () => {
                                  setShowPlayButton(true);
                                });
                              }
                            }}
                          ></video>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 会员提示条 */}
        <div className="bg-yellow-500 text-white py-3 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💎</span>
              <span className="font-medium">SVIP用户免费解锁</span>
              <span className="text-sm opacity-80">VIP用户可享受折扣价购买智能体</span>
            </div>
            <button className="bg-white text-yellow-600 px-4 py-1 rounded-lg text-sm font-medium hover:bg-gray-100">
              立即前往
            </button>
          </div>
        </div>

        {/* 工作流列表 */}
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>📋</span>
                工作流列表
              </h2>
              <button className="bg-purple-100 text-purple-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-200">
                使用说明
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              下载压缩包并导入到 Coze 工作台
            </p>

            {/* VIP用户下载次数提示 */}
            {user && user.role === 'vip' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">VIP会员：</span>
                  本月剩余下载次数：{Math.max(0, 10 - user.downloadCount)}次
                </p>
              </div>
            )}

            {/* SVIP用户无限制提示 */}
            {user && user.role === 'svip' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-purple-700">
                  <span className="font-medium">SVIP会员：</span>
                  无限下载所有工作流
                </p>
              </div>
            )}

            {/* 工作流项 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center font-bold">
                    01
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{workflow.title}</h3>
                    <p className="text-sm text-gray-500">
                      一键生成{workflow.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-blue-600 font-bold">¥159.92</span>
                  <button
                    onClick={handleDownload}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    disabled={downloading}
                  >
                    {downloading ? '下载中...' : (user && (user.role === 'vip' || user.role === 'svip' || user.role === 'admin')) ? '免费下载' : '立即解锁'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* 价格选择模态框 */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl transform transition-all">
            {/* 模态框头部 */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">会员购买</h2>
                <button 
                  onClick={() => setShowPriceModal(false)}
                  className="text-white hover:text-gray-200 text-xl"
                >
                  ×
                </button>
              </div>
              <p className="mt-2 text-purple-100">解锁所有工作流下载权限</p>
            </div>
            
            {/* 模态框内容 */}
            <div className="p-6">
              <div className="space-y-4">
                {/* VIP会员选项 */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">VIP会员</h3>
                      <p className="text-sm text-gray-600 mt-1">可下载10个工作流/月</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-purple-600">¥99</span>
                      <span className="text-sm text-gray-500">/月</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPriceModal(false);
                      handlePayment(99);
                    }}
                    className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium transition-colors group-hover:scale-[1.02]"
                  >
                    选择VIP会员
                  </button>
                </div>
                
                {/* SVIP会员选项 */}
                <div className="border-2 border-yellow-400 rounded-lg p-4 bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer group relative">
                  <div className="absolute top-0 right-0 bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    推荐
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">SVIP会员</h3>
                      <p className="text-sm text-gray-600 mt-1">无限下载所有工作流</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-purple-600">¥199</span>
                      <span className="text-sm text-gray-500">/月</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPriceModal(false);
                      handlePayment(199);
                    }}
                    className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium transition-colors group-hover:scale-[1.02]"
                  >
                    选择SVIP会员
                  </button>
                </div>
                
                {/* 建设同样站点选项 */}
                <div className="border-2 border-blue-400 rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer group relative">
                  <div className="absolute top-0 right-0 bg-blue-400 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    企业服务
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">建设同样站点</h3>
                      <p className="text-sm text-gray-600 mt-1">定制化AI工作流平台建设</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">¥2999</span>
                      <span className="text-sm text-gray-500">/次</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPriceModal(false);
                      handlePayment(2999);
                    }}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors group-hover:scale-[1.02]"
                  >
                    选择建设站点服务
                  </button>
                </div>
                
                {/* 取消按钮 */}
                <button
                  onClick={() => setShowPriceModal(false)}
                  className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}