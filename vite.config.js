import { defineConfig } from 'vite';
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-polyfill-node';

export default {
  build: {
    sourcemap: true,
  }
}
