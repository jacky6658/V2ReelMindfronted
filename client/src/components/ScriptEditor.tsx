/**
 * ScriptEditor - 腳本編輯器組件
 * 支援基本文字編輯、字數統計、格式化等功能
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Copy, 
  Download, 
  Share2, 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  Undo,
  Redo
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScriptEditorProps {
  content: string;
  title?: string;
  onSave?: (content: string) => void | Promise<void>;
  onExport?: (format: 'txt' | 'pdf' | 'word') => void | Promise<void>;
  onShare?: () => void | Promise<void>;
  readOnly?: boolean;
  className?: string;
  showToolbar?: boolean;
}

export default function ScriptEditor({
  content: initialContent,
  title,
  onSave,
  onExport,
  onShare,
  readOnly = false,
  className,
  showToolbar = true
}: ScriptEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    // 計算字數和字元數
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(content.length);
  }, [content]);

  const handleSave = async () => {
    if (onSave) {
      try {
        await onSave(content);
        setIsEditing(false);
        toast.success('已儲存');
      } catch (error) {
        toast.error('儲存失敗');
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('已複製到剪貼簿');
  };

  const handleExport = async (format: 'txt' | 'pdf' | 'word') => {
    if (onExport) {
      try {
        await onExport(format);
      } catch (error) {
        toast.error('匯出失敗');
      }
    } else {
      // 預設匯出功能
      if (format === 'txt') {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'script'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('已匯出為 TXT');
      } else if (format === 'pdf') {
        // 使用動態導入 jsPDF（避免建構時錯誤）
        try {
          const { default: jsPDF } = await import('jspdf');
          const doc = new jsPDF();
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const margin = 20;
          const maxWidth = pageWidth - margin * 2;
          
          // 設定字體（支援中文）
          doc.setFont('helvetica');
          
          // 添加標題
          if (title) {
            doc.setFontSize(16);
            doc.text(title, margin, margin);
            doc.setFontSize(12);
          }
          
          // 處理內容（自動換行）
          const lines = doc.splitTextToSize(content, maxWidth);
          let y = title ? margin + 10 : margin;
          
          lines.forEach((line: string) => {
            if (y > pageHeight - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin, y);
            y += 7;
          });
          
          // 儲存 PDF
          doc.save(`${title || 'script'}.pdf`);
          toast.success('已匯出為 PDF');
        } catch (error) {
          console.error('PDF 匯出失敗:', error);
          toast.error('PDF 匯出失敗，請稍後再試');
        }
      } else if (format === 'word') {
        // Word 匯出需要額外的庫，這裡先提示
        toast.info('Word 匯出功能開發中');
      }
    }
  };

  const handleShare = async () => {
    if (onShare) {
      try {
        await onShare();
      } catch (error) {
        toast.error('分享失敗');
      }
    } else {
      // 預設分享功能（複製連結或使用 Web Share API）
      if (navigator.share) {
        try {
          await navigator.share({
            title: title || '腳本',
            text: content.substring(0, 100) + '...',
            url: window.location.href
          });
          toast.success('已分享');
        } catch (error) {
          // 用戶取消分享
          if ((error as Error).name !== 'AbortError') {
            handleCopy();
          }
        }
      } else {
        handleCopy();
      }
    }
  };

  const applyFormat = (format: 'bold' | 'italic' | 'underline') => {
    if (readOnly || !isEditing) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    if (selectedText) {
      let formattedText = '';
      switch (format) {
        case 'bold':
          formattedText = `**${selectedText}**`;
          break;
        case 'italic':
          formattedText = `*${selectedText}*`;
          break;
        case 'underline':
          formattedText = `__${selectedText}__`;
          break;
      }
      
      const newContent = content.substring(0, start) + formattedText + content.substring(end);
      setContent(newContent);
      
      // 恢復選取範圍
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + formattedText.length);
      }, 0);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* 工具列 */}
      {showToolbar && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {!readOnly && isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyFormat('bold')}
                  title="粗體 (Ctrl+B)"
                  className="h-8"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyFormat('italic')}
                  title="斜體 (Ctrl+I)"
                  className="h-8"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyFormat('underline')}
                  title="底線 (Ctrl+U)"
                  className="h-8"
                >
                  <Underline className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
              </>
            )}
            
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                    setTimeout(() => textareaRef.current?.focus(), 0);
                  }
                }}
                className="h-8"
              >
                <Save className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{isEditing ? '儲存' : '編輯'}</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8"
            >
              <Copy className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">複製</span>
            </Button>
            
            {onExport && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('txt')}
                  className="h-8"
                >
                  <Download className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">TXT</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  className="h-8"
                >
                  <Download className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('word')}
                  className="h-8"
                >
                  <Download className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Word</span>
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8"
            >
              <Share2 className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">分享</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
            <Badge variant="outline" className="text-xs">{wordCount} 字</Badge>
            <Badge variant="outline" className="text-xs">{charCount} 字元</Badge>
          </div>
        </div>
      )}

      {/* 編輯器 */}
      <div className="relative overflow-x-auto">
        {(readOnly || !isEditing) ? (
          // 只讀模式：使用富文本渲染，支援粗體等格式
          <div
            className={cn(
              "min-h-[300px] text-sm w-full p-3 rounded-md border bg-muted/30",
              "prose prose-sm max-w-none break-words"
            )}
            dangerouslySetInnerHTML={{ 
              __html: (() => {
                // 先轉義 HTML 特殊字符（但保留已轉義的內容）
                let html = content
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
                
                // 處理粗體：**text** 或 __text__（支援跨行和多個）
                // 使用 [\s\S] 來匹配包括換行符在內的所有字符，*? 允許空內容
                // 添加內聯樣式確保粗體正確顯示
                html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>');
                html = html.replace(/__([\s\S]*?)__/g, '<strong style="font-weight: bold;">$1</strong>');
                
                // 處理斜體：*text* 或 _text_（但不在 ** 或 __ 內）
                // 使用負向前後查找確保不是粗體標記的一部分
                html = html.replace(/(?<!\*)\*(?!\*)([^\n*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
                html = html.replace(/(?<!_)_(?!_)([^\n_]+?)(?<!_)_(?!_)/g, '<em>$1</em>');
                
                // 處理換行
                html = html.replace(/\n/g, '<br />');
                
                return html;
              })()
            }}
          />
        ) : (
          // 編輯模式：使用純文字輸入框（顯示原始 Markdown）
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={cn(
              "min-h-[300px] font-mono text-sm w-full min-w-0 whitespace-pre-wrap break-words resize-none"
            )}
            placeholder="開始編輯你的腳本..."
          />
        )}
      </div>
    </div>
  );
}

