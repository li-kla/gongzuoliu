import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Article from '../../../models/Article';
import { authMiddleware, AuthRequest, adminRequired } from '../../../lib/middleware';

const handler = async (req: AuthRequest, res: NextApiResponse) => {
  const { id } = req.query;

  switch (req.method) {
    case 'GET': {
      let article;
      let useMockData = false;

      try {
        await dbConnect();
        article = await Article.findById(id).populate('author', 'username');
      } catch (dbError) {
        console.error('数据库连接失败，使用模拟数据:', dbError);
        useMockData = true;
        
        const mockArticles = [
          {
            _id: '1',
            title: 'AI音乐剪辑工作流',
            workflowName: '音乐剪辑',
            content: '这是一个强大的AI音乐剪辑工作流，可以自动识别音频中的音乐片段并进行智能剪辑。支持多种音频格式，输出高质量的音乐作品。',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            fileUrl: '/uploads/music-editing-workflow.zip',
            author: { username: 'admin' },
            createdAt: '2024-01-01T00:00:00.000Z'
          },
          {
            _id: '2',
            title: '视频字幕生成工作流',
            workflowName: '字幕生成',
            content: '自动为视频添加字幕的工作流，支持多种语言识别和翻译。可以自定义字幕样式和位置。',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            fileUrl: '/uploads/subtitle-workflow.zip',
            author: { username: 'admin' },
            createdAt: '2024-01-02T00:00:00.000Z'
          },
          {
            _id: '3',
            title: 'AI图像增强工作流',
            workflowName: '图像增强',
            content: '使用AI技术提升图像质量的工作流，支持降噪、锐化、色彩增强等多种功能。',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            fileUrl: '/uploads/image-enhance-workflow.zip',
            author: { username: 'admin' },
            createdAt: '2024-01-03T00:00:00.000Z'
          },
          {
            _id: '4',
            title: '语音转文字工作流',
            workflowName: '语音识别',
            content: '将语音转换为文字的工作流，支持实时转录和批量处理。准确率高，支持多种语言。',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            fileUrl: '/uploads/speech-to-text-workflow.zip',
            author: { username: 'admin' },
            createdAt: '2024-01-04T00:00:00.000Z'
          },
          {
            _id: '5',
            title: 'AI视频剪辑工作流',
            workflowName: '视频剪辑',
            content: '智能视频剪辑工作流，可以自动识别视频中的精彩片段并进行剪辑。支持多种特效和转场。',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            fileUrl: '/uploads/video-editing-workflow.zip',
            author: { username: 'admin' },
            createdAt: '2024-01-05T00:00:00.000Z'
          },
          {
            _id: '6',
            title: '文本转语音工作流',
            workflowName: '语音合成',
            content: '将文本转换为自然语音的工作流，支持多种声音和语调。输出音质清晰，适合各种应用场景。',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            fileUrl: '/uploads/text-to-speech-workflow.zip',
            author: { username: 'admin' },
            createdAt: '2024-01-06T00:00:00.000Z'
          },
          {
            _id: '7',
            title: 'AI绘画工作流',
            workflowName: 'AI绘画',
            content: '使用AI生成高质量图像的工作流，支持多种风格和主题。可以根据文字描述生成精美的图片。',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            fileUrl: '/uploads/ai-painting-workflow.zip',
            author: { username: 'admin' },
            createdAt: '2024-01-07T00:00:00.000Z'
          },
          {
            _id: '8',
            title: '智能翻译工作流',
            workflowName: '翻译',
            content: '多语言智能翻译工作流，支持文本、语音和图片翻译。翻译准确，速度快。',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            fileUrl: '/uploads/translation-workflow.zip',
            author: { username: 'admin' },
            createdAt: '2024-01-08T00:00:00.000Z'
          }
        ];
        
        article = mockArticles.find(a => a._id === id);
      }

      try {
        if (!article) {
          return res.status(404).json({ message: '文章不存在' });
        }
        return res.status(200).json({ article });
      } catch (error) {
        console.error('获取文章详情失败:', error);
        return res.status(500).json({ message: '获取文章详情失败' });
      }
      break;
    }

    case 'PUT': {
      try {
        await dbConnect();
        const { title, workflowName, content, videoUrl, fileUrl, benchmarkAccounts } = req.body;

        if (!title || !workflowName || !content || !videoUrl || !fileUrl) {
          return res.status(400).json({ message: '请填写所有必填字段' });
        }

        const article = await Article.findById(id);
        if (!article) {
          return res.status(404).json({ message: '文章不存在' });
        }

        article.title = title;
        article.workflowName = workflowName;
        article.content = content;
        article.videoUrl = videoUrl;
        article.fileUrl = fileUrl;
        article.benchmarkAccounts = benchmarkAccounts || [];

        await article.save();
        await article.populate('author', 'username');

        return res.status(200).json({ message: '文章更新成功', article });
      } catch (error) {
        console.error('更新文章失败:', error);
        return res.status(500).json({ message: '更新文章失败' });
      }
      break;
    }

    case 'DELETE': {
      try {
        await dbConnect();
        const article = await Article.findById(id);
        if (!article) {
          return res.status(404).json({ message: '文章不存在' });
        }

        await article.deleteOne();

        return res.status(200).json({ message: '文章删除成功' });
      } catch (error) {
        console.error('删除文章失败:', error);
        return res.status(500).json({ message: '删除文章失败' });
      }
      break;
    }

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
};

export default async function protectedHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handler(req as AuthRequest, res);
  }
  
  return authMiddleware(req as AuthRequest, res, () => handler(req as AuthRequest, res));
}
