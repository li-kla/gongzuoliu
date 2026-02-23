import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { generateToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { identifier, password } = req.body;

    // 验证输入
    if (!identifier || !password) {
      return res.status(400).json({ message: '请填写用户名/邮箱和密码' });
    }

    // 查找用户（支持用户名或邮箱）
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });
    if (!user) {
      return res.status(401).json({ message: '用户名/邮箱或密码错误' });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名/邮箱或密码错误' });
    }

    // 生成token
    const token = generateToken(user);

    return res.status(200).json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        isVip: user.isVip,
        isSvip: user.isSvip,
        vipExpiresAt: user.vipExpiresAt,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('登录失败:', error);
    return res.status(500).json({ message: '登录失败，请稍后重试' });
  }
}