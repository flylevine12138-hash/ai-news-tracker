const https = require('https');
const fs = require('fs');
const path = require('path');

// RSS源配置
const RSS_SOURCES = {
    // 国内媒体
    '36kr': { name: '36氪', url: 'https://36kr.com/feed', region: 'cn' },
    'huxiu': { name: '虎嗅', url: 'https://www.huxiu.com/rss/0.xml', region: 'cn' },
    'tmt': { name: '钛媒体', url: 'https://www.tmtpost.com/rss', region: 'cn' },
    'ithome': { name: 'IT之家', url: 'https://www.ithome.com/rss/', region: 'cn' },
    'mydrivers': { name: '快科技', url: 'https://news.mydrivers.com/rss.asp', region: 'cn' },
    'jiqizhixin': { name: '机器之心', url: 'https://www.jiqizhixin.com/rss', region: 'cn' },
    'qbitai': { name: '量子位', url: 'https://www.qbitai.com/feed', region: 'cn' },
    'oschina': { name: '开源中国', url: 'https://www.oschina.net/news/rss', region: 'cn' },
    
    // 国际媒体
    'techcrunch': { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', region: 'us' },
    'theverge': { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', region: 'us' },
    'wired': { name: 'Wired', url: 'https://www.wired.com/feed/rss', region: 'us' },
    'venturebeat': { name: 'VentureBeat', url: 'https://venturebeat.com/feed/', region: 'us' },
    'arstechnica': { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', region: 'us' },
    'ieee': { name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/rss', region: 'us' },
    'mit-tech': { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', region: 'us' }
};

// 分类关键词
const CATEGORY_KEYWORDS = {
    ai: ['ai', '人工智能', '机器学习', '深度学习', 'gpt', 'llm', 'openai', 'anthropic', 'claude', 'gemini', '神经网络', '大模型', 'chatgpt', 'copilot'],
    chip: ['芯片', '半导体', 'gpu', 'cpu', 'nvidia', 'amd', 'intel', '台积电', '制程', '芯片制造', '晶圆'],
    robot: ['机器人', '人形机器人', 'optimus', 'atlas', '机器人公司', '机器人技术', '仿生机器人'],
    auto: ['自动驾驶', '电动车', '特斯拉', 'fsd', '新能源汽车', '智能汽车', '无人驾驶', '电动车续航'],
    space: ['spacex', '星舰', '航天', '火箭', '卫星', 'nasa', '火星', '登月', '航天器'],
    biotech: ['生物科技', '基因编辑', 'crispr', '疫苗', '生物医药', '临床试验'],
    energy: ['电池', '固态电池', '充电', '储能', '锂电池', '钠离子电池', '氢能', '核聚变'],
    other: []
};

// HTTP GET请求
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// 通过RSS2JSON API获取RSS
async function fetchRSS(sourceKey) {
    const source = RSS_SOURCES[sourceKey];
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
    
    try {
        const response = await httpsGet(apiUrl);
        const data = JSON.parse(response);
        
        if (data.status === 'ok' && data.items) {
            return data.items.map(item => ({
                title: item.title,
                link: item.link,
                summary: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '',
                source: source.name,
                sourceKey: sourceKey,
                region: source.region,
                pubDate: item.pubDate,
                category: categorizeNews(item.title + ' ' + item.description),
                thumbnail: item.thumbnail || ''
            }));
        }
    } catch (error) {
        console.error(`获取${source.name}失败:`, error.message);
    }
    
    return [];
}

// 新闻分类
function categorizeNews(text) {
    if (!text) return 'other';
    text = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
            return category;
        }
    }
    
    return 'other';
}

// 主函数
async function main() {
    console.log('开始获取新闻...');
    
    const allNews = [];
    const sourceKeys = Object.keys(RSS_SOURCES);
    
    // 并行获取所有源
    const promises = sourceKeys.map(key => fetchRSS(key));
    const results = await Promise.all(promises);
    
    results.forEach(newsItems => {
        allNews.push(...newsItems);
    });
    
    // 按时间排序
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    console.log(`共获取 ${allNews.length} 条新闻`);
    
    // 确保data目录存在
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 保存为JSON
    const outputPath = path.join(dataDir, 'news.json');
    const outputData = {
        updateTime: new Date().toISOString(),
        total: allNews.length,
        news: allNews
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    console.log(`新闻已保存到 ${outputPath}`);
}

main().catch(console.error);
