import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2-enhanced';
import path from 'path';


const config = defineConfig({
  resolve: {
    alias: {
      // @ts-ignore
      '@': path.resolve(__dirname, "src")
    }
  },
  server: {
    open: true
  },
  build: {
    sourcemap: true,
    minify: false,
  },
  plugins: [
    createVuePlugin({ jsx: true, vueTemplateOptions: {preprocessOptions: 'pug'} })
  ],
})

export default config
