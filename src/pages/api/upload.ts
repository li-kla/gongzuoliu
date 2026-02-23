import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import { authMiddleware, AuthRequest, adminRequired } from '../../lib/middleware';
import dbConnect from '../../lib/mongodb';
import Settings from '../../models/Settings';

// 扩展 NextApiRequest 类型以包含文件属性
declare module 'next' {
  interface NextApiRequest {
    file?: {
      filename: string;
      path: string;
      size: number;
    };
  }
}

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// 动态获取上传设置
const getUploadSettings = async () => {
  try {
    await dbConnect();
    const settings = await Settings.findOne();
    return {
      maxFileSize: settings?.maxFileSize || 50, // 默认50MB
      allowedExtensions: settings?.allowedExtensions || '.zip,.rar,.7z',
    };
  } catch (error) {
    console.error('获取上传设置失败:', error);
    return {
      maxFileSize: 50,
      allowedExtensions: '.zip,.rar,.7z',
    };
  }
};

// 处理单个文件上传
const handler = async (req: AuthRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 检查是否为管理员
  try {
    adminRequired(req, res, async () => {
      // 获取上传设置
      const uploadSettings = await getUploadSettings();
      const maxFileSizeInBytes = uploadSettings.maxFileSize * 1024 * 1024;
      const allowedExtensions = uploadSettings.allowedExtensions.split(',').map(ext => ext.toLowerCase());

      // 配置multer
      const upload = multer({
        storage: storage,
        limits: {
          fileSize: maxFileSizeInBytes,
        },
        fileFilter: function (req, file, cb) {
          // 允许的文件类型
          const extname = path.extname(file.originalname).toLowerCase();
          
          if (allowedExtensions.includes(extname)) {
            return cb(null, true);
          }
          
          cb(new Error(`只允许上传 ${uploadSettings.allowedExtensions} 格式的文件`));
        },
      });

      const uploadSingle = upload.single('file');

      // 处理文件上传
      uploadSingle(req as any, res as any, function (err) {
        if (err) {
          return res.status(400).json({ message: err.message });
        }

        // 检查文件是否上传
        if (!req.file) {
          return res.status(400).json({ message: '请选择要上传的文件' });
        }

        // 构建文件URL
        const fileUrl = `/uploads/${req.file.filename}`;

        return res.status(200).json({
          message: '文件上传成功',
          file: {
            filename: req.file.filename,
            path: req.file.path,
            url: fileUrl,
            size: req.file.size,
          },
        });
      });
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    return res.status(500).json({ message: '文件上传失败' });
  }
};

// 使用认证中间件
export default async function protectedHandler(req: NextApiRequest, res: NextApiResponse) {
  return authMiddleware(req as AuthRequest, res, () => handler(req as AuthRequest, res));
}

// 配置API路由以处理multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};