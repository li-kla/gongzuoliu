import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { authMiddleware, AuthRequest } from '../../../lib/middleware';

const handler = async (req: AuthRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { paymentMethod, amount, planId, duration } = req.body;
    const userId = req.user?.id;

    // 验证输入
    if (!paymentMethod || !amount) {
      return res.status(400).json({ message: '请填写所有必填字段' });
    }

    if (!['wechat', 'alipay'].includes(paymentMethod)) {
      return res.status(400).json({ message: '不支持的支付方式' });
    }

    if (amount < 0.01) {
      return res.status(400).json({ message: '金额必须大于0' });
    }

    // 生成订单号
    const orderId = 'ORDER_' + Date.now() + '_' + Math.round(Math.random() * 1E6);

    // 模拟支付链接（实际项目中需要调用支付SDK生成真实的支付链接）
    let payUrl = '';
    if (paymentMethod === 'wechat') {
      payUrl = `weixin://wxpay/bizpayurl?pr=abcdefg&orderId=${orderId}`;
    } else if (paymentMethod === 'alipay') {
      payUrl = `alipays://platformapi/startapp?appId=09999988&actionType=toAccount&goBack=YES&orderId=${orderId}`;
    }

    // 模拟订单数据
    const order = {
      orderId,
      userId,
      amount,
      paymentMethod,
      status: 'pending',
      createdAt: new Date(),
      payUrl,
    };

    // 保存订单到数据库（实际项目中需要创建订单模型）
    // 这里为了简化，我们直接返回订单信息

    return res.status(200).json({
      message: '订单创建成功',
      order,
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    return res.status(500).json({ message: '创建订单失败' });
  }
};

// 使用认证中间件
export default async function protectedHandler(req: NextApiRequest, res: NextApiResponse) {
  return authMiddleware(req as AuthRequest, res, () => handler(req as AuthRequest, res));
}