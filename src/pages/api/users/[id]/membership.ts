import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { verifyToken, DecodedToken } from '../../../../lib/auth';
import { logActivity } from '../../../../lib/activityLogger';

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
    const { memberType, memberDuration, customExpiresAt, useCustomDate } = req.body;

    // 验证会员类型
    if (!['none', 'vip', 'svip'].includes(memberType)) {
      return res.status(400).json({ message: '无效的会员类型' });
    }

    // 查找用户
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 权限检查：超级管理员可以修改所有用户，管理员只能修改低于自己等级的用户
    if (decoded.role === 'admin' && !decoded.isSuperAdmin) {
      // 管理员不能修改其他管理员或超级管理员
      if (user.role === 'admin' || user.role === 'superadmin') {
        return res.status(403).json({ message: '管理员只能修改低于自己等级的用户' });
      }
    }

    // 计算过期时间
    let expiresAt: Date | null = null;
    if (memberType !== 'none') {
      if (useCustomDate && customExpiresAt) {
        // 使用自定义过期时间
        expiresAt = new Date(customExpiresAt);
      } else {
        // 使用会员时长计算过期时间
        const duration = memberDuration || 30; // 默认30天
        if (duration === -1) {
          // 无限时长，设置一个很远的时间
          expiresAt = new Date('2100-12-31T23:59:59');
        } else {
          expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
        }
      }
    }

    // 更新用户会员状态
    user.isVip = memberType === 'vip';
    user.isSvip = memberType === 'svip';
    user.vipExpiresAt = memberType === 'vip' ? expiresAt : null;
    user.svipExpiresAt = memberType === 'svip' ? expiresAt : null;
    // 只有当用户不是管理员或超级管理员时，才修改角色
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      user.role = memberType === 'none' ? 'user' : memberType;
    }

    await user.save();

    // 记录会员升级活动
    if (memberType === 'vip' || memberType === 'svip') {
      await logActivity({
        userId: user._id,
        username: user.username,
        type: memberType === 'vip' ? 'vip_upgrade' : 'svip_upgrade',
        action: memberType === 'vip' ? '购买了VIP会员' : '购买了SVIP会员'
      });
    }

    return res.status(200).json({
      message: '会员状态更新成功',
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
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('更新会员状态失败:', error);
    return res.status(500).json({ message: '更新会员状态失败' });
  }
}