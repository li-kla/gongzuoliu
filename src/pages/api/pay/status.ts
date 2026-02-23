import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '../../../lib/middleware';

const handler = async (req: AuthRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ message: '请提供订单号' });
    }

    // 模拟查询订单状态（实际项目中需要从数据库或支付平台查询）
    // 这里为了简化，我们直接返回一个模拟的状态
    const orderStatus = {
      orderId: orderId as string,
      status: 'success', // 模拟支付成功
      userId: req.user?.id,
      amount: 99.99, // 模拟金额
      paymentMethod: 'wechat', // 模拟支付方式
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };

    return res.status(200).json({
      message: '查询成功',
      order: orderStatus,
    });
  } catch (error) {
    console.error('查询订单状态失败:', error);
    return res.status(500).json({ message: '查询订单状态失败' });
  }
};

// 使用认证中间件
export default async function protectedHandler(req: NextApiRequest, res: NextApiResponse) {
  return authMiddleware(req as AuthRequest, res, () => handler(req as AuthRequest, res));
}