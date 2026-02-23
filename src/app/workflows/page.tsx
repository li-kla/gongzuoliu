'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Workflow {
  _id: string;
  title: string;
  workflowName: string;
  content: string;
  videoUrl: string;
  fileUrl: string;
  author: {
    username: string;
  };
  createdAt: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch('/api/articles');
        const data = await response.json();
        
        if (response.ok) {
          setWorkflows(data.articles);
        } else {
          throw new Error(data.message || '获取工作流列表失败');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
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
      <h1 className="text-3xl font-bold mb-8 text-center">工作流列表</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {workflows.map((workflow) => (
          <div key={workflow._id} className="card">
            <h2 className="text-xl font-bold mb-2">{workflow.title}</h2>
            <p className="text-gray-600 mb-4">工作流：{workflow.workflowName}</p>
            <p className="text-gray-500 text-sm mb-4">
              作者：{workflow.author.username} | {new Date(workflow.createdAt).toLocaleDateString()}
            </p>
            <div className="prose max-w-none mb-4">
              <p>{workflow.content.substring(0, 100)}...</p>
            </div>
            <Link 
              href={`/workflows/${workflow._id}`} 
              className="btn btn-primary"
            >
              查看详情
            </Link>
          </div>
        ))}
      </div>

      {workflows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">暂无工作流</p>
        </div>
      )}
    </div>
  );
}