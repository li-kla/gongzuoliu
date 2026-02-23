import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { verifyToken, DecodedToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 验证管理员权限
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = verifyToken(token) as DecodedToken | null;
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return res.status(403).json({ message: '无权限' });
    }

    await dbConnect();

    // 获取所有用户
    const users = await User.find({}).sort({ createdAt: -1 });

    // 转换为前端需要的格式
    const formattedUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      isVip: user.isVip,
      isSvip: user.isSvip,
      vipExpiresAt: user.vipExpiresAt,
      svipExpiresAt: user.svipExpiresAt,
      createdAt: user.createdAt
    }));

    return res.status(200).json({
      users: formattedUsers,
      total: formattedUsers.length
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return res.status(500).json({ message: '获取用户列表失败' });
  }
}