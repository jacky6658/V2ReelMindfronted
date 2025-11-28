/**
 * 文章詳情頁面
 */

import React from 'react';
import { useParams } from 'react-router-dom';

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">文章詳情 - {id}</h1>
      <p className="mt-4">這是文章 {id} 的詳細內容。</p>
      {/* TODO: 根據 id 獲取文章內容並顯示，保持原有 UI 排版 */}
    </div>
  );
};

export default ArticleDetail;

