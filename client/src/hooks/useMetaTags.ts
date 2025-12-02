/**
 * useMetaTags Hook - 動態更新頁面 Meta Tags
 * 用於 SPA 中動態更新 <head> 中的 meta tags，提升 SEO
 */

import { useEffect } from 'react';

interface MetaTagsOptions {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

const BASE_URL = 'https://reelmind.aijob.com.tw';
const DEFAULT_TITLE = 'ReelMind - AI 短影音智能體 | 從靈感枯竭到內容量產';
const DEFAULT_DESCRIPTION = 'ReelMind 是 AI 驅動的短影音創作平台，提供一鍵生成爆款腳本、IP 人設規劃、創作者資料庫和實戰指南。專為 IG、TikTok、Shorts 打造，效率提升 70%。';
const DEFAULT_IMAGE = `${BASE_URL}/assets/images/ReelMind.png`;

/**
 * 動態更新頁面 Meta Tags
 */
export function useMetaTags(options: MetaTagsOptions) {
  useEffect(() => {
    const {
      title,
      description,
      keywords,
      image = DEFAULT_IMAGE,
      url,
      type = 'website',
      author = 'ReelMind AI',
      publishedTime,
      modifiedTime,
      section,
      tags = []
    } = options;

    // 更新 document.title
    if (title) {
      document.title = `${title} | ReelMind`;
    } else {
      document.title = DEFAULT_TITLE;
    }

    // 更新或創建 meta tags
    const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
      if (!content) return;
      
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // 基本 Meta Tags
    updateMetaTag('title', title || DEFAULT_TITLE);
    updateMetaTag('description', description || DEFAULT_DESCRIPTION);
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }
    updateMetaTag('author', author);

    // Open Graph Tags
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:title', title || DEFAULT_TITLE, 'property');
    updateMetaTag('og:description', description || DEFAULT_DESCRIPTION, 'property');
    updateMetaTag('og:image', image, 'property');
    updateMetaTag('og:image:width', '1200', 'property');
    updateMetaTag('og:image:height', '630', 'property');
    updateMetaTag('og:image:alt', title || DEFAULT_TITLE, 'property');
    updateMetaTag('og:url', url || window.location.href, 'property');
    updateMetaTag('og:locale', 'zh_TW', 'property');
    updateMetaTag('og:site_name', 'ReelMind', 'property');

    // Article 專用 Meta Tags
    if (type === 'article') {
      if (publishedTime) {
        updateMetaTag('article:published_time', publishedTime, 'property');
      }
      if (modifiedTime) {
        updateMetaTag('article:modified_time', modifiedTime, 'property');
      }
      if (author) {
        updateMetaTag('article:author', author, 'property');
      }
      if (section) {
        updateMetaTag('article:section', section, 'property');
      }
      tags.forEach((tag, index) => {
        updateMetaTag(`article:tag`, tag, 'property');
      });
    }

    // Twitter Card Tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title || DEFAULT_TITLE);
    updateMetaTag('twitter:description', description || DEFAULT_DESCRIPTION);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:image:alt', title || DEFAULT_TITLE);
    if (url) {
      updateMetaTag('twitter:url', url);
    }

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', url || window.location.href);

    // 清理函數：恢復預設值（可選）
    return () => {
      // 如果需要恢復預設值，可以在這裡處理
      // 但通常 SPA 切換頁面時會立即更新，所以不需要清理
    };
  }, [options]);
}

