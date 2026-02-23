'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user' | 'vip' | 'svip';
  isSuperAdmin: boolean;
  isVip: boolean;
  isSvip: boolean;
  vipExpiresAt: string | null;
  svipExpiresAt: string | null;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user' | 'vip' | 'svip';
  isSuperAdmin: boolean;
  isVip: boolean;
  isSvip: boolean;
  vipExpiresAt: string | null;
  svipExpiresAt: string | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<'superadmin' | 'admin' | 'user' | 'vip' | 'svip'>('user');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as 'superadmin' | 'admin' | 'user' | 'vip' | 'svip'
  });
  const [showMemberEdit, setShowMemberEdit] = useState(false);
  const [editingMemberUser, setEditingMemberUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [memberType, setMemberType] = useState<'none' | 'vip' | 'svip'>('none');
  const [memberDuration, setMemberDuration] = useState<number>(30); // 默认为30天
  const [customExpiresAt, setCustomExpiresAt] = useState<string>(''); // 自定义过期时间
  const [useCustomDate, setUseCustomDate] = useState<boolean>(false); // 是否使用自定义日期
  const [showAdminManagement, setShowAdminManagement] = useState(false); // 管理员管理状态
  const [showAddAdmin, setShowAddAdmin] = useState(false); // 添加管理员状态
  const [newAdmin, setNewAdmin] = useState({ username: '', email: '', password: '' }); // 新管理员信息

  useEffect(() => {
    // 获取用户信息
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userStr);
    setCurrentUser(parsedUser);

    // 检查是否为管理员（包括超级管理员和普通管理员）
    if (parsedUser.role !== 'admin' && parsedUser.role !== 'superadmin') {
      router.push('/');
      return;
    }

    // 获取用户列表
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('未授权，请重新登录');
          return;
        }

        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('获取用户列表失败');
        }

        const data = await response.json();
        setUsers(data.users || []);
      } catch (err: any) {
        setError(err.message || '获取用户列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  // 处理用户角色更新
  const handleUpdateRole = async (user: User) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('未授权，请重新登录');
        return;
      }

      // 如果选择了VIP或SVIP角色，需要同时更新会员状态
      if (editingRole === 'vip' || editingRole === 'svip') {
        const membershipResponse = await fetch(`/api/users/${user.id}/membership`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            memberType: editingRole,
            memberDuration,
            customExpiresAt,
            useCustomDate
          })
        });

        const membershipData = await membershipResponse.json();

        if (!membershipResponse.ok) {
          setError(membershipData.message || '更新会员状态失败');
          return;
        }
      } else if (editingRole === 'user') {
        // 如果选择普通用户，需要取消会员状态
        const membershipResponse = await fetch(`/api/users/${user.id}/membership`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            memberType: 'none'
          })
        });

        const membershipData = await membershipResponse.json();

        if (!membershipResponse.ok) {
          setError(membershipData.message || '更新会员状态失败');
          return;
        }
      }

      // 更新角色
      const response = await fetch(`/api/users/${user.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: editingRole })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || '更新用户角色失败');
        return;
      }

      // 更新本地状态
      const updatedUsers = users.map(u => 
        u.id === user.id ? data.user : u
      );
      setUsers(updatedUsers);
      setEditingUser(null);
      setSuccess('用户角色更新成功');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('更新用户角色失败:', error);
      setError('更新用户角色失败，请稍后重试');
    }
  };

  // 处理添加管理员
  const handleAddAdmin = async () => {
    if (!newAdmin.username || !newAdmin.email || !newAdmin.password) {
      setError('请填写所有必填字段');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('未授权，请重新登录');
        return;
      }

      const response = await fetch('/api/admin/add-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAdmin)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || '添加管理员失败');
        return;
      }

      // 更新本地状态
      setUsers([...users, data.user]);
      setNewAdmin({ username: '', email: '', password: '' });
      setShowAddAdmin(false);
      setSuccess('管理员添加成功');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('添加管理员失败:', error);
      setError('添加管理员失败，请稍后重试');
    }
  };

  // 处理删除管理员
  const handleDeleteAdmin = async (adminId: string) => {
    if (confirm('确定要删除这个管理员吗？此操作不可撤销。')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('未授权，请重新登录');
          return;
        }

        const response = await fetch(`/api/admin/delete-admin?adminId=${adminId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || '删除管理员失败');
          return;
        }

        // 更新本地状态
        const updatedUsers = users.filter(u => u.id !== adminId);
        setUsers(updatedUsers);
        setSuccess('管理员删除成功');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('删除管理员失败:', error);
        setError('删除管理员失败，请稍后重试');
      }
    }
  };

  // 处理用户删除
  const handleDeleteUser = (userId: string) => {
    if (confirm('确定要删除这个用户吗？此操作不可撤销。')) {
      // 这里应该调用API删除用户
      // 为了简化，我们直接更新本地状态
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      setSuccess('用户删除成功');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // 处理会员状态更新
  const handleUpdateMemberStatus = async () => {
    if (!editingMemberUser) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('未授权，请重新登录');
        return;
      }

      const response = await fetch(`/api/users/${editingMemberUser.id}/membership`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          memberType,
          memberDuration,
          customExpiresAt,
          useCustomDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || '更新会员状态失败');
        return;
      }

      // 更新本地状态
      const updatedUsers = users.map(u => 
        u.id === editingMemberUser.id ? data.user : u
      );

      setUsers(updatedUsers);
      setShowMemberEdit(false);
      setEditingMemberUser(null);
      setSuccess('会员状态更新成功');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('更新会员状态失败:', error);
      setError('更新会员状态失败，请稍后重试');
    }
  };

  // 检查是否有权限修改用户的会员状态
  const canEditMemberStatus = (targetUser: User): boolean => {
    if (!currentUser) return false;
    
    // 超级管理员可以修改所有用户
    if (currentUser.isSuperAdmin || currentUser.role === 'superadmin') {
      return true;
    }
    
    // 管理员只能修改低于自己等级的用户
    if (currentUser.role === 'admin') {
      // 管理员可以修改普通用户、VIP用户和SVIP用户
      // 因为管理员等级高于这些用户
      return targetUser.role !== 'admin' && targetUser.role !== 'superadmin';
    }
    
    return false;
  };

  // 导出用户数据
  const handleExportUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('未授权，请重新登录');
        return;
      }

      // 获取所有用户数据
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('获取用户数据失败');
      }

      const data = await response.json();
      const usersData = data.users || [];

      // 转换为CSV格式
      const csvContent = convertToCSV(usersData);

      // 创建下载链接
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `users_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess('用户数据导出成功');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('导出用户数据失败:', error);
      setError('导出用户数据失败，请稍后重试');
    }
  };

  // 将用户数据转换为CSV格式
  const convertToCSV = (data: any[]): string => {
    if (!data.length) return '';

    // CSV表头
    const headers = ['ID', '用户名', '邮箱', '角色', '是否超级管理员', '是否VIP', '是否SVIP', 'VIP过期时间', 'SVIP过期时间', '注册时间'];

    // 转换数据行
    const rows = data.map(user => [
      user.id,
      user.username,
      user.email,
      user.role === 'superadmin' ? '超级管理员' : user.role === 'admin' ? '管理员' : user.role === 'svip' ? 'SVIP用户' : user.role === 'vip' ? 'VIP用户' : '普通用户',
      user.isSuperAdmin ? '是' : '否',
      user.isVip ? '是' : '否',
      user.isSvip ? '是' : '否',
      user.vipExpiresAt ? new Date(user.vipExpiresAt).toLocaleString('zh-CN') : '无',
      user.svipExpiresAt ? new Date(user.svipExpiresAt).toLocaleString('zh-CN') : '无',
      new Date(user.createdAt).toLocaleString('zh-CN')
    ]);

    // 组合表头和数据行
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  // 导出数据库结构
  const handleExportDatabaseStructure = async () => {
    try {
      // 数据库结构信息
      const databaseStructure = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        models: {
          User: `import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'superadmin' | 'admin' | 'user' | 'vip' | 'svip';
  isSuperAdmin: boolean;
  isVip: boolean;
  isSvip: boolean;
  vipExpiresAt: Date | null;
  svipExpiresAt: Date | null;
  downloadCount: number;
  maxDownloads: number;
  avatar: string;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'user', 'vip', 'svip'],
    default: 'user'
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  isVip: {
    type: Boolean,
    default: false
  },
  isSvip: {
    type: Boolean,
    default: false
  },
  vipExpiresAt: {
    type: Date,
    default: null
  },
  svipExpiresAt: {
    type: Date,
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  maxDownloads: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// 密码加密
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 密码验证
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
export { IUser };`,
          Activity: `import mongoose, { Schema, Document } from 'mongoose';

interface IActivity extends Document {
  userId: string;
  username: string;
  type: 'register' | 'login' | 'vip_upgrade' | 'svip_upgrade' | 'download' | 'admin_action';
  action: string;
  details?: Record<string, any>;
}

const ActivitySchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['register', 'login', 'vip_upgrade', 'svip_upgrade', 'download', 'admin_action'],
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

export default mongoose.model<IActivity>('Activity', ActivitySchema);
export { IActivity };`,
          Article: `import mongoose, { Schema, Document } from 'mongoose';

interface IArticle extends Document {
  title: string;
  content: string;
  author: string;
  status: 'draft' | 'published';
  tags: string[];
  viewCount: number;
}

const ArticleSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  tags: {
    type: [String],
    default: []
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model<IArticle>('Article', ArticleSchema);
export { IArticle };`,
          Settings: `import mongoose, { Schema, Document } from 'mongoose';

interface ISettings extends Document {
  key: string;
  value: any;
  description?: string;
}

const SettingsSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
export { ISettings };`
        },
        setupInstructions: `# 数据库搭建指南

## 环境要求
- Node.js 18+
- MongoDB 4.0+

## 搭建步骤

### 1. 安装依赖
bash
npm install mongoose bcryptjs


### 2. 创建数据库连接
创建 lib/mongodb.ts 文件：

typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/douyin-blogger-platform';

let cachedConnection: mongoose.Connection | null = null;

export default async function dbConnect() {
  if (cachedConnection) {
    return cachedConnection;
  }

  const connection = await mongoose.connect(MONGODB_URI);
  cachedConnection = connection.connection;
  return cachedConnection;
}


### 3. 创建模型文件
将导出的模型文件复制到 models/ 目录

### 4. 创建超级管理员账户
创建 create-admin.js 文件：

javascript
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/douyin-blogger-platform');
    console.log('数据库连接成功！');

    // 检查是否已存在admin用户
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('admin用户已存在！');
      return;
    }

    // 创建超级管理员
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123', // 请在生产环境中修改密码
      role: 'superadmin',
      isSuperAdmin: true
    });

    await adminUser.save();
    console.log('超级管理员创建成功！');
    console.log('用户名: admin');
    console.log('邮箱: admin@example.com');
    console.log('密码: admin123');

    await mongoose.connection.close();
  } catch (error) {
    console.error('创建超级管理员失败:', error);
  }
}

createAdmin();


### 5. 运行创建脚本
bash
node create-admin.js


### 6. 启动应用
bash
npm run dev


## 注意事项
- 请在生产环境中修改默认密码
- 确保MongoDB服务已启动
- 检查数据库连接字符串是否正确
`
      };

      // 创建JSON文件
      const jsonContent = JSON.stringify(databaseStructure, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `database-structure-${new Date().toISOString().slice(0, 10)}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess('数据库结构导出成功');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('导出数据库结构失败:', error);
      setError('导出数据库结构失败，请稍后重试');
    }
  };

  // 打开会员编辑模态框
  const openMemberEditModal = (user: User) => {
    setEditingMemberUser(user);
    // 根据用户当前状态设置默认值
    if (user.isSvip) {
      setMemberType('svip');
    } else if (user.isVip) {
      setMemberType('vip');
    } else {
      setMemberType('none');
    }
    setMemberDuration(30); // 默认30天
    setUseCustomDate(false); // 默认不使用自定义日期
    // 设置自定义过期时间为当前过期时间（如果存在）
    const currentExpiresAt = user.isSvip ? user.svipExpiresAt : user.isVip ? user.vipExpiresAt : null;
    // 确保currentExpiresAt是字符串格式
    let expiresAtString = '';
    if (currentExpiresAt) {
      // 如果是字符串，直接使用
      expiresAtString = currentExpiresAt.slice(0, 16);
    }
    setCustomExpiresAt(expiresAtString); // datetime-local 需要 YYYY-MM-DDTHH:mm 格式
    setShowMemberEdit(true);
  };

  // 处理添加用户
  const handleAddUser = () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      setError('请填写所有必填字段');
      return;
    }

    // 这里应该调用API添加用户
    // 为了简化，我们直接更新本地状态
    const newUserId = (users.length + 1).toString();
    const userToAdd: User = {
      id: newUserId,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      isSuperAdmin: false,
      isVip: newUser.role === 'vip',
      isSvip: newUser.role === 'svip',
      vipExpiresAt: newUser.role === 'vip' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      svipExpiresAt: newUser.role === 'svip' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      createdAt: new Date().toISOString()
    };

    setUsers([...users, userToAdd]);
    setNewUser({ username: '', email: '', password: '', role: 'user' });
    setShowAddUser(false);
    setSuccess('用户添加成功');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-56 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:relative`}>
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">管理后台</h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 侧边栏导航 */}
        <nav className="mt-4">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            主菜单
          </div>
          <ul className="space-y-1 px-2">
            <li>
              <Link 
                href="/admin" 
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                仪表盘
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/articles" 
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                工作流管理
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/users" 
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-900 bg-blue-50 border-l-4 border-blue-500 rounded-r-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                用户管理
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/settings" 
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                系统设置
              </Link>
            </li>
            <li>
              <Link 
                href="/" 
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                返回主页
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col md:ml-56">
        {/* 顶部导航栏 */}
        <div className="bg-white shadow-sm z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center space-x-4 ml-4 md:ml-0">
                <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm font-medium">网站首页</span>
                </Link>
                <h2 className="text-xl font-bold text-gray-900">用户管理</h2>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* 搜索框 */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索用户..."
                  className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* 通知图标 */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* 用户菜单 */}
              <div className="relative" onMouseEnter={() => setShowUserMenu(true)} onMouseLeave={() => setShowUserMenu(false)}>
                <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{currentUser.username}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ${showUserMenu ? 'block' : 'hidden'}`}>
                  <a 
                    href="#" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    个人资料
                  </a>
                  <a 
                    href="#" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    账户设置
                  </a>
                  <div className="border-t border-gray-100"></div>
                  <a 
                    href="#" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleLogout}
                  >
                    登出
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 p-4 md:p-6">
          {/* 面包屑导航 */}
          <div className="mb-6 flex items-center text-sm">
            <Link href="/admin" className="text-gray-500 hover:text-blue-500">
              仪表盘
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-700 font-medium">用户管理</span>
          </div>

          {/* 状态提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-4 mb-6">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            </div>
          )}

          {/* 操作栏 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
              {currentUser?.isSuperAdmin && (
                <button
                  onClick={() => setShowAdminManagement(!showAdminManagement)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${showAdminManagement ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
                >
                  {showAdminManagement ? '关闭管理员管理' : '管理员管理'}
                </button>
              )}
            </div>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              {showAddUser ? '取消' : '添加用户'}
            </button>
          </div>

          {/* 管理员管理区域 - 只有超级管理员可见 */}
          {showAdminManagement && currentUser?.isSuperAdmin && (
            <div className="bg-purple-50 rounded-lg shadow-sm p-6 mb-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-purple-900">管理员管理</h2>
                <button
                  onClick={() => setShowAddAdmin(!showAddAdmin)}
                  className="bg-purple-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-600 transition-colors"
                >
                  {showAddAdmin ? '取消' : '添加管理员'}
                </button>
              </div>

              {/* 添加管理员表单 */}
              {showAddAdmin && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">添加新管理员</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700 mb-2">
                        用户名
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        id="admin-username"
                        value={newAdmin.username}
                        onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="请输入用户名"
                      />
                    </div>
                    <div>
                      <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-2">
                        邮箱
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="email"
                        id="admin-email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="请输入邮箱"
                      />
                    </div>
                    <div>
                      <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
                        密码
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="password"
                        id="admin-password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="请输入密码"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setShowAddAdmin(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors mr-2"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddAdmin}
                      className="px-4 py-2 bg-purple-500 text-white rounded-md text-sm font-medium hover:bg-purple-600 transition-colors"
                    >
                      添加管理员
                    </button>
                  </div>
                </div>
              )}

              {/* 管理员列表 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-md font-semibold text-gray-900">现有管理员</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          用户名
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          邮箱
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          角色
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.filter(u => u.role === 'admin').map((admin) => (
                        <tr key={admin.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                                {admin.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {admin.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{admin.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.isSuperAdmin ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {admin.isSuperAdmin ? '超级管理员' : '普通管理员'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {!admin.isSuperAdmin && (
                              <button
                                onClick={() => handleDeleteAdmin(admin.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                删除
                              </button>
                            )}
                            {admin.isSuperAdmin && (
                              <span className="text-gray-400 text-xs">不可删除</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {users.filter(u => u.role === 'admin').length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center">
                            <p className="text-gray-600">暂无管理员</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 添加用户表单 */}
          {showAddUser && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">添加新用户</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    用户名
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入用户名"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入邮箱"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入密码"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    角色
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="role"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'superadmin' | 'admin' | 'user' | 'vip' | 'svip' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user">普通用户</option>
                    <option value="vip">VIP用户</option>
                    <option value="svip">SVIP用户</option>
                    {(currentUser?.isSuperAdmin || currentUser?.role === 'superadmin') && <option value="admin">管理员</option>}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors mr-2"
                >
                  取消
                </button>
                <button
                  onClick={handleAddUser}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  添加用户
                </button>
              </div>
            </div>
          )}

          {/* 用户列表 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">用户列表</h2>
                <div className="flex items-center space-x-4">
                  {(currentUser?.isSuperAdmin || currentUser?.role === 'superadmin') && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleExportUsers}
                        className="px-3 py-1 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors flex items-center space-x-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>导出用户数据</span>
                      </button>
                      <button
                        onClick={handleExportDatabaseStructure}
                        className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors flex items-center space-x-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>导出数据库结构</span>
                      </button>
                    </div>
                  )}
                  <span className="text-sm text-gray-500">共 {users.length} 个用户</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户名
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      邮箱
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      会员状态
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      注册时间
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser?.id === user.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <select
                                value={editingRole}
                                onChange={(e) => {
                                  setEditingRole(e.target.value as 'admin' | 'user' | 'vip' | 'svip');
                                  if (e.target.value === 'vip') {
                                    setMemberType('vip');
                                  } else if (e.target.value === 'svip') {
                                    setMemberType('svip');
                                  } else {
                                    setMemberType('none');
                                  }
                                }}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="user">普通用户</option>
                                <option value="vip">VIP用户</option>
                                <option value="svip">SVIP用户</option>
                                {(currentUser?.isSuperAdmin || currentUser?.role === 'superadmin') && <option value="admin">管理员</option>}
                              </select>
                            </div>
                            {(editingRole === 'vip' || editingRole === 'svip') && (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`use-custom-date-${user.id}`}
                                    checked={useCustomDate}
                                    onChange={(e) => setUseCustomDate(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <label htmlFor={`use-custom-date-${user.id}`} className="text-sm text-gray-700">
                                    使用自定义过期时间
                                  </label>
                                </div>
                                {!useCustomDate ? (
                                  <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-700">会员时长：</label>
                                    <select
                                      value={memberDuration === -1 ? 'infinite' : memberDuration}
                                      onChange={(e) => {
                                        if (e.target.value === 'infinite') {
                                          setMemberDuration(-1); // 使用-1表示无限
                                        } else {
                                          setMemberDuration(parseInt(e.target.value));
                                        }
                                      }}
                                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
                                    >
                                      <option value="30">30天</option>
                                      <option value="90">90天</option>
                                      <option value="180">180天</option>
                                      <option value="365">365天</option>
                                      <option value="infinite">无限</option>
                                    </select>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-700">过期时间：</label>
                                    <input
                                      type="datetime-local"
                                      value={customExpiresAt}
                                      onChange={(e) => setCustomExpiresAt(e.target.value)}
                                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleUpdateRole(user)}
                                className="px-2 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 transition-colors"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="px-2 py-1 bg-gray-300 text-gray-700 rounded-md text-xs hover:bg-gray-400 transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'superadmin' ? 'bg-yellow-100 text-yellow-800' : user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === 'svip' ? 'bg-purple-100 text-purple-800' : user.role === 'vip' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                            {user.role === 'superadmin' ? '超级管理员' : user.role === 'admin' ? '管理员' : user.role === 'svip' ? 'SVIP用户' : user.role === 'vip' ? 'VIP用户' : '普通用户'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.isSvip ? `SVIP过期：${new Date(user.svipExpiresAt!).toLocaleDateString()}` : 
                         user.isVip ? `VIP过期：${new Date(user.vipExpiresAt!).toLocaleDateString()}` : '非会员'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingUser?.id !== user.id && (
                          <>
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setEditingRole(user.role);
                                // 初始化会员状态相关字段
                                if (user.role === 'vip') {
                                  setMemberType('vip');
                                } else if (user.role === 'svip') {
                                  setMemberType('svip');
                                } else {
                                  setMemberType('none');
                                }
                                setMemberDuration(30);
                                setUseCustomDate(false);
                                const currentExpiresAt = user.isSvip ? user.svipExpiresAt : user.isVip ? user.vipExpiresAt : null;
                                let expiresAtString = '';
                                if (currentExpiresAt) {
                                  expiresAtString = currentExpiresAt.slice(0, 16);
                                }
                                setCustomExpiresAt(expiresAtString);
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              编辑角色
                            </button>
                            {currentUser?.isSuperAdmin ? (
                              user.role !== 'superadmin' && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  删除
                                </button>
                              )
                            ) : (
                              user.role !== 'admin' && user.role !== 'superadmin' && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  删除
                                </button>
                              )
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="px-6 py-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-gray-600">暂无用户</p>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  添加第一个用户
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 会员状态编辑模态框 */}
        {showMemberEdit && editingMemberUser && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">编辑会员状态</h3>
                <p className="text-sm text-gray-500 mt-1">用户: {editingMemberUser.username}</p>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    会员类型
                  </label>
                  <select
                    value={memberType}
                    onChange={(e) => setMemberType(e.target.value as 'none' | 'vip' | 'svip')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">非会员</option>
                    <option value="vip">VIP会员</option>
                    <option value="svip">SVIP会员</option>
                  </select>
                </div>
                
                {memberType !== 'none' && (
                  <>
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={useCustomDate}
                          onChange={(e) => setUseCustomDate(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">使用自定义过期时间</span>
                      </label>
                    </div>
                    
                    {!useCustomDate ? (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          会员时长 (天)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={memberDuration}
                          onChange={(e) => setMemberDuration(Number(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          过期时间: {new Date(Date.now() + memberDuration * 24 * 60 * 60 * 1000).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          自定义过期时间
                        </label>
                        <input
                          type="datetime-local"
                          value={customExpiresAt}
                          onChange={(e) => setCustomExpiresAt(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          当前选择: {customExpiresAt ? new Date(customExpiresAt).toLocaleString() : '请选择过期时间'}
                        </p>
                      </div>
                    )}
                  </>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowMemberEdit(false);
                      setEditingMemberUser(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpdateMemberStatus}
                    className="px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
