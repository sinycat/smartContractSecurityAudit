declare module 'html2canvas' {
  interface Options {
    backgroundColor?: string;
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    letterRendering?: boolean;
    allowTaint?: boolean;
    onclone?: (document: Document) => void;
  }
  
  function html2canvas(element: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
  export default html2canvas;
} 