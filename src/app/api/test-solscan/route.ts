import { NextRequest, NextResponse } from 'next/server';
import { fetchFromSolscan } from '@/utils/blockchain';

// 测试端点
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const address = url.searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }
  
  try {
    const result = await fetchFromSolscan(address);
    
    return NextResponse.json({
      address,
      success: !!result,
      fileCount: result ? result.length : 0,
      files: result ? result.map((file: any) => ({
        name: file.name,
        path: file.path,
        contentLength: file.content ? file.content.length : 0
      })) : []
    });
  } catch (error) {
    console.error('Error testing Solscan fetching:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 