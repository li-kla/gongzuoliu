const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('测试登录 API...');
    
    const testCases = [
      { identifier: 'admin', password: 'admin123' },
      { identifier: 'admin@test.com', password: 'admin123' },
    ];

    for (const testCase of testCases) {
      console.log('\n========================================');
      console.log(`测试登录: ${testCase.identifier}`);
      console.log('========================================');

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase),
      });

      const data = await response.json();
      
      console.log('状态码:', response.status);
      console.log('响应:', data);
      
      if (data.user) {
        console.log('\n用户信息:');
        console.log('id:', data.user.id);
        console.log('username:', data.user.username);
        console.log('email:', data.user.email);
        console.log('role:', data.user.role);
        console.log('avatar:', data.user.avatar);
        console.log('avatar 类型:', typeof data.user.avatar);
        console.log('avatar 是否为空:', !data.user.avatar || data.user.avatar === '');
      }
    }

  } catch (error) {
    console.error('测试失败:', error);
  }
}

testLogin();