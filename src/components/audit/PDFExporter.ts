import { toast } from "react-hot-toast";

/**
 * 保存内容为PDF文件
 * 通过后端API生成PDF文件
 */
export const handleSaveAsPdf = async (content: string, fileName: string) => {
  try {
    // 显示加载提示
    const loadingToast = toast.loading("Generating PDF...");
    
    // 调用后端API
    const response = await fetch('http://localhost:3001/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ markdown: content, fileName }),
    });

    // 处理错误
    if (!response.ok) {
      let errorMsg = 'Failed to generate PDF';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        // 忽略JSON解析错误
      }
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    // 获取blob并下载
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.md$/, '') + '.pdf';
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);

    // 显示成功消息
    toast.success("PDF generated successfully");
    
    // 关闭加载提示
    toast.dismiss(loadingToast);
  } catch (error) {
    console.error('PDF generation error:', error);
    toast.error("Failed to generate PDF: " + (error instanceof Error ? error.message : String(error)));
  }
}; 