import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }
  
  console.log(`代理请求: ${url}`);
  
  try {
    // 添加类似浏览器的请求头，避免被网站阻止
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': new URL(url).origin
    };
    
    // 发送请求到目标URL
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.log(`代理请求失败: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch from URL: ${response.status}` },
        { status: response.status }
      );
    }
    
    // 检查响应的内容类型
    const contentType = response.headers.get('content-type') || '';
    
    // 处理不同类型的响应
    if (contentType.includes('application/json')) {
      // JSON数据
      const data = await response.json();
      return NextResponse.json(data);
    } else if (contentType.includes('text/html')) {
      // HTML内容 - 尝试从中提取IDL
      const html = await response.text();
      
      // 尝试从HTML中提取IDL数据
      if (url.includes('solscan.io') && url.includes('anchorProgramIdl')) {
        // 尝试提取IDL数据
        const idlMatch = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
        if (idlMatch && idlMatch[1]) {
          try {
            const nextData = JSON.parse(idlMatch[1]);
            // 从next.js数据中提取IDL
            const idlData = nextData?.props?.pageProps?.programIdl;
            if (idlData) {
              console.log(`成功从Solscan网页提取IDL数据`);
              return NextResponse.json({ success: true, idl: idlData });
            }
          } catch (e) {
            console.error(`解析Next.js数据失败:`, e);
          }
        }
        
        // 尝试从全局变量中提取
        const jsonMatch = html.match(/window\.__PROGRAM_IDL__\s*=\s*({[\s\S]*?});/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const idlData = JSON.parse(jsonMatch[1]);
            console.log(`成功从Solscan全局变量提取IDL`);
            return NextResponse.json({ success: true, idl: idlData });
          } catch (e) {
            console.error(`解析全局变量数据失败:`, e);
          }
        }
      }
      
      // 如果无法提取特定数据，则返回整个HTML
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    } else {
      // 其他类型的内容，直接传递
      const data = await response.arrayBuffer();
      return new Response(data, {
        headers: {
          'Content-Type': contentType
        }
      });
    }
  } catch (error) {
    console.error('代理请求出错:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    );
  }
} 