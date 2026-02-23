import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import Article from '../../../models/Article';
import { getRecentActivities } from '../../../lib/activityLogger';

interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
}

interface DashboardData {
  totalUsers: number;
  totalWorkflows: number;
  vipUsers: number;
  svipUsers: number;
  recentActivities: Activity[];
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // 获取用户统计数据
    const totalUsers = await User.countDocuments();
    const vipUsers = await User.countDocuments({ role: 'vip' });
    const svipUsers = await User.countDocuments({ role: 'svip' });

    // 获取工作流统计数据
    const totalWorkflows = await Article.countDocuments();

    console.log('仪表盘数据:', { totalUsers, totalWorkflows, vipUsers, svipUsers });

    // 获取最近活动（从数据库获取真实数据）
    const activities = await getRecentActivities(10);
    
    // 转换为前端需要的格式
    const recentActivities: Activity[] = activities.map(activity => {
      // 计算相对时间
      const now = new Date();
      const activityTime = new Date(activity.timestamp);
      const diffMs = now.getTime() - activityTime.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      let timeString = '';
      if (diffSecs < 60) {
        timeString = `${diffSecs}秒前`;
      } else if (diffMins < 60) {
        timeString = `${diffMins}分钟前`;
      } else if (diffHours < 24) {
        timeString = `${diffHours}小时前`;
      } else if (diffDays < 7) {
        timeString = `${diffDays}天前`;
      } else {
        timeString = activityTime.toLocaleDateString();
      }
      
      return {
        id: activity._id.toString(),
        user: activity.username,
        action: activity.action,
        time: timeString
      };
    });

    const dashboardData: DashboardData = {
      totalUsers,
      totalWorkflows,
      vipUsers,
      svipUsers,
      recentActivities
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    return res.status(500).json({ message: '获取仪表盘数据失败' });
  }
};

export default handler;