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
import { apiGet } from '@/lib/api-client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
  extractFAQSchema,
  extractHowToSchema,
  injectSchema,
  removeSchema
} from '@/lib/schema-generator';
import { useMetaTags } from '@/hooks/useMetaTags';

export default function GuideArticle() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleType | null>(null);
  const { isLoggedIn } = useAuthStore();

  const handleGoogleLogin = async () => {
    try {
      // 直接調用 Google 登入 API，不經過登入頁面
      const { auth_url } = await apiGet<{ auth_url: string }>('/api/auth/google-new');
      // 重定向到 Google 登入頁面
      window.location.href = auth_url;
    } catch (error) {
      console.error('登入失敗:', error);
      toast.error('登入失敗，請稍後再試');
    }
  };

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

  // 動態更新 Meta Tags
  useMetaTags({
    title: article?.title,
    description: article?.description || article?.sections
      .flatMap(s => s.content)
      .join(' ')
      .replace(/\*\*/g, '')
      .substring(0, 160) + '...',
    keywords: article?.keywords?.join(', '),
    url: `https://reelmind.aijob.com.tw/#/guide/${slug}`,
    type: 'article',
    author: 'ReelMind AI',
    publishedTime: article?.datePublished ? new Date(article.datePublished).toISOString() : undefined,
    modifiedTime: article?.dateModified ? new Date(article.dateModified).toISOString() : undefined,
    section: article?.category,
    tags: article?.keywords || []
  });

  // 動態注入 Schema Markup
  useEffect(() => {
    if (!article || !slug) return;

    // 生成並注入 Article Schema
    const articleSchema = generateArticleSchema(slug, article);
    const articleScriptId = injectSchema(articleSchema, `schema-article-${slug}`);

    // 生成並注入 BreadcrumbList Schema
    const breadcrumbSchema = generateBreadcrumbSchema(slug, article);
    const breadcrumbScriptId = injectSchema(breadcrumbSchema, `schema-breadcrumb-${slug}`);

    // 提取並注入 FAQ Schema（如果有）
    const faqSchema = extractFAQSchema(article);
    let faqScriptId: string | null = null;
    if (faqSchema) {
      faqScriptId = injectSchema(faqSchema, `schema-faq-${slug}`);
    }

    // 提取並注入 HowTo Schema（如果是教學類文章）
    const howToSchema = extractHowToSchema(article);
    let howToScriptId: string | null = null;
    if (howToSchema) {
      howToScriptId = injectSchema(howToSchema, `schema-howto-${slug}`);
    }

    // 清理函數：當組件卸載或文章改變時移除舊的 Schema
    return () => {
      removeSchema(articleScriptId);
      removeSchema(breadcrumbScriptId);
      if (faqScriptId) removeSchema(faqScriptId);
      if (howToScriptId) removeSchema(howToScriptId);
    };
  }, [article, slug]);

  // 處理 Markdown 連結格式 [text](url)
  const parseMarkdownLinks = (text: string): (string | JSX.Element)[] => {
    const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = linkRegex.exec(text)) !== null) {
      // 添加連結前的文字
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // 添加連結
      const linkText = match[1];
      const linkUrl = match[2];
      const isExternal = linkUrl.startsWith('http');
      
      parts.push(
        <a
          key={`link-${key++}`}
          href={linkUrl}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-primary hover:underline font-medium"
        >
          {linkText}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩餘文字
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : [text];
  };

  // 處理延伸閱讀：將文章標題轉換為連結
  const parseRelatedArticles = (text: string): (string | JSX.Element)[] => {
    // 匹配格式：• **文章標題** - 描述
    const relatedRegex = /\*\*([^*]+)\*\*\s*-\s*(.+)/;
    const match = text.match(relatedRegex);
    
    if (match) {
      const articleTitle = match[1].trim();
      const description = match[2].trim();
      
      // 查找對應的文章 slug
      // 支援完全匹配和部分匹配（標題前綴匹配）
      const articleEntry = Object.entries(guideArticles).find(
        ([_, article]) => {
          const fullTitle = article.title;
          // 完全匹配
          if (fullTitle === articleTitle) return true;
          // 部分匹配：檢查完整標題是否以簡短標題開頭
          if (fullTitle.startsWith(articleTitle)) return true;
          // 反向匹配：檢查簡短標題是否是完整標題的前綴（去掉冒號後的部分）
          const titlePrefix = fullTitle.split('：')[0].split(':')[0].trim();
          if (titlePrefix === articleTitle) return true;
          return false;
        }
      );
      
      if (articleEntry) {
        const [articleSlug] = articleEntry;
        return [
          '• ',
          <a
            key="related-link"
            href={`#/guide/${articleSlug}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/guide/${articleSlug}`);
            }}
            className="text-primary hover:underline font-semibold"
          >
            {articleTitle}
          </a>,
          ` - ${description}`
        ];
      }
    }
    
    // 如果沒有匹配到延伸閱讀格式，處理粗體和連結
    // 先處理粗體，再處理連結
    if (text.includes('**')) {
      const parts = text.split('**');
      const result: (string | JSX.Element)[] = [];
      parts.forEach((part, i) => {
        if (i % 2 === 0) {
          // 偶數索引是普通文字，可能包含連結
          if (part.includes('[') && part.includes('](')) {
            result.push(...parseMarkdownLinks(part));
          } else {
            result.push(part);
          }
        } else {
          // 奇數索引是粗體文字
          result.push(<strong key={i} className="font-semibold">{part}</strong>);
        }
      });
      return result;
    }
    
    // 如果沒有粗體，嘗試處理連結
    return parseMarkdownLinks(text);
  };

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
        <div className="container max-w-5xl mx-auto">
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
          <Card className="p-6 md:p-8 lg:p-10">
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
                      // 處理 YouTube 影片嵌入
                      if (paragraph.startsWith('VIDEO:')) {
                        const videoUrl = paragraph.replace('VIDEO:', '').trim();
                        return (
                          <div key={pIndex} className="my-6 rounded-lg overflow-hidden shadow-lg">
                            <div className="relative aspect-video">
                              <iframe
                                src={videoUrl}
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                              ></iframe>
                            </div>
                          </div>
                        );
                      }
                      
                      // 處理表格
                      if (paragraph.startsWith('|')) {
                        const rows = paragraph.split('\n').filter(row => row.trim());
                        
                        return (
                          <div key={pIndex} className="my-4 -mx-4 md:mx-0">
                            <div className="overflow-x-auto px-4 md:px-0">
                              <table className="min-w-[600px] md:min-w-full border-collapse rounded-lg border border-border dark:border-border/50 bg-card dark:bg-card/50">
                                <tbody>
                                  {rows.map((row, rIndex) => {
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
                                                "px-4 py-2 text-left whitespace-nowrap",
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
                        
                        // 檢查是否是延伸閱讀格式（包含 **標題** - 描述）
                        // 但先檢查是否真的是延伸閱讀（通常在「延伸閱讀：」標題下）
                        // 或者直接處理包含粗體和「 - 」的列表項
                        if (text.includes('**') && text.includes(' - ')) {
                          const parts = parseRelatedArticles(text);
                          // parseRelatedArticles 已經處理了粗體，直接使用結果
                          return (
                            <div key={pIndex} className="flex gap-2 items-start">
                              <span className="flex-shrink-0 mt-1">{icon}</span>
                              <span className="flex-1">{parts}</span>
                            </div>
                          );
                        }
                        
                        // 處理包含連結的文字
                        if (text.includes('[') && text.includes('](')) {
                          const parts = parseMarkdownLinks(text);
                          return (
                            <div key={pIndex} className="flex gap-2 items-start">
                              <span className="flex-shrink-0 mt-1">{icon}</span>
                              <span className="flex-1">{parts}</span>
                            </div>
                          );
                        }
                        
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
                      
                      // 處理包含連結的段落（優先檢查連結，因為可能同時包含粗體）
                      if (paragraph.includes('[') && paragraph.includes('](')) {
                        // 如果同時包含粗體和連結，需要同時處理
                        if (paragraph.includes('**')) {
                          const parts = paragraph.split('**');
                          const result: (string | JSX.Element)[] = [];
                          parts.forEach((part, i) => {
                            if (i % 2 === 0) {
                              // 偶數索引是普通文字，可能包含連結
                              if (part.includes('[') && part.includes('](')) {
                                result.push(...parseMarkdownLinks(part));
                              } else {
                                result.push(part);
                              }
                            } else {
                              // 奇數索引是粗體文字
                              result.push(<strong key={i} className="font-semibold text-foreground">{part}</strong>);
                            }
                          });
                          return (
                            <p key={pIndex} className="leading-relaxed text-muted-foreground">
                              {result}
                            </p>
                          );
                        }
                        
                        const parts = parseMarkdownLinks(paragraph);
                        return (
                          <p key={pIndex} className="leading-relaxed text-muted-foreground">
                            {parts}
                          </p>
                        );
                      }
                      
                      // 處理粗體文字（優先於一般段落）
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
              <Button size="lg" onClick={isLoggedIn ? () => navigate('/app') : handleGoogleLogin}>
                立即開始創作
              </Button>
              <Button size="lg" variant="outline" onClick={isLoggedIn ? () => navigate('/app') : handleGoogleLogin}>
                免費體驗
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
