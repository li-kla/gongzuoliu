// 测试头像 URL 生成逻辑
function getAvatarUrl(username, avatar) {
  return (avatar && avatar.trim()) ? avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff`;
}

// 测试用例
const testCases = [
  {
    username: 'admin',
    avatar: '',
    description: '空字符串头像'
  },
  {
    username: 'user1',
    avatar: '   ',
    description: '空格头像'
  },
  {
    username: 'user2',
    avatar: null,
    description: 'null 头像'
  },
  {
    username: 'user3',
    avatar: undefined,
    description: 'undefined 头像'
  },
  {
    username: 'user4',
    avatar: 'https://example.com/avatar.jpg',
    description: '有效头像 URL'
  }
];

console.log('测试头像 URL 生成逻辑:');
console.log('========================================');

testCases.forEach((testCase, index) => {
  const avatarUrl = getAvatarUrl(testCase.username, testCase.avatar);
  console.log(`测试 ${index + 1}: ${testCase.description}`);
  console.log(`  用户名: ${testCase.username}`);
  console.log(`  原始头像: ${JSON.stringify(testCase.avatar)}`);
  console.log(`  生成的 URL: ${avatarUrl}`);
  console.log(`  是否使用默认头像: ${avatarUrl.includes('ui-avatars.com')}`);
  console.log('');
});

console.log('========================================');
console.log('测试完成！');