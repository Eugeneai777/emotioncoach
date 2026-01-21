import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 优化打包分块策略
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心库
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI 组件库
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-accordion',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-avatar',
            '@radix-ui/react-progress',
            '@radix-ui/react-slider',
            '@radix-ui/react-scroll-area',
          ],
          // Supabase 客户端
          'vendor-supabase': ['@supabase/supabase-js'],
          // 动画库
          'vendor-motion': ['framer-motion'],
          // 数据查询
          'vendor-query': ['@tanstack/react-query'],
          // 图表库
          'vendor-charts': ['recharts'],
          // 日期处理
          'vendor-date': ['date-fns', 'date-fns-tz'],
          // PDF/导出工具
          'vendor-export': ['jspdf', 'jspdf-autotable', 'html2canvas', 'jszip', 'file-saver', 'qrcode'],
        },
      },
    },
    // 增加 chunk 大小警告阈值
    chunkSizeWarningLimit: 600,
  },
}));
