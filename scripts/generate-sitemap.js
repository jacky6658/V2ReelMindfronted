/**
 * 動態生成 Sitemap
 * 從 guide-articles.ts 自動讀取所有文章並生成最新的 sitemap.xml
 */

const fs = require('fs');
const path = require('path');

// 讀取 guide-articles.ts 檔案
const articlesPath = path.join(__dirname, '../client/src/data/guide-articles.ts');
const articlesContent = fs.readFileSync(articlesPath, 'utf-8');

// 提取所有文章的 slug
const slugMatches = articlesContent.matchAll(/['"]([^'"]+)['"]:\s*\{[\s\S]*?slug:\s*['"]([^'"]+)['"]/g);
const articles = [];

for (const match of slugMatches) {
  const key = match[1];
  const slug = match[2];
  
  // 提取日期（如果有的話）
  const dateMatch = articlesContent.match(new RegExp(`${key}:\\s*\\{[\\s\\S]*?datePublished:\\s*['"]([^'"]+)['"]`, 'm'));
  const datePublished = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
  
  articles.push({
    slug,
    datePublished
  });
}

// 生成 Sitemap XML
const baseUrl = 'https://reelmind.aijob.com.tw';
const currentDate = new Date().toISOString().split('T')[0];

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- 🏠 首頁 - 最高優先級 -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- 📘 實戰指南主頁 - 分類頁 -->
  <url>
    <loc>${baseUrl}/guide.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- 📄 文章們（統一 priority = 0.8，最佳實務） -->
`;

// 添加所有文章
articles.forEach((article, index) => {
  const articleNumber = index + 1;
  sitemap += `  <url>
    <loc>${baseUrl}/guide/article-${articleNumber}-${article.slug}.html</loc>
    <lastmod>${article.datePublished}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

`;
});

// 添加其他頁面
sitemap += `  <!-- 📘 關於我們 ReelMind -->
  <url>
    <loc>${baseUrl}/about.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
        
  <!-- 🎁 免費體驗頁面 -->
  <url>
    <loc>${baseUrl}/experience.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- 💳 訂閱頁面 -->
  <url>
    <loc>${baseUrl}/subscription.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- 📞 聯絡頁（低權重） -->
  <url>
    <loc>${baseUrl}/contact.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>

</urlset>
`;

// 寫入 sitemap.xml
const sitemapPath = path.join(__dirname, '../client/public/sitemap.xml');
fs.writeFileSync(sitemapPath, sitemap, 'utf-8');

console.log(`✅ Sitemap 已生成：${sitemapPath}`);
console.log(`📄 共 ${articles.length} 篇文章已加入 Sitemap`);

