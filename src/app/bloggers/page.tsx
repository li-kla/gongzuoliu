'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Article {
  _id: string;
  title: string;
  bloggerName: string;
  content: string;
  videoUrl: string;
  fileUrl: string;
  author: {
    username: string;
  };
  createdAt: string;
}

export default function BloggersPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/articles');
        const data = await response.json();
        
        if (response.ok) {
          setArticles(data.articles);
        } else {
          throw new Error(data.message || '获取文章列表失败');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12">
        <div className="alert alert-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">搞薯条Ai工作流</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (
          <div key={article._id} className="card">
            <h2 className="text-xl font-bold mb-2">{article.title}</h2>
            <p className="text-gray-600 mb-4">博主：{article.bloggerName}</p>
            <p className="text-gray-500 text-sm mb-4">
              作者：{article.author.username} | {new Date(article.createdAt).toLocaleDateString()}
            </p>
            <div className="prose max-w-none mb-4">
              <p>{article.content.substring(0, 100)}...</p>
            </div>
            <Link 
              href={`/bloggers/${article._id}`} 
              className="btn btn-primary"
            >
              查看详情
            </Link>
          </div>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">暂无文章</p>
        </div>
      )}
    </div>
  );
}