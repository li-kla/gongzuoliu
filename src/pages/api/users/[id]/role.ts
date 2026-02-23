import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { verifyToken, DecodedToken } from '../../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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

    const { id } = req.query;
    const { role } = req.body;

    // 验证角色
    if (!['superadmin', 'admin', 'user', 'vip', 'svip'].includes(role)) {
      return res.status(400).json({ message: '无效的角色' });
    }

    // 如果要设置为管理员，必须是超级管理员
    if (role === 'admin' && !decoded.isSuperAdmin) {
      return res.status(403).json({ message: '只有超级管理员才能设置管理员角色' });
    }

    // 不允许设置为超级管理员（超级管理员只能通过数据库直接设置）
    if (role === 'superadmin') {
      return res.status(403).json({ message: '不能通过API设置超级管理员角色' });
    }

    // 查找用户
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 计算新的过期时间（如果升级为VIP/SVIP）
    let vipExpiresAt = user.vipExpiresAt;
    let svipExpiresAt = user.svipExpiresAt;

    if (role === 'vip' && !user.isVip) {
      // 升级为VIP，设置30天过期时间
      vipExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (role === 'svip' && !user.isSvip) {
      // 升级为SVIP，设置30天过期时间
      svipExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (role === 'user') {
      // 降级为普通用户，清除过期时间
      vipExpiresAt = null;
      svipExpiresAt = null;
    }

    // 更新用户角色
    user.role = role;
    user.isVip = role === 'vip';
    user.isSvip = role === 'svip';
    user.vipExpiresAt = vipExpiresAt;
    user.svipExpiresAt = svipExpiresAt;

    await user.save();

    return res.status(200).json({
      message: '用户角色更新成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVip: user.isVip,
        isSvip: user.isSvip,
        vipExpiresAt: user.vipExpiresAt,
        svipExpiresAt: user.svipExpiresAt,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('更新用户角色失败:', error);
    return res.status(500).json({ message: '更新用户角色失败' });
  }
}