// 测试数据库连接和仪表盘数据获取
const dbConnect = require('./lib/mongodb');
const User = require('./models/User').default;
const Article = require('./models/Article').default;

async function testDashboardData() {
  try {
    console.log('正在连接数据库...');
    await dbConnect();
    console.log('数据库连接成功！');

    // 获取用户统计数据
    console.log('\n获取用户统计数据...');
    const totalUsers = await User.countDocuments();
    console.log('总用户数:', totalUsers);

    const vipUsers = await User.countDocuments({ role: 'vip' });
    console.log('VIP用户数:', vipUsers);

    const svipUsers = await User.countDocuments({ role: 'svip' });
    console.log('SVIP用户数:', svipUsers);

    // 获取工作流统计数据
    console.log('\n获取工作流统计数据...');
    const totalWorkflows = await Article.countDocuments();
    console.log('工作流总数:', totalWorkflows);

    console.log('\n测试完成！');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testDashboardData();