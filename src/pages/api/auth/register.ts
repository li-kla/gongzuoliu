import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { logActivity } from '../../../lib/activityLogger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { username, email, password } = req.body;

    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({ message: '请填写所有必填字段' });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // 创建新用户
    // 生成随机彩色像素头像
    const randomSeed = Math.random().toString(36).substring(2, 10);
    const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${randomSeed}&backgroundColor=random&colors=random`;

    const user = new User({
      username,
      email,
      password,
      role: 'user',
      isVip: false,
      vipExpiresAt: null,
      avatar: avatarUrl,
    });

    await user.save();

    // 记录注册活动
    await logActivity({
      userId: user._id,
      username: user.username,
      type: 'register',
      action: '注册了新账号'
    });

    return res.status(201).json({ message: '注册成功', user: { id: user._id, username: user.username, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (error) {
    console.error('注册失败:', error);
    return res.status(500).json({ message: '注册失败，请稍后重试' });
  }
}