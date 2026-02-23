'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'vip-monthly',
    name: 'VIP会员',
    price: 29,
    duration: 30,
    features: [
      '每月可下载50个工作流',
      '获得热门工作流访问权限',
      '基础客服支持',
      '无广告体验',
    ],
  },
  {
    id: 'vip-yearly',
    name: 'VIP会员（年付）',
    price: 299,
    duration: 365,
    popular: true,
    features: [
      '每月可下载50个工作流',
      '获得热门工作流访问权限',
      '基础客服支持',
      '无广告体验',
      '节省14%费用',
    ],
  },
  {
    id: 'svip-monthly',
    name: 'SVIP会员',
    price: 99,
    duration: 30,
    features: [
      '无限制下载所有工作流',
      '优先获得新工作流访问权限',
      '专属客服支持',
      '参与平台内测功能',
      '定制化服务支持',
    ],
  },
  {
    id: 'svip-yearly',
    name: 'SVIP会员（年付）',
    price: 999,
    duration: 365,
    features: [
      '无限制下载所有工作流',
      '优先获得新工作流访问权限',
      '专属客服支持',
      '参与平台内测功能',
      '定制化服务支持',
      '节省16%费用',
    ],
  },
];

export default function PurchasePage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handlePurchase = async () => {
    if (!selectedPlan) {
      setError('请选择一个套餐');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) {
        setError('套餐不存在');
        return;
      }

      const response = await fetch('/api/pay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod,
          amount: plan.price,
          planId: plan.id,
          duration: plan.duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '创建订单失败');
      }

      // 模拟支付成功，实际项目中需要跳转到支付页面
      alert(`订单创建成功！\n订单号: ${data.order.orderId}\n支付金额: ¥${plan.price}\n\n（实际项目中会跳转到支付页面）`);
      
      // 跳转到个人中心查看会员状态
      router.push('/profile');
    } catch (err: any) {
      setError(err.message || '购买失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

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
              <Link href="/profile" className="text-sm text-gray-700 hover:text-blue-600 transition-colors duration-200">
                返回个人中心
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">升级会员</h1>
          <p className="text-lg text-gray-600">选择适合您的会员套餐，解锁更多功能</p>
        </div>

        {/* 套餐选择 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedPlan === plan.id
                  ? 'border-blue-600 shadow-lg shadow-blue-500/20'
                  : plan.popular
                  ? 'border-yellow-400 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                    热门推荐
                  </span>
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-blue-600">¥{plan.price}</span>
                <span className="text-gray-600 ml-1">/{plan.duration >= 365 ? '年' : '月'}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div
                className={`w-full py-2 rounded-lg text-center font-medium transition-colors ${
                  selectedPlan === plan.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedPlan === plan.id ? '已选择' : '选择套餐'}
              </div>
            </div>
          ))}
        </div>

        {/* 支付方式选择 */}
        <div className="max-w-2xl mx-auto mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">选择支付方式</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              className={`flex items-center justify-center gap-3 p-6 border-2 rounded-xl transition-all ${
                paymentMethod === 'wechat'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('wechat')}
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">💬</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">微信支付</p>
                <p className="text-sm text-gray-600">推荐使用</p>
              </div>
            </button>
            <button
              className={`flex items-center justify-center gap-3 p-6 border-2 rounded-xl transition-all ${
                paymentMethod === 'alipay'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('alipay')}
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">支付宝</p>
                <p className="text-sm text-gray-600">安全快捷</p>
              </div>
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        )}

        {/* 购买按钮 */}
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handlePurchase}
            disabled={!selectedPlan || loading}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              !selectedPlan || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/20'
            }`}
          >
            {loading ? '处理中...' : selectedPlan ? '立即购买' : '请选择套餐'}
          </button>
          <p className="text-center text-sm text-gray-600 mt-4">
            点击购买即表示您同意我们的
            <Link href="/terms" className="text-blue-600 hover:text-blue-700 mx-1">
              服务条款
            </Link>
            和
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700 mx-1">
              隐私政策
            </Link>
          </p>
        </div>

        {/* 常见问题 */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">常见问题</h2>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">会员可以退款吗？</h3>
              <p className="text-gray-700">
                购买后7天内，如对服务不满意，可申请全额退款。超过7天，将根据实际使用情况按比例退款。
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">会员到期后会自动续费吗？</h3>
              <p className="text-gray-700">
                不会自动续费。会员到期后，您可以随时续费，享受连续会员优惠。
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">可以升级会员等级吗？</h3>
              <p className="text-gray-700">
                可以。您可以随时升级会员等级，升级费用为两个套餐的差价。
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">会员权益可以转让吗？</h3>
              <p className="text-gray-700">
                不可以。会员权益仅限本人使用，不可转让给他人。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}