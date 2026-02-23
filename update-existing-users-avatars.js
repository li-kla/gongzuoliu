const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 连接数据库
const dbConnect = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/douyin-blogger-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
};

// 创建用户模型
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'vip', 'svip'],
    default: 'user',
  },
  isVip: {
    type: Boolean,
    default: false,
  },
  isSvip: {
    type: Boolean,
    default: false,
  },
  vipExpiresAt: {
    type: Date,
    default: null,
  },
  svipExpiresAt: {
    type: Date,
    default: null,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  maxDownloads: {
    type: Number,
    default: 0,
  },
  avatar: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// 密码哈希方法
UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// 为现有用户生成头像
const updateExistingUsersAvatars = async () => {
  try {
    await dbConnect();
    
    // 获取所有用户
    const users = await User.find({});
    console.log(`找到 ${users.length} 个用户`);
    
    // 为每个用户生成头像
    for (const user of users) {
      if (!user.avatar) {
        // 生成随机种子
        const randomSeed = Math.random().toString(36).substring(2, 10);
        // 生成头像URL
        const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${randomSeed}&backgroundColor=random&colors=random`;
        
        // 更新用户头像
        user.avatar = avatarUrl;
        await user.save();
        console.log(`已为用户 ${user.username} 生成头像: ${avatarUrl}`);
      } else {
        console.log(`用户 ${user.username} 已有头像，跳过`);
      }
    }
    
    console.log('所有用户头像更新完成');
    process.exit(0);
  } catch (error) {
    console.error('更新用户头像失败:', error);
    process.exit(1);
  }
};

// 运行脚本
updateExistingUsersAvatars();
