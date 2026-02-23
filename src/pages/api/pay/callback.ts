import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // 支付回调通常使用POST方法
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // 解析回调数据（实际项目中需要根据支付平台的回调格式进行解析）
    const { orderId, userId, paymentMethod, status, amount } = req.body;

    // 验证回调数据
    if (!orderId || !userId || !status) {
      return res.status(400).json({ message: '回调数据不完整' });
    }

    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 如果支付成功，根据套餐设置不同的会员等级
    if (status === 'success') {
      // 从订单中获取套餐信息
      const { planId, duration } = req.body;

      // 设置过期时间
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (duration || 30));

      // 根据套餐ID设置会员等级
      if (planId === 'vip-monthly' || planId === 'vip-yearly') {
        // VIP会员
        user.isVip = true;
        user.isSvip = false;
        // 只有当用户不是管理员或超级管理员时，才修改角色
        if (user.role !== 'admin' && user.role !== 'superadmin') {
          user.role = 'vip';
        }
        user.vipExpiresAt = expiresAt;
        user.svipExpiresAt = null;
        user.downloadCount = 0; // 重置下载次数
        user.maxDownloads = 10; // VIP会员每月可下载10个工作流
      } else if (planId === 'svip-monthly' || planId === 'svip-yearly') {
        // SVIP会员
        user.isVip = false;
        user.isSvip = true;
        // 只有当用户不是管理员或超级管理员时，才修改角色
        if (user.role !== 'admin' && user.role !== 'superadmin') {
          user.role = 'svip';
        }
        user.vipExpiresAt = null;
        user.svipExpiresAt = expiresAt;
        user.downloadCount = 0; // 重置下载次数
        user.maxDownloads = 0; // 0表示无限制
      }

      await user.save();

      console.log(`用户 ${user.username} 支付成功，已升级为${user.role}会员，过期时间：${expiresAt}`);

      // 返回成功响应给支付平台
      return res.status(200).json({ message: '回调处理成功', success: true });
    } else {
      // 支付失败，记录日志
      console.log(`用户 ${user.username} 支付失败，订单号：${orderId}`);

      // 返回失败响应给支付平台
      return res.status(200).json({ message: '回调处理成功', success: false });
    }
  } catch (error) {
    console.error('支付回调处理失败:', error);
    return res.status(500).json({ message: '回调处理失败' });
  }
};

export default handler;