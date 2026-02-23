import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { verifyToken } from '../../../lib/auth';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return res.status(403).json({ message: '只有超级管理员才能添加管理员' });
    }

    await dbConnect();

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: '请填写完整信息' });
    }

    const existingUser = await User.findOne({
      $or: [
        { username },
        { email }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    const newAdmin = new User({
      username,
      email,
      password,
      role: 'admin',
      isSuperAdmin: false,
      isVip: true,
      isSvip: true,
      vipExpiresAt: new Date('2030-12-31'),
      svipExpiresAt: new Date('2030-12-31'),
      downloadCount: 0,
      maxDownloads: 1000,
      avatar: '',
    });

    await newAdmin.save();

    return res.status(201).json({
      message: '管理员添加成功',
      user: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        isSuperAdmin: newAdmin.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error('添加管理员失败:', error);
    return res.status(500).json({ message: '添加管理员失败' });
  }
};

export default handler;