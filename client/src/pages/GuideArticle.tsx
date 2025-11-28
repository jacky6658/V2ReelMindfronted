/**
 * GuideArticle - 指南文章詳情頁面
 * 顯示單篇指南文章的完整內容
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, ArrowLeft, Clock, BookOpen } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { guideArticles, type GuideArticle as ArticleType } from '@/data/guide-articles';
import { cn } from '@/lib/utils';

export default function GuideArticle() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleType | null>(null);

  useEffect(() => {
    if (slug) {
      const articleData = guideArticles[slug];
      if (articleData) {
        setArticle(articleData);
      } else {
        // 文章不存在，重定向到指南首頁
        navigate('/guide');
      }
    }
  }, [slug, navigate]);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 導航欄 */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate('/')}>
            ReelMind
          </h1>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate('/guide')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回指南
            </Button>
          </div>
        </div>
      </nav>

      {/* 文章內容 */}
      <article className="py-12 px-4">
        <div className="container max-w-3xl">
          {/* 文章標頭 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline">{article.category}</Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{article.readTime}</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
          </div>

          {/* 文章正文 */}
          <Card className="p-8">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {article.sections.map((section, index) => (
                <div key={index} className="mb-8">
                  {section.level === 1 && (
                    <h2 className="text-2xl font-bold mb-4 mt-8 first:mt-0">
                      {section.heading}
                    </h2>
                  )}
                  {section.level === 2 && (
                    <h3 className="text-xl font-semibold mb-3 mt-6">
                      {section.heading}
                    </h3>
                  )}
                  {section.level === 3 && (
                    <h4 className="text-lg font-medium mb-2 mt-4">
                      {section.heading}
                    </h4>
                  )}
                  <div className="space-y-3">
                    {section.content.map((paragraph, pIndex) => {
                      // 處理表格
                      if (paragraph.startsWith('|')) {
                        return (
                          <div key={pIndex} className="overflow-x-auto my-4 rounded-lg border border-border dark:border-border/50 bg-card dark:bg-card/50">
                            <table className="min-w-full border-collapse">
                              <tbody>
                                {paragraph.split('\n').filter(row => row.trim()).map((row, rIndex) => {
                                  const cells = row.split('|').filter(cell => cell.trim());
                                  const isHeader = rIndex === 0;
                                  const isSeparator = cells.every(cell => cell.trim().match(/^-+$/));
                                  
                                  if (isSeparator) return null;
                                  
                                  return (
                                    <tr 
                                      key={rIndex} 
                                      className={cn(
                                        isHeader 
                                          ? 'bg-muted/50 dark:bg-muted/30 border-b border-border dark:border-border/50' 
                                          : 'border-b border-border/50 dark:border-border/30 hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors'
                                      )}
                                    >
                                      {cells.map((cell, cIndex) => {
                                        const Tag = isHeader ? 'th' : 'td';
                                        return (
                                          <Tag
                                            key={cIndex}
                                            className={cn(
                                              "px-4 py-2 text-left",
                                              isHeader 
                                                ? "font-semibold text-foreground dark:text-foreground" 
                                                : "text-foreground/90 dark:text-foreground/80"
                                            )}
                                          >
                                            {cell.trim()}
                                          </Tag>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                      
                      // 處理空行
                      if (!paragraph.trim()) {
                        return <div key={pIndex} className="h-2" />;
                      }
                      
                      // 處理列表項
                      if (paragraph.startsWith('• ') || paragraph.startsWith('✅ ') || paragraph.startsWith('❌ ')) {
                        const icon = paragraph.startsWith('✅') ? '✅' : paragraph.startsWith('❌') ? '❌' : '•';
                        const text = paragraph.replace(/^[•✅❌]\s*/, '');
                        
                        // 處理列表項中的粗體文字
                        if (text.includes('**')) {
                          const parts = text.split('**');
                          return (
                            <div key={pIndex} className="flex gap-2 items-start">
                              <span className="flex-shrink-0 mt-1">{icon}</span>
                              <span className="flex-1">
                                {parts.map((part, i) => 
                                  i % 2 === 0 ? part : <strong key={i} className="font-semibold">{part}</strong>
                                )}
                              </span>
                            </div>
                          );
                        }
                        
                        return (
                          <div key={pIndex} className="flex gap-2 items-start">
                            <span className="flex-shrink-0 mt-1">{icon}</span>
                            <span className="flex-1">{text}</span>
                          </div>
                        );
                      }
                      
                      // 處理粗體文字
                      if (paragraph.includes('**')) {
                        const parts = paragraph.split('**');
                        return (
                          <p key={pIndex} className="leading-relaxed text-muted-foreground">
                            {parts.map((part, i) => 
                              i % 2 === 0 ? part : <strong key={i} className="font-semibold text-foreground">{part}</strong>
                            )}
                          </p>
                        );
                      }
                      
                      // 一般段落
                      return (
                        <p key={pIndex} className="leading-relaxed text-muted-foreground">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* CTA 區塊 */}
          <div className="mt-12 p-8 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">準備好開始實踐了嗎？</h3>
            <p className="text-muted-foreground mb-6">
              使用 ReelMind 立即開始你的短影音創作之旅
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/mode1')}>
                立即開始創作
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/experience')}>
                免費體驗
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
