import React from "react";

/**
 * 全站共用的聯繫方式 / 社群頁尾
 * 用於所有公開頁面（首頁、介紹頁、實戰指南、幫助中心等）
 */
const SiteFooterContacts: React.FC = () => {
  return (
    <footer className="border-t bg-white/80 backdrop-blur mt-0">
      <div className="container max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 text-sm text-slate-600">
          {/* 品牌簡介 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">
              ReelMind / AIJob 自動化學院
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              專注短影音腳本與 AI 自動化工作流，幫你把靈感變成可持續運轉的內容系統。
            </p>
          </div>

          {/* LINE 官方帳號 */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900">LINE 官方帳號</h4>
            <p className="text-xs text-slate-500">
              最新活動、教學與更新都會優先在 LINE 官方帳號公告。
            </p>
            <a
              href="https://lin.ee/ZTgJbYG"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#05b44c] transition"
            >
              加入 LINE 官方帳號
            </a>
          </div>

          {/* LINE 社群 */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900">LINE 社群</h4>
            <p className="text-xs text-slate-500">
              加入討論區，和其他創作者交流短影音、AI、自動化實戰心得。
            </p>
            <a
              href="https://line.me/ti/g2/xaKhtD6TG78lZ8tOLP2T4Lz0zD-edf8GJF8x5w?utm_source=invitation&utm_medium=link_copy&utm_campaign=default"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              加入 LINE 社群
            </a>
          </div>

          {/* Discord / 官方網站 */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Discord 社群
              </h4>
              <p className="text-xs text-slate-500">
                想深度聊 AI 工作流與工具整合，可以到 Discord 一起討論。
              </p>
              <a
                href="https://discord.gg/Dzm2P7rHyg"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
              >
                加入 Discord
              </a>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900">
                AIJob 官方網站
              </h4>
              <a
                href="https://www.aijob.com.tw/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              >
                前往 AIJob 官網
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-400 sm:flex-row">
          <span>
            © {new Date().getFullYear()} ReelMind &amp; AIJob 自動化學院
          </span>
          <span>為創作者打造的短影音腳本與 AI 工作流助手</span>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooterContacts;


