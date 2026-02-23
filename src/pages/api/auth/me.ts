import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware, AuthRequest } from '../../../lib/middleware';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

const handler = async (req: AuthRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // 从认证中间件获取用户信息
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '未认证' });
    }

    // 获取用户详细信息
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查VIP状态是否过期
    if (user.isVip && user.vipExpiresAt && user.vipExpiresAt < new Date()) {
      user.isVip = false;
      user.vipExpiresAt = null;
      // 只有当用户不是管理员或超级管理员时，才修改角色
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        user.role = 'user';
      }
      await user.save();
    }

    // 检查SVIP状态是否过期
    if (user.isSvip && user.svipExpiresAt && user.svipExpiresAt < new Date()) {
      user.isSvip = false;
      user.svipExpiresAt = null;
      // 只有当用户不是管理员或超级管理员时，才修改角色
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        user.role = 'user';
      }
      await user.save();
    }

    return res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        isVip: user.isVip,
        isSvip: user.isSvip,
        vipExpiresAt: user.vipExpiresAt,
        svipExpiresAt: user.svipExpiresAt,
        downloadCount: user.downloadCount || 0,
        maxDownloads: user.maxDownloads || 10,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return res.status(500).json({ message: '获取用户信息失败' });
  }
};

// 使用认证中间件
export default async function protectedHandler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  return authMiddleware(req as AuthRequest, res, () => handler(req as AuthRequest, res));
}