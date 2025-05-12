import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import puppeteer from 'puppeteer';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 环境变量配置
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PDF_SERVER_PORT || 3001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:3000', 'https://yourdomain.com'];

const app = express();

// 生产环境安全措施
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  
  // 使用限制性CORS配置
  app.use(cors({
    origin: function(origin, callback) {
      // 允许没有origin的请求（如移动应用、curl等）
      if (!origin) return callback(null, true);
      
      if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation'));
      }
    },
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
  }));
} else {
  // 开发环境允许所有跨域请求
  app.use(cors());
}

// 请求体解析
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 基本安全头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 限制请求频率（简单实现）
const requestCounts = {};
app.use((req, res, next) => {
  const clientIP = req.ip;
  
  if (!requestCounts[clientIP]) {
    requestCounts[clientIP] = {
      count: 1,
      lastReset: Date.now()
    };
  } else {
    // 每60秒重置计数
    if (Date.now() - requestCounts[clientIP].lastReset > 60000) {
      requestCounts[clientIP].count = 1;
      requestCounts[clientIP].lastReset = Date.now();
    } else {
      requestCounts[clientIP].count += 1;
    }
    
    // 最多允许每分钟20个请求
    if (requestCounts[clientIP].count > 20) {
      return res.status(429).json({ error: 'Too many requests' });
    }
  }
  
  next();
});

function getCurrentTimeString() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false,
    sanitize: false,
    smartLists: true,
    smartypants: true,
    xhtml: false
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: NODE_ENV });
});

app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { markdown, fileName } = req.body;
        if (!markdown) {
            return res.status(400).json({ error: 'Missing markdown content' });
        }
        
        // 基本验证
        if (markdown.length > 1000000) {
            return res.status(400).json({ error: 'Markdown content too large' });
        }
        
        const sanitizedFileName = (fileName || 'report')
            .replace(/[^a-zA-Z0-9_\-.]/g, '_')
            .substring(0, 100);
        const pdfFileName = sanitizedFileName + '.pdf';
        
        const htmlContent = marked.parse(markdown);
        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Markdown to PDF</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        margin: 40px;
                        color: #333;
                    }
                    h1 { color: #000; font-size: 28px; }
                    h2 { color: #1b7a70; font-size: 24px; }
                    h3 { color: #333; font-size: 20px; }
                    p { margin: 10px 0; }
                    code {
                        background: #f5f5f5;
                        padding: 2px 4px;
                        border-radius: 3px;
                        font-family: monospace;
                    }
                    pre {
                        background: #f5f5f5;
                        padding: 10px;
                        border-radius: 5px;
                        overflow-x: auto;
                    }
                    blockquote {
                        border-left: 4px solid #2DD4BF;
                        padding-left: 10px;
                        color: #555;
                        background: #f9f9f9;
                        margin: 10px 0;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin: 15px 0;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f5f5f5;
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `;

        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();
        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
        const timeStr = getCurrentTimeString();
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: {
                top: '30mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            },
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="width:100%; font-size:10px; color:#888; padding:0 10px; box-sizing:border-box;">
                  <span style="float:left;">Generated By AuditX</span>
                  <span style="float:right;">${timeStr}</span>
                </div>
            `,
            footerTemplate: `
                <div style="width:100%; text-align:center; font-size:10px; color:#888;">
                  Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                </div>
            `
        });
        await browser.close();
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${pdfFileName}"`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (err) {
        console.error('PDF Generation Error:', err);
        res.status(500).json({ 
            error: 'PDF generation failed', 
            detail: NODE_ENV === 'production' ? 'Server error' : err.message 
        });
    }
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Server error',
    detail: NODE_ENV === 'production' ? undefined : err.message
  });
});

app.listen(PORT, () => {
    console.log(`PDF API server running in ${NODE_ENV} mode at http://localhost:${PORT}`);
    console.log(`API Endpoint: http://localhost:${PORT}/api/generate-pdf`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
}); 