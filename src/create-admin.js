const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    await mongoose.connect('mongodb://localhost:27018/douyin-blogger-platform');
    console.log('数据库连接成功！');

    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true, trim: true },
      email: { type: String, required: true, unique: true, trim: true, lowercase: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['admin', 'user', 'vip', 'svip'], default: 'user' },
      isVip: { type: Boolean, default: false },
      isSvip: { type: Boolean, default: false },
      vipExpiresAt: { type: Date, default: null },
      svipExpiresAt: { type: Date, default: null },
      downloadCount: { type: Number, default: 0 },
      maxDownloads: { type: Number, default: 0 },
      avatar: { type: String, default: '' },
    }, { timestamps: true });

    const User = mongoose.model('User', userSchema);

    // 检查是否已存在管理员
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('管理员账户已存在:', existingAdmin.username);
      console.log('管理员邮箱:', existingAdmin.email);
      await mongoose.connection.close();
      return;
    }

    // 创建管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      isVip: true,
      isSvip: true,
      vipExpiresAt: new Date('2030-12-31'),
      svipExpiresAt: new Date('2030-12-31'),
      downloadCount: 0,
      maxDownloads: 1000,
      avatar: '',
    });

    await adminUser.save();
    console.log('管理员账户创建成功！');
    console.log('用户名: admin');
    console.log('邮箱: admin@example.com');
    console.log('密码: admin123');

    await mongoose.connection.close();
  } catch (error) {
    console.error('创建管理员用户失败:', error);
  }
}

createAdminUser();