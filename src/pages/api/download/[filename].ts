import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { authMiddleware, AuthRequest } from '../../../lib/middleware';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import Article from '../../../models/Article';
import { logActivity } from '../../../lib/activityLogger';

const handler = async (req: AuthRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { filename } = req.query;

  // 检查用户是否为VIP、SVIP或管理员
  if (!req.user || (req.user.role !== 'vip' && req.user.role !== 'svip' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: '只有会员用户可以下载文件' });
  }

  try {
    await dbConnect();

    // 查找用户
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查会员状态是否过期
    if (user.role === 'vip' && user.vipExpiresAt && user.vipExpiresAt < new Date()) {
      user.isVip = false;
      user.vipExpiresAt = null;
      // 只有当用户不是管理员或超级管理员时，才修改角色
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        user.role = 'user';
      }
      await user.save();
      return res.status(403).json({ message: 'VIP会员已过期' });
    }

    if (user.role === 'svip' && user.svipExpiresAt && user.svipExpiresAt < new Date()) {
      user.isSvip = false;
      user.svipExpiresAt = null;
      // 只有当用户不是管理员或超级管理员时，才修改角色
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        user.role = 'user';
      }
      await user.save();
      return res.status(403).json({ message: 'SVIP会员已过期' });
    }

    // 检查下载次数限制（仅VIP用户，SVIP用户无限制）
    if (user.role === 'vip') {
      // VIP用户每月最多下载10次
      const maxDownloads = 10;
      if (user.downloadCount >= maxDownloads) {
        return res.status(403).json({ message: 'VIP会员每月最多可下载10个工作流，您已达到本月下载限制' });
      }
      // 增加下载次数
      user.downloadCount += 1;
      await user.save();
    }

    // 构建文件路径
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename as string);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 尝试根据文件名查找对应的工作流
    let workflowTitle = filename as string;
    let workflowId = null;
    
    try {
      // 从数据库中查找匹配的工作流文件
      const article = await Article.findOne({ fileUrl: { $regex: filename as string } });
      if (article) {
        workflowTitle = article.title;
        workflowId = article._id;
      }
    } catch (error) {
      console.error('查找工作流信息失败:', error);
    }

    // 记录下载活动
    await logActivity({
      userId: user._id,
      username: user.username,
      type: 'workflow_download',
      action: `下载了工作流: ${workflowTitle}`,
      workflowId: workflowId,
      workflowTitle: workflowTitle
    });

    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // 发送文件
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('文件下载失败:', error);
    return res.status(500).json({ message: '文件下载失败' });
  }
};

// 使用认证中间件
export default async function protectedHandler(req: NextApiRequest, res: NextApiResponse) {
  return authMiddleware(req as AuthRequest, res, () => handler(req as AuthRequest, res));
}