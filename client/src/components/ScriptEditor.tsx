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
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2">
            {!readOnly && isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyFormat('bold')}
                  title="粗體 (Ctrl+B)"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyFormat('italic')}
                  title="斜體 (Ctrl+I)"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyFormat('underline')}
                  title="底線 (Ctrl+U)"
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
              >
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? '儲存' : '編輯'}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
            >
              <Copy className="w-4 h-4 mr-2" />
              複製
            </Button>
            
            {onExport && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('txt')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  TXT
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('word')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Word
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              分享
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{wordCount} 字</Badge>
            <Badge variant="outline">{charCount} 字元</Badge>
          </div>
        </div>
      )}

      {/* 編輯器 */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          readOnly={readOnly || !isEditing}
          className={cn(
            "min-h-[300px] font-mono text-sm",
            (readOnly || !isEditing) && "bg-muted/30 cursor-default"
          )}
          placeholder="開始編輯你的腳本..."
        />
      </div>
    </div>
  );
}

