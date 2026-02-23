import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { verifyToken } from '../../../lib/auth';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return res.status(403).json({ message: '只有超级管理员才能删除管理员' });
    }

    await dbConnect();

    const { adminId } = req.query;

    if (!adminId) {
      return res.status(400).json({ message: '请提供管理员ID' });
    }

    const adminToDelete = await User.findById(adminId);

    if (!adminToDelete) {
      return res.status(404).json({ message: '管理员不存在' });
    }

    if (adminToDelete.role !== 'admin') {
      return res.status(400).json({ message: '只能删除普通管理员' });
    }

    if (adminToDelete.isSuperAdmin) {
      return res.status(403).json({ message: '不能删除超级管理员' });
    }

    await User.findByIdAndDelete(adminId);

    return res.status(200).json({
      message: '管理员删除成功',
      adminId,
    });
  } catch (error) {
    console.error('删除管理员失败:', error);
    return res.status(500).json({ message: '删除管理员失败' });
  }
};

export default handler;