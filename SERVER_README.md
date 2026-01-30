# Mental Math Master - 后端服务器文档

## 架构说明

本后端服务器参考了 **FogChess** 和 **QuantumGo** 的架构设计，采用以下技术栈：

- **Node.js + Express** - RESTful API 服务器
- **MongoDB + Mongoose** - 数据持久化
- **JWT** - 用户认证
- **bcryptjs** - 密码加密

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mental-math-master
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:8080
```

### 3. 启动 MongoDB

确保 MongoDB 正在运行：

```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

### 4. 初始化数据库

```bash
npm run init-db
```

### 5. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:3001` 启动

## API 端点

### 认证 (Authentication)

#### 注册新用户
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123",
  "language": "zh"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 创建访客会话
```http
POST /api/auth/guest
```

### 用户管理 (Users)

#### 获取当前用户信息
```http
GET /api/users/me
Authorization: Bearer <token>
```

#### 更新用户资料
```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "新昵称",
  "language": "zh"
}
```

#### 更新用户偏好设置
```http
PUT /api/users/me/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetAccuracy": 0.75,
  "maxDifficulty": 5,
  "hintPreference": "adaptive"
}
```

### 学习进度 (Progress)

#### 获取所有课程进度
```http
GET /api/progress
Authorization: Bearer <token>
```

#### 获取特定课程进度
```http
GET /api/progress/:lessonId
Authorization: Bearer <token>
```

#### 记录练习尝试
```http
POST /api/progress/:lessonId/attempt
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "120 - 19 - 8 - 1",
  "answer": 92,
  "userAnswer": 92,
  "correct": true,
  "timeSpent": 5.2,
  "difficulty": 4,
  "hintUsed": false,
  "reward": 1.5,
  "sessionId": "session_123"
}
```

#### 更新间隔重复数据
```http
PUT /api/progress/:lessonId/spaced-repetition
Authorization: Bearer <token>
Content-Type: application/json

{
  "correct": true
}
```

#### 获取待复习课程
```http
GET /api/progress/reviews/due
Authorization: Bearer <token>
```

### 分析统计 (Analytics)

#### 获取学习洞察和建议
```http
GET /api/analytics/insights
Authorization: Bearer <token>
```

#### 获取性能历史记录
```http
GET /api/analytics/history?limit=30&lessonId=b1
Authorization: Bearer <token>
```

#### 获取图表数据
```http
GET /api/analytics/chart-data
Authorization: Bearer <token>
```

### 课程信息 (Lessons)

#### 获取所有课程信息
```http
GET /api/lessons
```

#### 获取特定课程信息
```http
GET /api/lessons/:lessonId
```

## 数据模型

### User (用户)
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  displayName: String,
  avatar: String,
  language: 'en' | 'zh',
  totalSessions: Number,
  totalQuestions: Number,
  totalCorrect: Number,
  preferences: {
    targetAccuracy: Number,
    maxDifficulty: Number,
    hintPreference: 'never' | 'adaptive' | 'always'
  }
}
```

### LessonProgress (课程进度)
```javascript
{
  userId: ObjectId,
  lessonId: String,
  attempts: Number,
  correct: Number,
  avgTime: Number,
  currentDifficulty: Number,
  masteryScore: Number,
  spacedRepetition: {
    interval: Number,
    easeFactor: Number,
    nextReview: Date,
    repetitions: Number
  },
  banditArms: Map<String, ArmStats>,
  hintUsageCount: Number,
  lastPracticed: Date
}
```

### PerformanceHistory (性能历史)
```javascript
{
  userId: ObjectId,
  lessonId: String,
  question: String,
  answer: Number,
  userAnswer: Number,
  correct: Boolean,
  timeSpent: Number,
  difficulty: Number,
  hintUsed: Boolean,
  attemptNumber: Number,
  sessionId: String,
  reward: Number,
  timestamp: Date
}
```

## 核心功能

### 1. 自适应学习引擎
- **Contextual Bandit 算法**：Thompson Sampling 选择最优难度
- **多目标奖励系统**：平衡准确率、速度和学习进度
- **实时难度调整**：基于用户表现动态调整

### 2. 间隔重复系统
- **SM-2 算法**：优化记忆保持
- **自动复习调度**：在最佳时间点插入复习
- **易度因子调整**：根据回忆成功率调整间隔

### 3. 数据分析
- **学习洞察**：识别强项和弱项
- **进步追踪**：计算改进率
- **AI 推荐**：个性化学习建议

### 4. 用户认证
- **JWT Token**：安全的无状态认证
- **密码加密**：bcrypt 哈希
- **访客模式**：无需注册即可体验

## 安全特性

- **Helmet.js** - HTTP 头安全
- **CORS** - 跨域资源共享控制
- **Rate Limiting** - API 速率限制
- **Input Validation** - 输入验证
- **Password Hashing** - 密码加密存储

## 性能优化

- **Compression** - Gzip 压缩
- **Database Indexing** - 数据库索引优化
- **TTL Indexes** - 自动清理旧数据
- **Lean Queries** - 优化查询性能

## 部署建议

### 生产环境配置

1. **使用环境变量**管理敏感信息
2. **启用 HTTPS**
3. **配置反向代理**（Nginx/Apache）
4. **设置数据库备份**
5. **启用日志记录**
6. **配置监控和告警**

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

### MongoDB Atlas 云数据库

推荐使用 MongoDB Atlas 作为生产数据库：

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mental-math-master
```

## 测试

```bash
# 运行测试（待实现）
npm test

# 测试覆盖率
npm run coverage
```

## 故障排查

### 常见问题

1. **MongoDB 连接失败**
   - 检查 MongoDB 是否运行
   - 验证 MONGODB_URI 配置

2. **JWT 验证失败**
   - 确认 JWT_SECRET 配置正确
   - 检查 token 是否过期

3. **CORS 错误**
   - 验证 CORS_ORIGIN 配置
   - 检查前端请求头

## 参考项目

- **FogChess**: https://github.com/DeepBrainTech/FogChess
- **QuantumGo**: https://github.com/DeepBrainTech/QuantumGo

## 许可证

MIT License

## 技术支持

如有问题，请提交 Issue 或联系开发团队。
