import type { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: '请提供有效的抖音视频URL' });
  }

  try {
    console.log('开始解析抖音视频URL:', url);

    // 尝试使用第三方解析服务
    const parseServices = [
      // 服务1：使用通用的抖音解析API
      `https://api.douyin.wtf/api?url=${encodeURIComponent(url)}`,
      // 服务2：使用另一个解析服务
      `https://douyin.wtf/api?url=${encodeURIComponent(url)}`,
    ];

    for (const serviceUrl of parseServices) {
      try {
        console.log('尝试解析服务:', serviceUrl);
        const response = await fetch(serviceUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('解析服务返回数据:', JSON.stringify(data));

          // 尝试从不同的响应格式中提取视频URL
          let videoUrl = '';
          
          if (data.data && data.data.video_url) {
            videoUrl = data.data.video_url;
          } else if (data.data && data.data.url) {
            videoUrl = data.data.url;
          } else if (data.video_url) {
            videoUrl = data.video_url;
          } else if (data.url) {
            videoUrl = data.url;
          } else if (data.play_url) {
            videoUrl = data.play_url;
          }

          if (videoUrl) {
            console.log('成功提取视频URL:', videoUrl);
            return res.json({ 
              success: true,
              videoUrl: videoUrl,
              originalUrl: url 
            });
          }
        }
      } catch (serviceError) {
        console.error('解析服务失败:', serviceError);
        continue;
      }
    }

    // 如果所有第三方服务都失败，返回原始URL
    console.log('所有解析服务都失败');
    return res.json({ 
      success: false,
      message: '无法解析抖音视频URL，请检查链接是否有效',
      originalUrl: url 
    });

  } catch (error) {
    console.error('解析抖音视频失败:', error);
    return res.status(500).json({ 
      message: '解析抖音视频失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export default handler;