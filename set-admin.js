const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
}, {
  timestamps: true,
});

// 密码哈希方法
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// 主函数
async function setAdminUser() {
  try {
    // 连接数据库
    const MONGODB_URI = 'mongodb://localhost:27017/douyin-blogger-platform';
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('数据库连接成功');

    // 用户信息
    const userData = {
      username: 'lixiaojian',
      email: '754455705',
      password: 'wahaha',
      role: 'admin',
    };

    // 检查用户是否存在
    let user = await User.findOne({ 
      $or: [
        { username: userData.username },
        { email: userData.email }
      ] 
    });

    if (user) {
      // 更新现有用户
      console.log('用户已存在，更新为管理员...');
      user.role = 'admin';
      await user.save();
      console.log('用户已更新为管理员');
    } else {
      // 创建新用户
      console.log('创建新管理员用户...');
      user = new User({
        ...userData,
        isVip: false,
        isSvip: false,
        vipExpiresAt: null,
        svipExpiresAt: null,
        downloadCount: 0,
        maxDownloads: 0,
      });
      await user.save();
      console.log('管理员用户创建成功');
    }

    // 显示用户信息
    console.log('用户信息:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });

  } catch (error) {
    console.error('错误:', error);
  } finally {
    // 断开连接
    await mongoose.disconnect();
    console.log('数据库连接已断开');
  }
}

// 执行函数
setAdminUser();
