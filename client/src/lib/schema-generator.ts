/**
 * Schema Generator - 結構化資料標記生成工具
 * 用於動態生成 Article、FAQPage、HowTo、BreadcrumbList 等 Schema Markup
 */

import { type GuideArticle } from '@/data/guide-articles';

const BASE_URL = 'https://reelmind.aijob.com.tw';

/**
 * 生成文章的 Article Schema
 */
export function generateArticleSchema(slug: string, article: GuideArticle) {
  const articleUrl = `${BASE_URL}/#/guide/${slug}`;

  // 先整合全文：用於計算字數與在缺少 description 時當作摘要來源
  const fullText = article.sections
    .flatMap(s => s.content)
    .join(' ')
    .replace(/\*\*/g, '') // 移除 Markdown 粗體標記
    .replace(/VIDEO:.*/g, '') // 移除影片標記
    .trim();

  // 優先使用文章提供的 description，否則從內容提取
  let description: string;
  if (article.description) {
    description = article.description;
  } else {
    description =
      fullText.length > 200 ? fullText.substring(0, 200) + '...' : fullText;
  }

  // 使用真實的發布日期和修改日期
  const datePublished = article.datePublished 
    ? new Date(article.datePublished).toISOString()
    : new Date().toISOString();
  const dateModified = article.dateModified 
    ? new Date(article.dateModified).toISOString()
    : datePublished;

  // 計算字數
  const wordCount = fullText.length;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": description,
    "image": {
      "@type": "ImageObject",
      "url": `${BASE_URL}/og-image.jpg`,
      "width": 1200,
      "height": 630
    },
    "author": {
      "@type": "Organization",
      "name": "ReelMind AI",
      "url": BASE_URL
    },
    "publisher": {
      "@type": "Organization",
      "name": "ReelMind AI",
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/logo.png`,
        "width": 512,
        "height": 512
      }
    },
    "datePublished": datePublished,
    "dateModified": dateModified,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    },
    "articleSection": article.category,
    "wordCount": wordCount,
    "timeRequired": article.readTime,
    "inLanguage": "zh-Hant",
    "keywords": article.keywords && article.keywords.length > 0
      ? article.keywords
      : [
          "短影音",
          "AI 腳本生成",
          article.category,
          "ReelMind"
        ]
  };
}

/**
 * 生成 BreadcrumbList Schema
 */
export function generateBreadcrumbSchema(slug: string, article: GuideArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "首頁",
        "item": `${BASE_URL}/`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "實戰指南",
        "item": `${BASE_URL}/#/guide`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": article.title,
        "item": `${BASE_URL}/#/guide/${slug}`
      }
    ]
  };
}

/**
 * 從文章內容提取 FAQ Schema
 */
export function extractFAQSchema(article: GuideArticle) {
  const faqs: Array<{
    "@type": "Question";
    "name": string;
    "acceptedAnswer": {
      "@type": "Answer";
      "text": string;
    };
  }> = [];
  
  // 尋找包含 "常見問題" 或 "FAQ" 的區塊
  article.sections.forEach(section => {
    if (section.heading.includes('常見問題') || 
        section.heading.includes('FAQ') ||
        section.heading.includes('問題')) {
      
      let currentQuestion: string | null = null;
      let currentAnswer: string[] = [];
      
      section.content.forEach((line, index) => {
        // 匹配問題格式：**Q:** 或 Q: 或 **Q:**
        const questionMatch = line.match(/^\*\*?Q[：:]\s*\*\*?\s*(.+)/) || 
                             line.match(/^Q[：:]\s*(.+)/);
        
        if (questionMatch) {
          // 如果之前有問題，先保存
          if (currentQuestion && currentAnswer.length > 0) {
            faqs.push({
              "@type": "Question",
              "name": currentQuestion,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": currentAnswer.join(' ').replace(/\*\*/g, '').trim()
              }
            });
          }
          
          currentQuestion = questionMatch[1].trim();
          currentAnswer = [];
        } else if (currentQuestion) {
          // 匹配答案格式：**A:** 或 A: 或 **A:**
          const answerMatch = line.match(/^\*\*?A[：:]\s*\*\*?\s*(.+)/) ||
                              line.match(/^A[：:]\s*(.+)/);
          
          if (answerMatch) {
            currentAnswer.push(answerMatch[1].trim());
          } else if (line.trim() && !line.startsWith('**') && !line.startsWith('•')) {
            // 繼續收集答案內容
            currentAnswer.push(line.trim());
          }
        }
      });
      
      // 保存最後一個問答對
      if (currentQuestion && currentAnswer.length > 0) {
        faqs.push({
          "@type": "Question",
          "name": currentQuestion,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": currentAnswer.join(' ').replace(/\*\*/g, '').trim()
          }
        });
      }
    }
  });

  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs
  };
}

/**
 * 從文章內容提取 HowTo Schema（針對教學類文章）
 */
export function extractHowToSchema(article: GuideArticle) {
  // 判斷是否為教學類文章
  const isTutorial = article.category === '入門必讀' || 
                     article.category === '腳本技巧' ||
                     article.category === '技術設定' ||
                     article.title.includes('步驟') ||
                     article.title.includes('如何') ||
                     article.title.includes('教學');

  if (!isTutorial) return null;

  const steps: Array<{
    "@type": "HowToStep";
    "position": number;
    "name": string;
    "text": string;
  }> = [];
  let stepNumber = 1;

  article.sections.forEach(section => {
    // 尋找包含步驟的區塊
    if (section.heading.includes('步驟') || 
        section.heading.includes('方法') ||
        section.heading.includes('流程') ||
        section.content.some(c => c.match(/^[0-9]+[\.、]/))) {
      
      section.content.forEach(line => {
        // 匹配步驟格式：1. 或 第一、或 **1.**
        const stepMatch = line.match(/^([0-9]+)[\.、]\s*(.+)/) ||
                         line.match(/^\*\*([0-9]+)[\.、]\s*\*\*(.+)/);
        
        if (stepMatch) {
          const stepText = stepMatch[2] || stepMatch[3];
          if (stepText && stepText.trim()) {
            steps.push({
              "@type": "HowToStep",
              "position": stepNumber++,
              "name": stepText.trim().replace(/\*\*/g, ''),
              "text": line.trim().replace(/\*\*/g, '')
            });
          }
        }
      });
    }
  });

  // 如果沒有找到步驟，嘗試從標題和內容中提取
  if (steps.length === 0) {
    // 檢查是否有明確的步驟結構（例如：步驟一、步驟二）
    article.sections.forEach(section => {
      const stepMatch = section.heading.match(/步驟[一二三四五六七八九十\d]+[：:]\s*(.+)/);
      if (stepMatch) {
        const stepName = stepMatch[1].trim();
        const stepText = section.content
          .filter(c => !c.startsWith('VIDEO:') && c.trim())
          .slice(0, 3)
          .join(' ')
          .replace(/\*\*/g, '')
          .trim();
        
        if (stepText) {
          steps.push({
            "@type": "HowToStep",
            "position": stepNumber++,
            "name": stepName,
            "text": stepText
          });
        }
      }
    });
  }

  if (steps.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": article.title,
    "description": `學習如何${article.title}`,
    "step": steps,
    "totalTime": article.readTime,
    "image": {
      "@type": "ImageObject",
      "url": `${BASE_URL}/og-image.jpg`
    }
  };
}

/**
 * 動態注入 Schema 到頁面
 */
export function injectSchema(schema: object, id?: string): string {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema, null, 2);
  script.id = id || `schema-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  document.head.appendChild(script);
  return script.id;
}

/**
 * 移除舊的 Schema（避免重複）
 */
export function removeSchema(scriptId: string) {
  const script = document.getElementById(scriptId);
  if (script) {
    script.remove();
  }
}

/**
 * 移除所有動態注入的 Schema（清理函數）
 */
export function removeAllDynamicSchemas() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"][id^="schema-"]');
  scripts.forEach(script => script.remove());
}

