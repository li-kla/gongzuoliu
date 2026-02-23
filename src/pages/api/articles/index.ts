import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import Article from '../../../models/Article';
import { authMiddleware, AuthRequest, adminRequired } from '../../../lib/middleware';

const handler = async (req: AuthRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET': {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 8;
      const skip = (page - 1) * limit;
      const searchKeyword = req.query.search as string || '';

      let articles;
      let total;
      let useMockData = false;

      try {
        await dbConnect();
        
        let query = {};
        
        if (searchKeyword) {
          const keyword = searchKeyword.trim();
          query = {
            $or: [
              { content: { $regex: keyword, $options: 'i' } },
              { benchmarkAccounts: { $elemMatch: { name: { $regex: keyword, $options: 'i' } } } },
              { benchmarkAccounts: { $elemMatch: { url: { $regex: keyword, $options: 'i' } } } }
            ]
          };
        }
        
        articles = await Article.find(query)
          .populate('author', 'username')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
        total = await Article.countDocuments(query);
      } catch (dbError) {
        console.error('数据库连接失败:', dbError);
        return res.status(500).json({ message: '数据库连接失败' });
      }

      try {
        const paginatedArticles = articles.slice(skip, skip + limit);
        
        return res.status(200).json({ 
          articles: paginatedArticles,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + limit < total
          }
        });
      } catch (error) {
        console.error('获取文章列表失败:', error);
        return res.status(500).json({ message: '获取文章列表失败' });
      }
      break;
    }

    case 'POST': {
      try {
        await dbConnect();
        const { title, workflowName, content, videoUrl, fileUrl, benchmarkAccounts } = req.body;

        if (!title || !workflowName || !content || !videoUrl || !fileUrl) {
          return res.status(400).json({ message: '请填写所有必填字段' });
        }

        const article = new Article({
          title,
          workflowName,
          content,
          videoUrl,
          fileUrl,
          benchmarkAccounts: benchmarkAccounts || [],
          author: req.user?.id,
        });

        await article.save();
        await article.populate('author', 'username');

        return res.status(201).json({ message: '文章创建成功', article });
      } catch (error) {
        console.error('创建文章失败:', error);
        // 提供更详细的错误信息
        return res.status(500).json({ message: '创建文章失败', error: error instanceof Error ? error.message : String(error) });
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
  
  if (req.method === 'POST') {
    return authMiddleware(req as AuthRequest, res, () => {
      return adminRequired(req as AuthRequest, res, () => handler(req as AuthRequest, res));
    });
  }
  
  return authMiddleware(req as AuthRequest, res, () => handler(req as AuthRequest, res));
}
