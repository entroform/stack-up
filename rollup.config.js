import typescript from 'rollup-plugin-typescript';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import alias from 'rollup-plugin-alias';
import pkg from './package.json';
import { terser } from "rollup-plugin-terser";

export default {
  input: 'stack-up/stack-up.ts',
  output: [
    {
      file: pkg.main,
      name: 'stack-up',
      format: 'commonjs',
      sourcemap: true,
      plugins: [
        terser(),
      ],
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins: [
    alias({
      resolve: ['.ts'],
    }),
    resolve({
      extensions: ['.ts'],
    }),
    typescript(),
    babel({
      exclude: 'node_modules/**',
      extensions: ['.ts'],
      runtimeHelpers: true,
    }),
    commonjs(),
  ],
}