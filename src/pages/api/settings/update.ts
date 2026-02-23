import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Settings from '../../../models/Settings';
import { authMiddleware, AuthRequest } from '../../../lib/middleware';

const handler = async (req: AuthRequest, res: NextApiResponse) => {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { settingsType, settings } = req.body;

    // 验证设置类型
    if (!['site', 'upload', 'email'].includes(settingsType)) {
      return res.status(400).json({ message: '无效的设置类型' });
    }

    // 获取现有设置
    let existingSettings = await Settings.findOne();
    
    if (!existingSettings) {
      existingSettings = await Settings.create({});
    }

    // 根据设置类型更新相应的字段
    switch (settingsType) {
      case 'site':
        existingSettings.siteName = settings.siteName || existingSettings.siteName;
        existingSettings.siteDescription = settings.siteDescription || existingSettings.siteDescription;
        existingSettings.siteLogo = settings.siteLogo || existingSettings.siteLogo;
        existingSettings.siteFavicon = settings.siteFavicon || existingSettings.siteFavicon;
        existingSettings.enableRegistration = settings.enableRegistration !== undefined ? settings.enableRegistration : existingSettings.enableRegistration;
        existingSettings.enableEmailVerification = settings.enableEmailVerification !== undefined ? settings.enableEmailVerification : existingSettings.enableEmailVerification;
        break;
      
      case 'upload':
        existingSettings.maxFileSize = settings.maxFileSize !== undefined ? settings.maxFileSize : existingSettings.maxFileSize;
        existingSettings.allowedExtensions = settings.allowedExtensions || existingSettings.allowedExtensions;
        existingSettings.uploadPath = settings.uploadPath || existingSettings.uploadPath;
        existingSettings.enableFileCompression = settings.enableFileCompression !== undefined ? settings.enableFileCompression : existingSettings.enableFileCompression;
        break;
      
      case 'email':
        existingSettings.smtpHost = settings.smtpHost || existingSettings.smtpHost;
        existingSettings.smtpPort = settings.smtpPort !== undefined ? settings.smtpPort : existingSettings.smtpPort;
        existingSettings.smtpUsername = settings.smtpUsername || existingSettings.smtpUsername;
        existingSettings.smtpPassword = settings.smtpPassword || existingSettings.smtpPassword;
        existingSettings.smtpFrom = settings.smtpFrom || existingSettings.smtpFrom;
        existingSettings.enableEmailNotifications = settings.enableEmailNotifications !== undefined ? settings.enableEmailNotifications : existingSettings.enableEmailNotifications;
        break;
    }

    await existingSettings.save();

    return res.status(200).json({
      message: '设置保存成功',
      settings: {
        siteName: existingSettings.siteName,
        siteDescription: existingSettings.siteDescription,
        siteLogo: existingSettings.siteLogo,
        siteFavicon: existingSettings.siteFavicon,
        enableRegistration: existingSettings.enableRegistration,
        enableEmailVerification: existingSettings.enableEmailVerification,
        maxFileSize: existingSettings.maxFileSize,
        allowedExtensions: existingSettings.allowedExtensions,
        uploadPath: existingSettings.uploadPath,
        enableFileCompression: existingSettings.enableFileCompression,
        smtpHost: existingSettings.smtpHost,
        smtpPort: existingSettings.smtpPort,
        smtpUsername: existingSettings.smtpUsername,
        smtpFrom: existingSettings.smtpFrom,
        enableEmailNotifications: existingSettings.enableEmailNotifications,
        updatedAt: existingSettings.updatedAt,
      },
    });
  } catch (error) {
    console.error('保存设置失败:', error);
    return res.status(500).json({ message: '保存设置失败' });
  }
};

export default async function protectedHandler(req: NextApiRequest, res: NextApiResponse) {
  return authMiddleware(req as AuthRequest, res, () => handler(req as AuthRequest, res));
}