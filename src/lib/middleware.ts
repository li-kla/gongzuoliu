import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, DecodedToken } from './auth';
import User from '../models/User';
import dbConnect from './mongodb';

export interface AuthRequest extends NextApiRequest {
  user?: DecodedToken & { id: string };
}

export const authMiddleware = async (req: AuthRequest, res: NextApiResponse, next: () => void) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: '无效的认证令牌' });
  }

  // 验证用户是否存在
  await dbConnect();
  const user = await User.findById(decoded.id);
  
  if (!user) {
    return res.status(401).json({ message: '用户不存在' });
  }

  // 更新用户状态
  if (user.isVip && user.vipExpiresAt && user.vipExpiresAt < new Date()) {
    user.isVip = false;
    user.role = 'user';
    await user.save();
    // 更新解码后的用户信息
    decoded.isVip = false;
    decoded.role = 'user';
  }

  if (user.isSvip && user.svipExpiresAt && user.svipExpiresAt < new Date()) {
    user.isSvip = false;
    user.role = 'user';
    await user.save();
    // 更新解码后的用户信息
    decoded.isSvip = false;
    decoded.role = 'user';
  }

  req.user = decoded;
  next();
};

export const adminRequired = (req: AuthRequest, res: NextApiResponse, next: () => void) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
};

export const vipRequired = (req: AuthRequest, res: NextApiResponse, next: () => void) => {
  if (!req.user || !req.user.isVip) {
    return res.status(403).json({ message: '需要VIP权限' });
  }
  next();
};