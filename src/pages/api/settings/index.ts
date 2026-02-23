import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Settings from '../../../models/Settings';
import { authMiddleware, AuthRequest } from '../../../lib/middleware';

const handler = async (req: AuthRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // 获取设置（如果不存在则创建默认设置）
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({});
    }

    return res.status(200).json({
      settings: {
        siteName: settings.siteName,
        siteDescription: settings.siteDescription,
        siteLogo: settings.siteLogo,
        siteFavicon: settings.siteFavicon,
        enableRegistration: settings.enableRegistration,
        enableEmailVerification: settings.enableEmailVerification,
        maxFileSize: settings.maxFileSize,
        allowedExtensions: settings.allowedExtensions,
        uploadPath: settings.uploadPath,
        enableFileCompression: settings.enableFileCompression,
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUsername: settings.smtpUsername,
        smtpFrom: settings.smtpFrom,
        enableEmailNotifications: settings.enableEmailNotifications,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    return res.status(500).json({ message: '获取设置失败' });
  }
};

export default async function protectedHandler(req: NextApiRequest, res: NextApiResponse) {
  return authMiddleware(req as AuthRequest, res, () => handler(req as AuthRequest, res));
}