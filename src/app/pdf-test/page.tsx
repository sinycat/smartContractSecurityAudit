"use client";

import { useState, useEffect } from "react";
import { marked } from "marked";

export default function PdfTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testContent, setTestContent] = useState(`
# 测试标题

## 这是一个二级标题

这是一个普通段落，用于测试文本渲染。这里有一些**粗体**和*斜体*文本。

### 代码示例

\`\`\`js
function test() {
  console.log("Hello World");
}
\`\`\`

- 列表项1
- 列表项2
- 列表项3

> 这是一段引用文本
`);

  const log = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const test1_BasicRendering = () => {
    log("测试1开始：基本渲染");
    
    const contentElement = document.getElementById("test-content");
    if (!contentElement) {
      log("错误：找不到内容元素");
      return;
    }
    
    log("获取内容元素成功");
    
    // @ts-expect-error - window.html2canvas 从动态加载的脚本中获取
    window.html2canvas(contentElement, {
      scale: 2,
      logging: true,
      backgroundColor: 'white'
    }).then((canvas: HTMLCanvasElement) => {
      log(`Canvas生成成功，尺寸：${canvas.width}x${canvas.height}`);
      
      // 显示生成的canvas
      canvas.style.maxWidth = '100%';
      canvas.style.border = '1px solid #ccc';
      
      const container = document.getElementById("result-container");
      if (container) {
        container.innerHTML = '';
        container.appendChild(canvas);
      }
      
      log("测试1完成：Canvas已添加到页面");
    }).catch((error: Error) => {
      log(`错误：${error.message}`);
    });
  };

  const test2_StyledRendering = () => {
    log("测试2开始：带样式渲染");
    
    const contentElement = document.getElementById("test-content");
    if (!contentElement) {
      log("错误：找不到内容元素");
      return;
    }
    
    // 强制设置所有文本颜色
    const allElements = contentElement.querySelectorAll('*');
    allElements.forEach(el => {
      (el as HTMLElement).style.color = '#000000';
      
      if (el.tagName === 'H1') {
        (el as HTMLElement).style.color = '#000000';
        (el as HTMLElement).style.fontSize = '28px';
      } else if (el.tagName === 'H2') {
        (el as HTMLElement).style.color = '#1b7a70';
        (el as HTMLElement).style.fontSize = '24px';
      } else if (el.tagName === 'P') {
        (el as HTMLElement).style.color = '#333333';
        (el as HTMLElement).style.fontSize = '16px';
      } else if (el.tagName === 'CODE' || el.tagName === 'PRE') {
        (el as HTMLElement).style.color = '#333333';
        (el as HTMLElement).style.fontSize = '15px';
      }
    });
    
    log("应用样式完成");
    
    // @ts-expect-error - window.html2canvas 从动态加载的脚本中获取
    window.html2canvas(contentElement, {
      scale: 3,
      logging: true,
      backgroundColor: 'white',
      onclone: (clonedDoc: Document) => {
        log("开始处理克隆文档");
        const elements = clonedDoc.querySelectorAll('#test-content *');
        elements.forEach(el => {
          const existingStyle = el.getAttribute('style') || '';
          el.setAttribute('style', existingStyle + '; font-family: Arial, Helvetica, sans-serif !important; font-weight: normal !important; color: #000000 !important;');
          
          if (el.tagName === 'H1') {
            el.setAttribute('style', existingStyle + '; font-size: 28px !important; color: #000000 !important;');
          } else if (el.tagName === 'H2') {
            el.setAttribute('style', existingStyle + '; font-size: 24px !important; color: #1b7a70 !important;');
          } else if (el.tagName === 'P') {
            el.setAttribute('style', existingStyle + '; font-size: 16px !important; color: #333333 !important;');
          } else if (el.tagName === 'CODE' || el.tagName === 'PRE') {
            el.setAttribute('style', existingStyle + '; font-size: 15px !important; color: #333333 !important;');
          }
        });
        log("克隆文档处理完成");
      }
    }).then((canvas: HTMLCanvasElement) => {
      log(`Canvas生成成功，尺寸：${canvas.width}x${canvas.height}`);
      
      // 显示生成的canvas
      canvas.style.maxWidth = '100%';
      canvas.style.border = '1px solid #ccc';
      
      const container = document.getElementById("result-container");
      if (container) {
        container.innerHTML = '';
        container.appendChild(canvas);
      }
      
      log("测试2完成：Canvas已添加到页面");
    }).catch((error: Error) => {
      log(`错误：${error.message}`);
    });
  };

  const test3_CompletePdf = () => {
    log("测试3开始：完整PDF生成");
    
    const contentElement = document.getElementById("test-content");
    if (!contentElement) {
      log("错误：找不到内容元素");
      return;
    }
    
    // @ts-expect-error - window.html2canvas 从动态加载的脚本中获取
    window.html2canvas(contentElement, {
      scale: 4,
      logging: true,
      backgroundColor: 'white',
      letterRendering: true,
      onclone: (clonedDoc: Document) => {
        log("开始处理克隆文档");
        const elements = clonedDoc.querySelectorAll('#test-content *');
        elements.forEach(el => {
          const existingStyle = el.getAttribute('style') || '';
          el.setAttribute('style', existingStyle + '; font-family: Arial, Helvetica, sans-serif !important; font-weight: normal !important; color: #000000 !important;');
          
          if (el.tagName === 'H1') {
            el.setAttribute('style', existingStyle + '; font-size: 28px !important; color: #000000 !important;');
          } else if (el.tagName === 'H2') {
            el.setAttribute('style', existingStyle + '; font-size: 24px !important; color: #1b7a70 !important;');
          } else if (el.tagName === 'P') {
            el.setAttribute('style', existingStyle + '; font-size: 16px !important; color: #333333 !important;');
          } else if (el.tagName === 'CODE' || el.tagName === 'PRE') {
            el.setAttribute('style', existingStyle + '; font-size: 15px !important; color: #333333 !important;');
          }
        });
        
        // 确保内容元素可见且样式正确
        const contentDiv = clonedDoc.getElementById('test-content');
        if (contentDiv) {
          contentDiv.style.display = 'block';
          contentDiv.style.color = '#000000';
          contentDiv.style.backgroundColor = '#FFFFFF';
          contentDiv.style.fontFamily = 'Arial, Helvetica, sans-serif';
          contentDiv.style.fontSize = '16px';
        }
        log("克隆文档处理完成");
      }
    }).then((canvas: HTMLCanvasElement) => {
      log(`Canvas生成成功，尺寸：${canvas.width}x${canvas.height}`);
      
      try {
        log("开始生成PDF");
        // @ts-expect-error - window.jspdf 从动态加载的脚本中获取
        const jsPDF = window.jspdf.jsPDF;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        log("图像数据生成成功");
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        
        // 添加图像
        pdf.addImage(
          imgData,
          'JPEG',
          margin,
          margin,
          pdfWidth - 2*margin,
          (canvas.height * (pdfWidth - 2*margin)) / canvas.width
        );
        log("图像添加到PDF成功");
        
        // 添加页眉页脚
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica');
        pdf.text('Generated by Test', margin, 10);
        pdf.text(new Date().toLocaleString(), pdfWidth - margin, 10, { align: 'right' });
        pdf.text('Page 1 of 1', pdfWidth/2, pdfHeight - 10, { align: 'center' });
        log("页眉页脚添加成功");
        
        // 显示生成的canvas
        canvas.style.maxWidth = '100%';
        canvas.style.border = '1px solid #ccc';
        
        const container = document.getElementById("result-container");
        if (container) {
          container.innerHTML = '';
          container.appendChild(canvas);
        }
        
        // 保存PDF
        pdf.save('test.pdf');
        log("PDF保存成功");
      } catch (error: any) {
        log(`PDF生成错误：${error.message}`);
      }
    }).catch((error: Error) => {
      log(`错误：${error.message}`);
    });
  };

  // 添加新测试：直接创建内容生成PDF
  const test4_DirectPdf = () => {
    log("测试4开始：直接创建内容生成PDF");
    
    try {
      // 创建一个全新的div元素作为内容容器
      const directContainer = document.createElement("div");
      directContainer.style.backgroundColor = "white";
      directContainer.style.padding = "20px";
      directContainer.style.width = "800px";
      directContainer.style.color = "black";
      directContainer.style.fontFamily = "Arial, sans-serif";
      
      // 直接添加一些简单的HTML内容
      directContainer.innerHTML = `
        <h1 style="color: black; font-size: 28px;">直接创建的标题</h1>
        <h2 style="color: #1b7a70; font-size: 24px;">这是二级标题</h2>
        <p style="color: #333333; font-size: 16px;">这是一个直接创建的段落，用于测试PDF文字渲染。</p>
        <p style="color: #333333; font-size: 16px;">这是第二个段落，包含更多文字用于测试。</p>
        <ul>
          <li style="color: #333333; font-size: 16px;">列表项1</li>
          <li style="color: #333333; font-size: 16px;">列表项2</li>
        </ul>
      `;
      
      // 添加到文档中
      document.body.appendChild(directContainer);
      log("直接创建内容完成");
      
      // 显示内容预览
      const previewContainer = document.getElementById("result-container");
      if (previewContainer) {
        previewContainer.innerHTML = '<div style="padding: 10px; border: 1px dashed #ccc;">预览内容</div>';
        previewContainer.appendChild(directContainer.cloneNode(true));
      }
      
      // @ts-expect-error - window.html2canvas 从动态加载的脚本中获取
      window.html2canvas(directContainer, {
        scale: 4,
        logging: true,
        backgroundColor: 'white',
        letterRendering: true,
        onclone: (clonedDoc: Document) => {
          log("处理克隆文档");
          // 确保所有文本是黑色的
          const elements = clonedDoc.querySelectorAll('*');
          elements.forEach(el => {
            const style = window.getComputedStyle(el);
            log(`元素 ${el.tagName} 计算样式颜色: ${style.color}`);
            
            // 强制设置样式
            (el as HTMLElement).style.color = "#000000";
            if (el.tagName === 'H1') {
              (el as HTMLElement).style.fontSize = "28px";
              (el as HTMLElement).style.color = "#000000";
            } else if (el.tagName === 'H2') {
              (el as HTMLElement).style.fontSize = "24px";
              (el as HTMLElement).style.color = "#1b7a70";
            } else if (el.tagName === 'P' || el.tagName === 'LI') {
              (el as HTMLElement).style.fontSize = "16px";
              (el as HTMLElement).style.color = "#333333";
            }
          });
        }
      }).then((canvas: HTMLCanvasElement) => {
        log(`Canvas生成成功，尺寸：${canvas.width}x${canvas.height}`);
        
        // 显示生成的canvas
        canvas.style.maxWidth = '100%';
        canvas.style.border = '1px solid #ccc';
        
        const container = document.getElementById("result-container");
        if (container) {
          container.innerHTML = '';
          container.appendChild(canvas);
        }
        
        try {
          log("开始生成PDF");
          // @ts-expect-error - window.jspdf 从动态加载的脚本中获取
          const jsPDF = window.jspdf.jsPDF;
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          log("图像数据生成成功");
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const margin = 15;
          
          // 添加图像
          pdf.addImage(
            imgData,
            'JPEG',
            margin,
            margin,
            pdfWidth - 2*margin,
            (canvas.height * (pdfWidth - 2*margin)) / canvas.width
          );
          log("图像添加到PDF成功");
          
          // 添加页眉页脚
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.setFont('helvetica');
          pdf.text('Generated by Direct Test', margin, 10);
          pdf.text(new Date().toLocaleString(), pdfWidth - margin, 10, { align: 'right' });
          pdf.text('Page 1 of 1', pdfWidth/2, pdfHeight - 10, { align: 'center' });
          log("页眉页脚添加成功");
          
          // 保存PDF
          pdf.save('direct-test.pdf');
          log("PDF保存成功");
        } catch (error: any) {
          log(`PDF生成错误：${error.message}`);
        }
      }).catch((error: Error) => {
        log(`Canvas生成错误：${error.message}`);
      });
      
      // 最后从DOM中移除创建的元素
      document.body.removeChild(directContainer);
      
    } catch (error: any) {
      log(`测试4错误: ${error.message}`);
    }
  };

  // 加载脚本
  useEffect(() => {
    // 加载html2canvas和jspdf
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
      });
    };

    const loadScripts = async () => {
      try {
        await loadScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        log("脚本加载成功");
      } catch (error) {
        log("脚本加载失败");
        console.error("Script loading error:", error);
      }
    };

    loadScripts();
  }, []);

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">PDF生成测试页面</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">测试内容</h2>
            <textarea
              id="content-editor"
              className="w-full h-64 p-4 border border-gray-300 rounded font-mono text-sm"
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={test1_BasicRendering}
            >
              测试1：基本渲染
            </button>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              onClick={test2_StyledRendering}
            >
              测试2：带样式渲染
            </button>
            <button
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
              onClick={test3_CompletePdf}
            >
              测试3：完整PDF
            </button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              onClick={test4_DirectPdf}
            >
              测试4：直接内容
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              onClick={clearLogs}
            >
              清除日志
            </button>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">日志</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">预览</h2>
            <div id="test-content" className="bg-white p-6 border border-gray-300 rounded mb-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked(testContent) }} />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">结果</h2>
            <div id="result-container" className="bg-white p-4 border border-gray-300 rounded h-64 overflow-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 