# 搞薯条Ai工作流

一个基于Next.js和MongoDB的工作流管理平台，支持用户注册、登录、工作流发布和下载等功能。

## 功能特性

### 用户功能
- 用户注册和登录
- 个人资料管理
- 工作流浏览和搜索
- 工作流下载（VIP/SVIP会员专属）
- 会员等级系统（普通用户、VIP、SVIP）

### 管理员功能
- 用户管理（添加、编辑、删除用户）
- 角色管理（超级管理员、普通管理员）
- 会员状态管理
- 工作流管理（发布、编辑、删除）
- 数据导出功能
- 系统设置

### 技术特点
- 响应式设计，支持移动端
- 现代化UI界面
- 权限分级管理
- 数据持久化存储
- 实时搜索功能

## 技术栈

### 前端
- Next.js 14.2.1
- React 18.2.0
- TypeScript 5.4.2
- Tailwind CSS 3.4.3
- Lucide React 0.344.0

### 后端
- Next.js API Routes
- MongoDB (Mongoose 8.2.0)
- JWT认证 (jsonwebtoken 9.0.2)
- 密码加密 (bcryptjs 2.4.3)
- 文件上传 (multer 1.4.5-lts.1)

## 安装和运行

### 环境要求
- Node.js 18+
- MongoDB 4.4+

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd gongzuoliu
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建`.env`文件，添加以下配置：
```
MONGODB_URI=mongodb://localhost:27017/workflow-platform
JWT_SECRET=your-secret-key
NEXTAUTH_SECRET=your-nextauth-secret
```

4. 启动MongoDB
```bash
mongod --dbpath <your-data-path>
```

5. 启动开发服务器
```bash
npm run dev
```

6. 访问应用
打开浏览器访问 `http://localhost:3000`

## 项目结构

```
gongzuoliu/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # 管理后台页面
│   │   ├── api/               # API路由
│   │   ├── profile/           # 用户资料页面
│   │   └── ...               # 其他页面
│   ├── components/            # React组件
│   ├── lib/                  # 工具函数
│   └── models/               # 数据模型
├── public/                   # 静态资源
├── uploads/                  # 上传文件目录
└── package.json             # 项目配置
```

## 用户角色

### 超级管理员
- 拥有所有权限
- 可以添加、删除管理员
- 可以修改任何用户的会员状态
- 可以导出用户数据和数据库结构

### 普通管理员
- 可以管理普通用户
- 可以发布、编辑、删除工作流
- 可以修改低于自己等级用户的会员状态

### 普通用户
- 可以浏览工作流
- 可以搜索工作流
- 可以下载工作流（需要会员权限）

## 会员等级

- **普通用户**: 基础访问权限
- **VIP**: 可以下载VIP级别的工作流
- **SVIP**: 可以下载所有级别的工作流

## 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 注意事项

1. 首次运行需要创建超级管理员账户
2. MongoDB数据目录需要提前创建
3. 上传文件目录需要写权限
4. 生产环境请修改JWT密钥

## 许可证

MIT License