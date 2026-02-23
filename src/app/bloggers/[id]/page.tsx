'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Article {
  _id: string;
  title: string;
  bloggerName: string;
  content: string;
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
  svipExpiresAt: string | null;
}

export default function BloggerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    // 获取用户信息
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    // 获取文章详情
    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/articles/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setArticle(data.article);
        } else {
          throw new Error(data.message || '获取文章详情失败');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const handlePayment = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setPaymentLoading(true);

    try {
      const response = await fetch('/api/pay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          paymentMethod: 'wechat',
          amount: 99.99,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '创建订单失败');
      }

      // 模拟支付成功
      // 实际项目中，这里应该跳转到支付链接或显示支付二维码
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
            amount: 99.99,
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
          alert('支付成功，已升级为VIP用户');
        }
      }, 2000);

    } catch (err: any) {
      alert(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!user || !user.isVip) {
      handlePayment();
      return;
    }

    if (!article) return;

    // 构建文件下载URL
    const filename = article.fileUrl.split('/').pop();
    if (!filename) return;

    try {
      const response = await fetch(`/api/download/${filename}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '下载失败');
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
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto py-12">
        <div className="alert alert-error">
          {error || '文章不存在'}
        </div>
        <Link href="/bloggers" className="btn btn-primary mt-4">
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <Link href="/bloggers" className="btn btn-outline mb-8">
        返回列表
      </Link>

      <div className="card">
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        <p className="text-xl text-gray-600 mb-6">博主：{article.bloggerName}</p>
        <p className="text-gray-500 text-sm mb-8">
          作者：{article.author.username} | {new Date(article.createdAt).toLocaleDateString()}
        </p>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">博主介绍</h2>
          <div className="prose max-w-none">
            {article.content}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">代表性视频</h2>
          <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src={article.videoUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="代表性视频"
            ></iframe>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">资源下载</h2>
          {user && user.isVip ? (
            <button
              onClick={handleDownload}
              className="btn btn-primary"
            >
              下载资源包
            </button>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                只有VIP用户可以下载资源包，点击下方按钮升级为VIP
              </p>
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="btn btn-primary"
              >
                {paymentLoading ? '处理中...' : '升级为VIP并下载'}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                VIP特权：30天内可下载所有资源包
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}