// ========================================
// 全球AI科技资讯追踪中心 - 核心逻辑
// ========================================

// 全局状态
let allNews = [];
let filteredNews = [];
let bookmarks = JSON.parse(localStorage.getItem('techNewsBookmarks') || '[]');
let currentCategory = 'all';
let currentView = 'list';
let newsPage = 0;
let earthScene, earthCamera, earthRenderer, earth, earthRotation = true;
let hotspots = []; // 热点标记数组
let raycaster, mouse; // 射线检测和鼠标位置
let hoveredHotspot = null; // 当前悬停的热点
let selectedRegion = null; // 当前选中的地区
const NEWS_PER_PAGE = 20;

// RSS源配置 - 扩展到15+全球媒体
const RSS_SOURCES = {
    // 国内媒体
    '36kr': {
        name: '36氪',
        url: 'https://36kr.com/feed',
        color: '#0080ff',
        region: 'cn',
        location: { lat: 39.9, lon: 116.4 }
    },
    'huxiu': {
        name: '虎嗅',
        url: 'https://www.huxiu.com/rss/0.xml',
        color: '#ff6b00',
        region: 'cn',
        location: { lat: 39.9, lon: 116.4 }
    },
    'tmt': {
        name: '钛媒体',
        url: 'https://www.tmtpost.com/rss',
        color: '#00a0e9',
        region: 'cn',
        location: { lat: 31.2, lon: 121.5 }
    },
    'ithome': {
        name: 'IT之家',
        url: 'https://www.ithome.com/rss/',
        color: '#d32f2f',
        region: 'cn',
        location: { lat: 31.2, lon: 121.5 }
    },
    'mydrivers': {
        name: '快科技',
        url: 'https://news.mydrivers.com/rss',
        color: '#ff5722',
        region: 'cn',
        location: { lat: 30.3, lon: 120.2 }
    },
    'jiqizhixin': {
        name: '机器之心',
        url: 'https://www.jiqizhixin.com/rss',
        color: '#9c27b0',
        region: 'cn',
        location: { lat: 39.9, lon: 116.4 }
    },
    'qbitai': {
        name: '量子位',
        url: 'https://www.qbitai.com/feed',
        color: '#673ab7',
        region: 'cn',
        location: { lat: 39.9, lon: 116.4 }
    },
    'oschina': {
        name: '开源中国',
        url: 'https://www.oschina.net/news/rss',
        color: '#4caf50',
        region: 'cn',
        location: { lat: 31.2, lon: 121.5 }
    },
    // 国际媒体
    'techcrunch': {
        name: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        color: '#0a9e01',
        region: 'us',
        location: { lat: 37.8, lon: -122.4 }
    },
    'theverge': {
        name: 'The Verge',
        url: 'https://www.theverge.com/rss/index.xml',
        color: '#e91e63',
        region: 'us',
        location: { lat: 40.7, lon: -74.0 }
    },
    'wired': {
        name: 'Wired',
        url: 'https://www.wired.com/feed/rss',
        color: '#000000',
        region: 'us',
        location: { lat: 37.8, lon: -122.4 }
    },
    'venturebeat': {
        name: 'VentureBeat',
        url: 'https://venturebeat.com/feed/',
        color: '#ff4081',
        region: 'us',
        location: { lat: 37.4, lon: -122.1 }
    },
    'arstechnica': {
        name: 'Ars Technica',
        url: 'https://feeds.arstechnica.com/arstechnica/index',
        color: '#ff9800',
        region: 'us',
        location: { lat: 41.9, lon: -87.6 }
    },
    'ieee': {
        name: 'IEEE Spectrum',
        url: 'https://spectrum.ieee.org/rss',
        color: '#00bcd4',
        region: 'us',
        location: { lat: 40.7, lon: -74.0 }
    },
    'mit-tech': {
        name: 'MIT Tech Review',
        url: 'https://www.technologyreview.com/feed/',
        color: '#3f51b5',
        region: 'us',
        location: { lat: 42.4, lon: -71.1 }
    }
};

// 分类关键词映射
const CATEGORY_KEYWORDS = {
    'ai': ['AI', '人工智能', '大模型', 'GPT', 'ChatGPT', 'Claude', 'Gemini', '机器学习', '深度学习', '神经网络', 'LLM', 'AGI', 'Artificial Intelligence', 'Machine Learning', 'Deep Learning'],
    'chip': ['芯片', '半导体', 'GPU', 'CPU', 'NVIDIA', 'AMD', 'Intel', '台积电', '制程', '纳米', 'nm', 'Chip', 'Semiconductor', 'Processor'],
    'robot': ['机器人', '人形机器人', '自动化', 'Tesla Bot', 'Optimus', '波士顿动力', '机械臂', 'Robot', 'Humanoid', 'Automation'],
    'auto': ['自动驾驶', '智能汽车', '新能源车', '特斯拉', 'Tesla', '小鹏', '理想', '蔚来', 'L3', 'L4', 'Autonomous', 'Self-driving', 'EV'],
    'space': ['航天', '卫星', '火箭', 'SpaceX', '星链', 'Starlink', 'NASA', '中国航天', '月球', '火星', 'Space', 'Rocket', 'Satellite'],
    'biotech': ['生物科技', '基因编辑', 'CRISPR', '生物制药', '疫苗', 'Biotech', 'Gene', 'Vaccine', 'Biotechnology'],
    'energy': ['新能源', '固态电池', '锂电池', '充电', '储能', 'Battery', 'Energy Storage', 'Solid-state']
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initParticles();
    initEarth();
    initChart();
    loadBookmarks();
    fetchAllNews();
    loadAIStories();
    
    // 定时刷新（每10分钟）
    setInterval(() => {
        fetchAllNews();
        loadAIStories();
    }, 600000);
});

// 初始化应用
function initializeApp() {
    // 搜索功能
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterNews(e.target.value);
    });
    
    // 分类按钮
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            newsPage = 0;
            filterNews();
        });
    });
    
    // 新闻源选择
    document.querySelectorAll('.source-item input').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            newsPage = 0;
            filterNews();
        });
    });
    
    // 视图切换
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            const container = document.getElementById('newsContainer');
            
            if (currentView === 'grid') {
                container.style.display = 'grid';
                container.style.gridTemplateColumns = 'repeat(2, 1fr)';
                container.style.gap = '20px';
            } else if (currentView === 'compact') {
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.gap = '10px';
            } else {
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.gap = '15px';
            }
        });
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
    });
}

// 粒子背景动画
function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particleCanvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-1';
    
    document.getElementById('particles-bg').appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 创建粒子
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 242, 255, ${this.opacity})`;
            ctx.fill();
        }
    }
    
    // 初始化粒子
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle());
    }
    
    // 动画循环
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // 绘制连线
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(0, 242, 255, ${0.1 * (1 - distance / 150)})`;
                    ctx.stroke();
                }
            });
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// 初始化3D地球
function initEarth() {
    const container = document.getElementById('earthContainer');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // 初始化射线检测
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // 创建场景
    earthScene = new THREE.Scene();
    
    // 创建相机
    earthCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    earthCamera.position.z = 2.5;
    
    // 创建渲染器
    earthRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    earthRenderer.setSize(width, height);
    earthRenderer.setClearColor(0x000000, 0);
    container.appendChild(earthRenderer.domElement);
    
    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    earthScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    earthScene.add(directionalLight);
    
    const backLight = new THREE.DirectionalLight(0x00f2ff, 0.3);
    backLight.position.set(-5, -3, -5);
    earthScene.add(backLight);
    
    // 创建地球
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    
    // 创建地球材质 - 使用真实地球纹理
    const textureLoader = new THREE.TextureLoader();
    
    // 使用NASA地球纹理（免费公开）
    const earthTexture = textureLoader.load(
        'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg',
        () => console.log('地球纹理加载成功'),
        undefined,
        () => {
            console.log('地球纹理加载失败，使用渐变色');
            // 失败时使用漂亮的渐变色
            createGradientEarth();
        }
    );
    
    const material = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpScale: 0.05,
        specular: new THREE.Color(0x333333),
        shininess: 5
    });
    
    earth = new THREE.Mesh(geometry, material);
    earthScene.add(earth);
    
    // 添加大气层光晕
    const atmosphereGeometry = new THREE.SphereGeometry(1.15, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                vec3 atmosphere = vec3(0.3, 0.6, 1.0) * intensity;
                gl_FragColor = vec4(atmosphere, intensity * 0.6);
            }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
    });
    
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earthScene.add(atmosphere);
    
    // 添加热点标记
    addHotspots();
    
    // 添加星空背景
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        starPositions.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    earthScene.add(stars);
    
    // 添加鼠标交互事件
    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('click', onMouseClick, false);
    
    // 动画循环
    animateEarth();
}

// 创建渐变色地球（备用方案）
function createGradientEarth() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    
    const vertexShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    
    const fragmentShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            // 漂亮的地球颜色
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            
            // 明亮的海洋和陆地颜色
            vec3 oceanColor = vec3(0.1, 0.4, 0.8);
            vec3 landColor = vec3(0.2, 0.7, 0.3);
            
            // 简单的陆地检测
            float landMask = sin(vPosition.x * 5.0) * sin(vPosition.y * 5.0) * sin(vPosition.z * 5.0);
            vec3 baseColor = mix(oceanColor, landColor, smoothstep(-0.3, 0.3, landMask));
            
            // 添加大气层发光效果
            vec3 atmosphere = vec3(0.3, 0.6, 1.0) * intensity;
            vec3 finalColor = baseColor + atmosphere * 0.3;
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;
    
    const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true
    });
    
    earth = new THREE.Mesh(geometry, material);
    earthScene.add(earth);
}

// 添加热点标记 - 更炫酷的版本
function addHotspots() {
    hotspots = [
        { 
            lat: 39.9, 
            lon: 116.4, 
            color: 0x00f2ff, 
            name: '北京',
            region: 'cn',
            newsCount: 28
        },
        { 
            lat: 31.2, 
            lon: 121.5, 
            color: 0x00f2ff, 
            name: '上海',
            region: 'cn',
            newsCount: 24
        },
        { 
            lat: 37.8, 
            lon: -122.4, 
            color: 0xff006e, 
            name: '硅谷',
            region: 'us',
            newsCount: 35
        },
        { 
            lat: 40.7, 
            lon: -74.0, 
            color: 0xff006e, 
            name: '纽约',
            region: 'us',
            newsCount: 22
        },
        { 
            lat: 51.5, 
            lon: -0.1, 
            color: 0xbd00ff, 
            name: '伦敦',
            region: 'eu',
            newsCount: 18
        },
        { 
            lat: 35.7, 
            lon: 139.7, 
            color: 0x00ff88, 
            name: '东京',
            region: 'asia',
            newsCount: 20
        },
        { 
            lat: 48.9, 
            lon: 2.3, 
            color: 0xbd00ff, 
            name: '巴黎',
            region: 'eu',
            newsCount: 15
        },
        { 
            lat: 37.6, 
            lon: 127.0, 
            color: 0x00ff88, 
            name: '首尔',
            region: 'asia',
            newsCount: 17
        }
    ];
    
    hotspots.forEach((spot, index) => {
        const phi = (90 - spot.lat) * (Math.PI / 180);
        const theta = (spot.lon + 180) * (Math.PI / 180);
        
        const x = -1.05 * Math.sin(phi) * Math.cos(theta);
        const y = 1.05 * Math.cos(phi);
        const z = 1.05 * Math.sin(phi) * Math.sin(theta);
        
        // 创建发光柱体（更像科技感的标记）
        const pillarGeometry = new THREE.CylinderGeometry(0.01, 0.02, 0.15, 8);
        const pillarMaterial = new THREE.MeshBasicMaterial({ 
            color: spot.color,
            transparent: true,
            opacity: 0.8
        });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(x, y, z);
        pillar.lookAt(0, 0, 0);
        pillar.rotateX(Math.PI / 2);
        pillar.userData = { hotspotIndex: index, ...spot };
        earth.add(pillar);
        
        // 创建顶部发光球
        const sphereGeometry = new THREE.SphereGeometry(0.025, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({ 
            color: spot.color,
            transparent: true,
            opacity: 0.9
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(x * 1.08, y * 1.08, z * 1.08);
        sphere.userData = { hotspotIndex: index, ...spot };
        earth.add(sphere);
        
        // 创建外层光晕（脉冲效果）
        const glowGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: spot.color,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(x * 1.08, y * 1.08, z * 1.08);
        glow.userData = { hotspotIndex: index, isGlow: true };
        earth.add(glow);
        
        // 保存热点对象引用
        spot.meshes = { pillar, sphere, glow };
    });
}

// 鼠标移动事件
function onMouseMove(event) {
    const container = document.getElementById('earthContainer');
    const rect = container.getBoundingClientRect();
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // 射线检测
    raycaster.setFromCamera(mouse, earthCamera);
    
    // 检测所有热点标记
    const hotspotMeshes = [];
    earth.traverse((child) => {
        if (child.userData && child.userData.hotspotIndex !== undefined && !child.userData.isGlow) {
            hotspotMeshes.push(child);
        }
    });
    
    const intersects = raycaster.intersectObjects(hotspotMeshes);
    
    if (intersects.length > 0) {
        const intersected = intersects[0].object;
        const hotspotData = hotspots[intersected.userData.hotspotIndex];
        
        if (hoveredHotspot !== hotspotData) {
            // 离开之前的热点
            if (hoveredHotspot && hoveredHotspot.meshes) {
                hoveredHotspot.meshes.sphere.scale.set(1, 1, 1);
                hoveredHotspot.meshes.glow.material.opacity = 0.3;
            }
            
            // 高亮新热点
            hoveredHotspot = hotspotData;
            if (hoveredHotspot.meshes) {
                hoveredHotspot.meshes.sphere.scale.set(1.5, 1.5, 1.5);
                hoveredHotspot.meshes.glow.material.opacity = 0.6;
            }
            
            // 显示提示框
            showHotspotTooltip(event, hotspotData);
        }
        
        container.style.cursor = 'pointer';
    } else {
        // 离开热点
        if (hoveredHotspot && hoveredHotspot.meshes) {
            hoveredHotspot.meshes.sphere.scale.set(1, 1, 1);
            hoveredHotspot.meshes.glow.material.opacity = 0.3;
        }
        hoveredHotspot = null;
        hideHotspotTooltip();
        container.style.cursor = 'grab';
    }
}

// 鼠标点击事件
function onMouseClick(event) {
    if (hoveredHotspot) {
        // 选中的地区
        selectedRegion = hoveredHotspot.region;
        
        // 显示该地区的新闻
        showRegionNews(hoveredHotspot);
        
        // 高亮效果
        highlightSelectedRegion(hoveredHotspot);
    }
}

// 显示热点提示框
function showHotspotTooltip(event, hotspot) {
    let tooltip = document.getElementById('earthTooltip');
    
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'earthTooltip';
        tooltip.className = 'earth-tooltip';
        document.body.appendChild(tooltip);
    }
    
    const regionNames = {
        'cn': '中国',
        'us': '美国',
        'eu': '欧洲',
        'asia': '亚洲'
    };
    
    tooltip.innerHTML = `
        <div class="tooltip-header">
            <span class="tooltip-icon">📍</span>
            <span class="tooltip-title">${hotspot.name}</span>
        </div>
        <div class="tooltip-body">
            <div class="tooltip-row">
                <span class="tooltip-label">地区:</span>
                <span class="tooltip-value">${regionNames[hotspot.region]}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">热度:</span>
                <span class="tooltip-value highlight">${hotspot.newsCount}条资讯</span>
            </div>
        </div>
        <div class="tooltip-footer">
            点击查看该地区资讯
        </div>
    `;
    
    tooltip.style.left = (event.clientX + 15) + 'px';
    tooltip.style.top = (event.clientY + 15) + 'px';
    tooltip.style.display = 'block';
    tooltip.style.opacity = '0';
    
    // 淡入动画
    setTimeout(() => {
        tooltip.style.opacity = '1';
    }, 10);
}

// 隐藏热点提示框
function hideHotspotTooltip() {
    const tooltip = document.getElementById('earthTooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            tooltip.style.display = 'none';
        }, 300);
    }
}

// 显示地区新闻
function showRegionNews(hotspot) {
    const regionSources = {
        'cn': ['36kr', 'huxiu', 'tmt', 'ithome', 'mydrivers', 'jiqizhixin', 'qbitai', 'oschina'],
        'us': ['techcrunch', 'theverge', 'wired', 'venturebeat', 'arstechnica', 'ieee', 'mit-tech'],
        'eu': ['techcrunch', 'wired', 'arstechnica', 'ieee'],
        'asia': ['techcrunch', 'theverge', 'venturebeat']
    };
    
    const sources = regionSources[hotspot.region] || [];
    
    // 更新新闻源选择
    document.querySelectorAll('.source-item input').forEach(checkbox => {
        checkbox.checked = sources.includes(checkbox.dataset.source);
    });
    
    // 显示提示
    const notification = document.createElement('div');
    notification.className = 'region-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">📍</span>
            <span class="notification-text">正在显示 <strong>${hotspot.name}</strong> 地区的资讯...</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
    
    // 刷新新闻
    newsPage = 0;
    filterNews();
    
    // 滚动到新闻区域
    document.getElementById('newsContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 高亮选中的地区
function highlightSelectedRegion(selected) {
    // 重置所有热点
    hotspots.forEach(hotspot => {
        if (hotspot.meshes) {
            hotspot.meshes.pillar.material.opacity = 0.5;
            hotspot.meshes.sphere.material.opacity = 0.6;
        }
    });
    
    // 高亮选中的热点
    if (selected.meshes) {
        selected.meshes.pillar.material.opacity = 1;
        selected.meshes.sphere.material.opacity = 1;
    }
}

// 地球动画
function animateEarth() {
    requestAnimationFrame(animateEarth);
    
    if (earthRotation && earth) {
        earth.rotation.y += 0.002;
    }
    
    // 脉冲动画
    const time = Date.now() * 0.001;
    hotspots.forEach((hotspot, index) => {
        if (hotspot.meshes && hotspot.meshes.glow) {
            const scale = 1 + Math.sin(time * 2 + index) * 0.2;
            hotspot.meshes.glow.scale.set(scale, scale, scale);
        }
    });
    
    if (earthRenderer && earthScene && earthCamera) {
        earthRenderer.render(earthScene, earthCamera);
    }
}

// 切换地球旋转
function toggleEarthRotation() {
    earthRotation = !earthRotation;
    const btn = document.querySelector('.earth-btn');
    btn.classList.toggle('active', earthRotation);
}

// 初始化图表
function initChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(0, 242, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 242, 255, 0)');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            datasets: [{
                label: '新闻数量',
                data: [120, 150, 180, 140, 200, 170, 190],
                borderColor: '#00f2ff',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#00f2ff',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 242, 255, 0.1)'
                    },
                    ticks: {
                        color: '#6b7394',
                        font: {
                            size: 10
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6b7394',
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}

// 获取所有新闻源
async function fetchAllNews() {
    const container = document.getElementById('newsContainer');
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>正在从全球15+新闻源加载资讯...</p>
        </div>
    `;
    
    allNews = [];
    
    try {
        // 首先尝试从本地JSON文件读取
        const response = await fetch('data/news.json');
        
        if (response.ok) {
            const data = await response.json();
            allNews = data.news || [];
            console.log(`从本地JSON加载 ${allNews.length} 条新闻`);
        } else {
            console.warn('本地JSON文件不存在，尝试直接获取RSS');
            // 如果本地文件不存在，回退到直接获取RSS
            await fetchFromRSSDirectly();
        }
        
        console.log('fetchAllNews completed, allNews length:', allNews.length);
        
        // 如果没有获取到任何新闻，添加测试数据
        if (allNews.length === 0) {
            console.warn('未获取到任何新闻，使用测试数据');
            allNews = [
                {
                    title: 'OpenAI冲刺万亿美元IPO，ChatGPT周活破3亿',
                    link: 'https://example.com/1',
                    summary: '测试数据...',
                    source: 'TechCrunch',
                    sourceKey: 'techcrunch',
                    region: 'us',
                    pubDate: new Date(),
                    category: 'ai',
                    thumbnail: ''
                },
                {
                    title: '三星接棒台积电，8英寸氮化镓产线投产',
                    link: 'https://example.com/2',
                    summary: '测试数据...',
                    source: '36氪',
                    sourceKey: '36kr',
                    region: 'cn',
                    pubDate: new Date(Date.now() - 3600000),
                    category: 'chip',
                    thumbnail: ''
                },
                {
                    title: '小鹏L4自动驾驶量产，2026年全自动驾驶到来',
                    link: 'https://example.com/3',
                    summary: '测试数据...',
                    source: '虎嗅',
                    sourceKey: 'huxiu',
                    region: 'cn',
                    pubDate: new Date(Date.now() - 7200000),
                    category: 'auto',
                    thumbnail: ''
                },
                {
                    title: 'SpaceX星舰V3计划3月首飞',
                    link: 'https://example.com/4',
                    summary: '测试数据...',
                    source: 'The Verge',
                    sourceKey: 'theverge',
                    region: 'us',
                    pubDate: new Date(Date.now() - 10800000),
                    category: 'space',
                    thumbnail: ''
                }
            ];
        }
        
        updateStats();
        filterNews();
        renderLatestNews(); // 渲染最新资讯
    } catch (error) {
        console.error('获取新闻失败:', error);
        showError('部分新闻源加载失败，已显示可用内容');
        renderLatestNews(); // 即使失败也尝试渲染
    }
}

// 直接从RSS获取（备用方案）
async function fetchFromRSSDirectly() {
    const selectedSources = getSelectedSources();
    const promises = [];
    
    selectedSources.forEach(source => {
        if (RSS_SOURCES[source]) {
            promises.push(fetchRSSFeed(source));
        }
    });
    
    await Promise.all(promises);
}

// 获取单个RSS源
async function fetchRSSFeed(sourceKey) {
    const source = RSS_SOURCES[sourceKey];
    
    try {
        // 使用RSS2JSON API转换RSS为JSON（免费额度有限）
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.status === 'ok' && data.items) {
            const newsItems = data.items.map(item => ({
                title: item.title,
                link: item.link,
                summary: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '',
                source: source.name,
                sourceKey: sourceKey,
                region: source.region,
                pubDate: new Date(item.pubDate),
                category: categorizeNews(item.title + ' ' + item.description),
                thumbnail: item.thumbnail || ''
            }));
            
            allNews = [...allNews, ...newsItems];
        }
    } catch (error) {
        console.error(`获取${source.name}失败:`, error);
    }
}

// 获取选中的新闻源
function getSelectedSources() {
    const sources = [];
    document.querySelectorAll('.source-item input:checked').forEach(checkbox => {
        sources.push(checkbox.dataset.source);
    });
    return sources;
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

// 过滤新闻
function filterNews(searchQuery = '') {
    const selectedSources = getSelectedSources();
    
    filteredNews = allNews.filter(news => {
        // 分类过滤
        if (currentCategory !== 'all' && news.category !== currentCategory) {
            return false;
        }
        
        // 源过滤
        if (!selectedSources.includes(news.sourceKey)) {
            return false;
        }
        
        // 搜索过滤
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return news.title.toLowerCase().includes(query) || 
                   news.summary.toLowerCase().includes(query);
        }
        
        return true;
    });
    
    // 按时间排序
    filteredNews.sort((a, b) => b.pubDate - a.pubDate);
    
    // 更新分类计数
    updateCategoryCounts();
    
    // 显示新闻
    newsPage = 0;
    displayNews();
}

// 更新分类计数
function updateCategoryCounts() {
    const counts = {
        all: filteredNews.length,
        ai: 0,
        chip: 0,
        robot: 0,
        auto: 0,
        space: 0,
        biotech: 0,
        energy: 0
    };
    
    filteredNews.forEach(news => {
        if (counts.hasOwnProperty(news.category)) {
            counts[news.category]++;
        }
    });
    
    // 更新DOM
    Object.keys(counts).forEach(category => {
        const countEl = document.getElementById(`count-${category}`);
        if (countEl) {
            countEl.textContent = counts[category];
        }
    });
}

// 显示新闻
function displayNews() {
    const container = document.getElementById('newsContainer');
    
    const startIndex = 0;
    const endIndex = (newsPage + 1) * NEWS_PER_PAGE;
    const newsToShow = filteredNews.slice(startIndex, endIndex);
    
    if (newsToShow.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>暂无符合条件的新闻</p>
                <small>尝试调整筛选条件或刷新新闻源</small>
            </div>
        `;
        return;
    }
    
    const newsHTML = newsToShow.map(news => createNewsCard(news)).join('');
    container.innerHTML = newsHTML;
}

// 创建新闻卡片
function createNewsCard(news) {
    const isBookmarked = bookmarks.some(b => b.link === news.link);
    const timeAgo = getTimeAgo(news.pubDate);
    const categoryNames = {
        'ai': 'AI',
        'chip': '芯片',
        'robot': '机器人',
        'auto': '汽车',
        'space': '航天',
        'biotech': '生物',
        'energy': '能源',
        'other': '其他'
    };
    
    const regionEmojis = {
        'cn': '🇨🇳',
        'us': '🇺🇸',
        'eu': '🇪🇺',
        'asia': '🌏'
    };
    
    return `
        <div class="news-card">
            <span class="category-tag">${categoryNames[news.category] || '其他'}</span>
            
            <div class="source">
                <span class="region-flag">${regionEmojis[news.region] || '🌍'}</span>
                <i class="fas fa-rss"></i>
                ${news.source}
            </div>
            
            <h3 onclick="window.open('${news.link}', '_blank')">${news.title}</h3>
            
            <div class="summary">${news.summary}</div>
            
            <div class="meta">
                <div class="time">
                    <i class="far fa-clock"></i>
                    ${timeAgo}
                </div>
                
                <div class="actions">
                    <button class="action-btn" onclick="window.open('${news.link}', '_blank')">
                        <i class="fas fa-external-link-alt"></i> 阅读
                    </button>
                    <button class="action-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark('${encodeURIComponent(JSON.stringify(news))}')">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 加载AI精选资讯
async function loadAIStories() {
    const container = document.getElementById('aiNewsContainer');
    const updateTime = document.getElementById('aiUpdateTime');
    
    try {
        const response = await fetch('./data/ai-news.json');
        let aiNews = [];
        
        if (response.ok) {
            aiNews = await response.json();
        } else {
            aiNews = generateMockAINews();
        }
        
        updateTime.textContent = `更新时间: ${new Date().toLocaleString('zh-CN')}`;
        displayAIStories(aiNews);
    } catch (error) {
        console.error('加载AI精选失败:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>加载AI精选失败</p>
            </div>
        `;
    }
}

// 生成模拟AI资讯
function generateMockAINews() {
    return [
        {
            number: 1,
            title: '中国AI大模型市场规模2026年将达738亿元',
            summary: '年均复合增长率超80%，Token调用量两年增长超千倍，突破140万亿。大模型应用加速落地。',
            tags: ['AI', '大模型', '市场']
        },
        {
            number: 2,
            title: '奇瑞发布犀牛S全固态电池',
            summary: '能量密度600Wh/kg，续航破1500km，2027年量产，续航焦虑终结者来了。',
            tags: ['新能源', '电池', '技术突破']
        },
        {
            number: 3,
            title: '月之暗面启动港股IPO筹备',
            summary: '估值剑指180亿美元，Kimi用户破千万，AI独角兽上市潮来袭。',
            tags: ['AI', 'IPO', '投资']
        },
        {
            number: 4,
            title: 'NVIDIA发布H200芯片',
            summary: '性能比H100提升90%，内存容量翻倍至141GB，AI算力再创新高。',
            tags: ['芯片', 'AI', 'GPU']
        },
        {
            number: 5,
            title: '特斯拉Optimus机器人量产在即',
            summary: '2026年量产目标不变，45个自由度，人形机器人商业化提速。',
            tags: ['机器人', 'AI', '量产']
        }
    ];
}

// 显示AI精选
function displayAIStories(aiNews) {
    const container = document.getElementById('aiNewsContainer');
    
    if (!aiNews || aiNews.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="far fa-newspaper"></i>
                <p>暂无AI精选资讯</p>
            </div>
        `;
        return;
    }
    
    const html = aiNews.map(item => `
        <div class="ai-news-item">
            <div class="number">${item.number}</div>
            <h4>${item.title}</h4>
            <div class="summary">${item.summary}</div>
            <div class="tags">
                ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// 更新统计数据
function updateStats() {
    document.getElementById('totalNews').textContent = allNews.length;
    document.getElementById('activeSources').textContent = Object.keys(RSS_SOURCES).length;
    document.getElementById('lastUpdate').textContent = '刚刚';
    
    // 更新收藏数量
    document.getElementById('bookmarksCount').textContent = bookmarks.length;
}

// 收藏功能
function toggleBookmark(newsJsonStr) {
    const news = JSON.parse(decodeURIComponent(newsJsonStr));
    const index = bookmarks.findIndex(b => b.link === news.link);
    
    if (index > -1) {
        bookmarks.splice(index, 1);
    } else {
        bookmarks.push(news);
    }
    
    localStorage.setItem('techNewsBookmarks', JSON.stringify(bookmarks));
    loadBookmarks();
    displayNews();
    document.getElementById('bookmarksCount').textContent = bookmarks.length;
}

// 加载收藏列表
function loadBookmarks() {
    const container = document.getElementById('bookmarksList');
    
    if (bookmarks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="far fa-bookmark"></i>
                <p>暂无收藏</p>
                <small>点击新闻卡片的收藏按钮即可收藏</small>
            </div>
        `;
        return;
    }
    
    const html = bookmarks.slice(0, 10).map(bookmark => `
        <div class="bookmark-item" onclick="window.open('${bookmark.link}', '_blank')">
            <div style="font-size: 0.9em; font-weight: 600; margin-bottom: 5px; color: var(--text-primary);">
                ${bookmark.title.substring(0, 50)}${bookmark.title.length > 50 ? '...' : ''}
            </div>
            <div style="font-size: 0.75em; color: var(--text-muted);">
                ${bookmark.source} · ${getTimeAgo(bookmark.pubDate)}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// 加载更多新闻
function loadMoreNews() {
    newsPage++;
    displayNews();
}

// 刷新新闻
function refreshNews() {
    allNews = [];
    newsPage = 0;
    fetchAllNews();
    loadAIStories();
}

// 全选/取消全选新闻源
function toggleAllSources() {
    const checkboxes = document.querySelectorAll('.source-item input');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
    
    filterNews();
}

// 切换设置面板
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('active');
}

// 显示错误
function showError(message) {
    const container = document.getElementById('newsContainer');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

// 时间格式化
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
        return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
        return `${diffHours}小时前`;
    } else if (diffDays < 7) {
        return `${diffDays}天前`;
    } else {
        return new Date(date).toLocaleDateString('zh-CN');
    }
}

// 渲染最新资讯
function renderLatestNews() {
    console.log('=== renderLatestNews 开始执行 ===');
    
    const container = document.getElementById('latestNewsContainer');
    const updateTime = document.getElementById('latestUpdateTime');
    
    console.log('container:', container);
    console.log('updateTime:', updateTime);
    console.log('allNews length:', allNews.length);
    console.log('allNews sample:', allNews.slice(0, 2));
    
    if (!container || !updateTime) {
        console.error('找不到容器元素！');
        return;
    }
    
    if (!allNews || allNews.length === 0) {
        console.log('allNews为空，显示空状态');
        container.innerHTML = `
            <div class="empty-state" style="grid-column: span 2;">
                <i class="fas fa-newspaper"></i>
                <p>暂无最新资讯，请检查新闻源是否正常</p>
            </div>
        `;
        return;
    }
    
    // 按时间排序，取最新的4条
    const latestNews = allNews
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 4);
    
    console.log('latestNews:', latestNews);
    
    updateTime.textContent = `更新时间: ${new Date().toLocaleString('zh-CN')}`;
    
    const categoryNames = {
        'ai': 'AI',
        'chip': '芯片',
        'robot': '机器人',
        'auto': '汽车',
        'space': '航天',
        'biotech': '生物',
        'energy': '能源',
        'other': '其他'
    };
    
    const regionEmojis = {
        'cn': '🇨🇳',
        'us': '🇺🇸',
        'eu': '🇪🇺',
        'asia': '🌏'
    };
    
    container.innerHTML = latestNews.map((news, index) => `
        <div class="latest-news-card" onclick="window.open('${news.link}', '_blank')">
            <div class="latest-news-header">
                <div class="latest-news-number">${index + 1}</div>
                <div class="latest-news-title">${news.title}</div>
            </div>
            <div class="latest-news-meta">
                <div class="latest-news-source">
                    <i class="fas fa-rss"></i>
                    <span>${regionEmojis[news.region] || '🌍'} ${news.source}</span>
                </div>
                <div class="latest-news-time">
                    <i class="far fa-clock"></i>
                    <span>${getTimeAgo(news.pubDate)}</span>
                </div>
                <span class="latest-news-tag">${categoryNames[news.category] || '其他'}</span>
            </div>
        </div>
    `).join('');
}
