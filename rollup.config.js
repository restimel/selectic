import resolve from '@rollup/plugin-node-resolve';
import pluginReplace from '@rollup/plugin-replace';
import VuePlugin from 'rollup-plugin-vue';
import commonjs from 'rollup-plugin-commonjs' ;

export default [{
    input: 'lib/index.js',
    output: [{
        file: 'dist/selectic.common.js',
        exports: 'named',
        format: 'cjs',
    }, {
        file: 'dist/selectic.esm.js',
        format: 'esm',
    }],
    external: [
        'vtyx',
    ],
    context: 'this',
}, {
    input: 'examples/app.js',
    output: [{
        file: 'examples/dist/app.js',
        format: 'iife',
    }],
    plugins: [
        commonjs(),
        VuePlugin(),
        pluginReplace({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        resolve()
    ],
    context: 'this',
}, {
    input: 'lib/Store.js',
    output: [{
        file: 'test/dist/Store.js',
        exports: 'named',
        format: 'cjs',
    }, {
        file: 'test/dist/Store.esm.js',
        format: 'esm',
    }],
    external: [
        'vtyx',
    ],
    context: 'this',
}];
