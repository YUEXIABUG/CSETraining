/**
 * 运行时后端配置 —— 构建后位于 dist/config.js，可直接修改而无需重新构建前端。
 *
 * enabled  是否启用「账号与云同步」：
 *            true  → 启用，「我的成绩」页出现注册 / 登录 / 同步面板
 *            false → 关闭，站点为纯本地模式，不发出任何网络请求
 *            null  → 跟随构建时的环境变量 VITE_API_ENABLED（开发模式默认开启）
 * baseUrl  后端服务地址：
 *            ''                      → 与前端同源，由 Nginx 把 /api 反向代理到后端（推荐）
 *            'https://api.xxx.com'   → 直连后端，需在后端 CSE_CORS_ORIGINS 中放行前端域名
 *            null                    → 跟随构建时的环境变量 VITE_API_BASE_URL
 *
 * 上线时把 enabled 改为 true、baseUrl 填好，刷新页面即可生效。
 */
window.__CSE_API__ = {
  enabled: true,
  baseUrl: '',
}
