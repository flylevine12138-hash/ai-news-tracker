# AI科技资讯追踪网站

实时追踪全球AI科技资讯的现代化网站，支持多源聚合、智能分类、搜索收藏等功能。

## 🌟 核心功能

### ✨ 自动聚合多源新闻
- **36氪** - 创投资讯
- **虎嗅** - 科技商业
- **TechCrunch** - 国际科技
- **AI精选** - 每小时AI生成精选

### 🎯 智能分类
- AI人工智能
- 芯片半导体
- 机器人
- 自动驾驶
- 航天科技

### 🔍 强大功能
- **实时搜索** - 快速定位感兴趣的新闻
- **分类筛选** - 按领域过滤新闻
- **收藏管理** - 本地收藏喜欢的文章
- **双视图模式** - 列表/网格切换

## 🚀 快速开始

### 本地预览
```bash
# 进入项目目录
cd ai-news-tracker

# 使用Python启动本地服务器
python -m http.server 8000

# 或使用Node.js
npx serve
```

访问 `http://localhost:8000` 即可预览

### Vercel部署

#### 方式1：通过Vercel CLI
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录并部署
vercel login
vercel --prod
```

#### 方式2：通过GitHub自动部署
1. 将项目推送到GitHub仓库
2. 访问 [vercel.com](https://vercel.com)
3. 导入GitHub仓库
4. 点击Deploy即可

## 📁 项目结构

```
ai-news-tracker/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # 核心逻辑
├── vercel.json         # Vercel配置
├── README.md           # 说明文档
└── data/
    └── ai-news.json    # AI精选数据
```

## 🔧 技术栈

- **前端**: 纯HTML/CSS/JavaScript
- **RSS解析**: RSS2JSON API
- **部署**: Vercel
- **存储**: LocalStorage（收藏功能）

## 📊 数据更新

- **RSS源**: 每5分钟自动刷新
- **AI精选**: 每小时更新一次
- **手动刷新**: 点击刷新按钮

## 🎨 特色

- 🌙 深色主题，护眼设计
- 📱 完全响应式，支持移动端
- ⚡ 轻量级，加载快速
- 🔒 无需后端，纯静态部署

## 📝 自定义配置

### 添加新的RSS源
编辑 `script.js` 中的 `RSS_SOURCES` 对象：

```javascript
const RSS_SOURCES = {
    'your-source': {
        name: '新闻源名称',
        url: 'https://example.com/feed',
        color: '#ff0000'
    }
};
```

### 修改分类关键词
编辑 `CATEGORY_KEYWORDS` 对象添加新的分类规则。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

---

**Powered by AI** | Made with ❤️ by 瓦力
