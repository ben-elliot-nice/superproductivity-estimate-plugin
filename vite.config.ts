/// <reference types="vitest" />
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  if (mode === 'plugin') {
    return {
      build: {
        lib: {
          entry: resolve(__dirname, 'src/plugin.ts'),
          formats: ['iife' as const],
          name: '_sp',
          fileName: () => 'plugin.js',
        },
        outDir: 'dist',
        emptyOutDir: false,
        minify: false,
      },
    };
  }

  return {
    plugins: [solidPlugin(), viteSingleFile()],
    build: {
      target: 'esnext',
      outDir: 'dist',
      emptyOutDir: true,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      transformMode: { web: [/\.[jt]sx?$/] },
    },
    resolve: {
      conditions: ['development', 'browser'],
    },
  };
});
