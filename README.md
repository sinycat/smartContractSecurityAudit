# `AuditX`

----------------------------------------

## AuditX is an AI-powered smart contract security analysis platform that leverages multiple AI models to provide comprehensive security audits for blockchain contracts.

----------------------------------------

![image](/imgs/home.png)

----------------------------------------


## Features

### 🛡️ Security Analysis
- Comprehensive vulnerability detection
- Smart contract security risk assessment
- Real-time security analysis

### ⚡ Gas Optimization
- Transaction cost analysis
- Gas usage optimization suggestions
- Performance improvement recommendations

### 📊 AI-Powered Reports
- Detailed security audit reports
- Multiple AI models analysis
- Clear and actionable insights
- High-quality PDF export with headers and footers

### 🔄 Multi-Model Support
- OpenAI GPT
- Anthropic Claude
- Google Gemini
- xAI Grok
- More models coming soon

### 🌐 Multi-Chain Support
- Ethereum
- Base
- Arbitrum
- Optimism
- BSC
- Polygon
- Avalanche-C
- Aurora
- Solana
- More chains coming soon

### 🚀 Super Prompt
- Enhanced analysis capabilities
- Specialized security prompts
- Deeper security insights

## Getting Started

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sinycat/smartContractSecurityAudit.git
   cd smartContractSecurityAudit
   ```

2. **Environment Variables**:
   - Create a `.env.local` file in the project root
   - Fill in your API keys (see Environment Variables section below)

3. **Install dependencies**:
   ```bash
   npm install
   # or 
   yarn 
   # or 
   bun install
   ```

4. **Install PDF service dependencies**:
   ```bash
   cd src/server
   npm install
   cd ../..
   ```

5. **Start the development servers**:
   
   Option 1: Start both frontend and PDF service together
   ```bash
   npm run dev:all  # Starts both frontend and PDF service
   ```
   
   Option 2: Start services separately
   ```bash
   # Terminal 1 - Start frontend
   npm run dev
   
   # Terminal 2 - Start PDF service
   npm run pdf-server
   ```

6. **Access the application**:
   - Frontend: `http://localhost:3000`
   - PDF Service API: `http://localhost:3001/api/generate-pdf`

### Production Deployment

There are two main methods to deploy the application to production: Direct server deployment or Docker deployment.

#### Method 1: Direct Server Deployment

1. **Server Requirements**:
   - Node.js v16+ (v18 LTS recommended)
   - NPM or Yarn
   - For PDF service: Required system libraries for Puppeteer

2. **Install Puppeteer Dependencies** (on Ubuntu/Debian):
   ```bash
   sudo apt-get update
   sudo apt-get install -y ca-certificates fonts-liberation \
     libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 \
     libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
     libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
     libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
     libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
     libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
     libxtst6 lsb-release wget xdg-utils
   ```

3. **Build the Application**:
   ```bash
   # Install production dependencies
   npm ci --omit=dev
   
   # Install PDF service dependencies
   cd src/server
   npm ci
   cd ../..
   
   # Build the Next.js application
   npm run build
   ```

4. **Start the Production Services**:
   ```bash
   # Option 1: Start both services together
   npm run start:all
   
   # Option 2: Start services separately
   # Terminal 1
   npm run start
   
   # Terminal 2
   npm run start:pdf-server
   ```

5. **Using Process Manager (recommended)**:
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start services
   pm2 start npm --name "frontend" -- run start
   pm2 start npm --name "pdf-server" -- run start:pdf-server
   
   # Set PM2 to start on system boot
   pm2 startup
   pm2 save
   ```

#### Method 2: Docker Deployment (Recommended)

1. **Requirements**:
   - Docker
   - Docker Compose

2. **Build and Run**:
   ```bash
   # Build and start containers
   docker-compose up -d
   ```

3. **Services**:
   - Frontend: exposed on port 3000
   - PDF Service: exposed on port 3001 (internal communication)

4. **Docker Configuration**:
   - The project includes a `Dockerfile` and `docker-compose.yml` that handle all dependencies
   - The Docker setup automatically installs all required libraries for Puppeteer
   - Environment variables can be configured in the `docker-compose.yml` file

5. **Scaling (optional)**:
   ```bash
   # Scale the service if needed
   docker-compose up -d --scale auditx=2
   ```

#### Setting Up Nginx as Reverse Proxy

It's recommended to use Nginx as a reverse proxy in production to handle SSL termination and routing:

1. **Install Nginx**:
   ```bash
   sudo apt-get install nginx
   ```

2. **Configure Nginx**:
   Create a configuration file like `/etc/nginx/sites-available/auditx`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name yourdomain.com;

       # SSL Configuration
       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
       ssl_protocols TLSv1.2 TLSv1.3;

       # Frontend
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # PDF Generation API
       location /api/generate-pdf {
           proxy_pass http://localhost:3001/api/generate-pdf;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           
           # Increase timeouts for PDF generation
           proxy_read_timeout 300;
           proxy_connect_timeout 300;
           proxy_send_timeout 300;
           
           # Increase request body size limit
           client_max_body_size 10M;
       }
   }
   ```

3. **Enable Configuration**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/auditx /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **SSL Certificate** (using Certbot):
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## Project Structure

```
src/
├── app/                   # Next.js app directory
│   ├── api/               # API routes
│   │   ├── contract-info/ # Contract information API
│   │   └── source/        # Source code retrieval API
│   ├── audit/             # Audit related pages
│   │   ├── analyze/       # Analysis page
│   │   └── source/        # Source code viewer page
│   ├── fonts/             # Font files
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Main layout component
│   └── page.tsx           # Homepage
├── components/            # Reusable components
│   ├── audit/             # Audit related components
│   ├── ErrorBoundary.tsx  # Error boundary component
│   ├── Icons.tsx          # Icon components
│   └── Sidebar.tsx        # Sidebar component
├── server/                # PDF Generation service
│   ├── server.js          # Express server for PDF generation
│   └── package.json       # PDF server dependencies
├── services/              # Service layer
│   └── audit/             # Audit related services
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
    ├── blockchain.ts      # Blockchain interaction utilities
    ├── chainServices.ts   # Chain service utilities
    ├── constants.ts       # Constants definitions
    ├── ai.ts              # AI related utilities
    └── other utility files...
```

## Environment Variables

Configure the following environment variables in your `.env.local` file:

```
# Blockchain Explorer API Keys (for retrieving contract source code)
NEXT_PUBLIC_ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
NEXT_PUBLIC_ARBISCAN_API_KEY=YOUR_ARBISCAN_API_KEY
NEXT_PUBLIC_BSCSCAN_API_KEY=YOUR_BSCSCAN_API_KEY
NEXT_PUBLIC_BASESCAN_API_KEY=YOUR_BASESCAN_API_KEY
NEXT_PUBLIC_OPTIMISM_API_KEY=YOUR_OPTIMISTIC_ETHERSCAN_API_KEY
NEXT_PUBLIC_POLYGONSCAN_API_KEY=YOUR_POLYGONSCAN_API_KEY

# RPC URL Configuration (for blockchain node connections)
NEXT_PUBLIC_ETH_RPC_URL=YOUR_ETH_RPC_URL
NEXT_PUBLIC_ARBITRUM_RPC_URL=YOUR_ARBITRUM_RPC_URL
NEXT_PUBLIC_BSC_RPC_URL=YOUR_BSC_RPC_URL
NEXT_PUBLIC_BASE_RPC_URL=YOUR_BASE_RPC_URL
NEXT_PUBLIC_OPTIMISM_RPC_URL=YOUR_OPTIMISM_RPC_URL
NEXT_PUBLIC_SOLANA_RPC_URL=YOUR_SOLANA_RPC_URL

# PDF Service Configuration
NODE_ENV=production       # Set to 'development' for local development
PDF_SERVER_PORT=3001      # Port for PDF generation service
```

## Key Dependencies

### Frontend (Next.js Application)
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Ethers.js (Ethereum interactions)
- @solana/web3.js (Solana interactions)
- Marked (Markdown parsing)
- React-hot-toast (Notifications)

### PDF Generation Service
- Express (Backend server)
- Puppeteer (Headless browser for PDF generation)
- Marked (Markdown to HTML conversion)
- Cors (Cross-origin resource sharing)

## Ports
- Frontend: 3000
- PDF Service: 3001

## Usage

1. Visit the platform at `http://localhost:3000` (development) or your domain
2. Input your smart contract address
3. Select the blockchain network
4. Choose AI models for analysis
5. Get comprehensive security analysis and recommendations
6. Download the analysis as a PDF by clicking "Save as PDF" button

## Troubleshooting

### PDF Generation Issues
- **PDF not generating**: Ensure the PDF service is running on port 3001
- **Missing elements in PDF**: Check browser console for errors and ensure the Markdown content is valid
- **Service not starting**: Verify all Puppeteer dependencies are installed

### Docker Issues
- **Container not starting**: Check Docker logs with `docker-compose logs`
- **Memory errors**: Increase container memory allocation in docker-compose.yml

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE)

## version history
----------------------------------------
####  V2 完整运行 测试以太坊功能 初步添加Solana功能
####  V3 完整运行 比上一版增加了获取https://explorer.solana.com/ 上源码的功能
####  V4 完整运行 已可以正常获取Solana的Github源码
####  V5 运行正常. 已实现大部分UI的改造.
####  V6 运行正常. 增加下载为PDF功能.可成功生成pdf,但存在问题.
####  V7 运行正常. 已基本实现UI的改造.
####  V8 运行正常. 已基本实现UI的改造.修改PDF功能.
####  V8.2 运行正常. 修改了 local:3000/audit页面的宽度.
####  V8.3 运行正常. 修改了个别PDF报告生成后背景色黑色的问题.
####  V8.4 运行正常. 解决了以太坊链abi显示为空的问题.
####  V8.5 运行正常. solana链的合约的idl内容也可以显示了,但是名字是abi.json.
####  V8.6 运行正常. 已解决solana合约idl.json显示为abi.json的问题.
####  V8.7 运行正常. 添加Solana合约的README.md文件显示文件树结构成功.
####  V8.8 运行正常. 完全改造PDF生成方式，使用后端服务生成高质量PDF报告，支持页眉页脚和分页。


