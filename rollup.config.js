'use strict';

const path = require('path');
const babel = require('rollup-plugin-babel');

const BUNDLE = process.env.BUNDLE === 'true';
const ESM = process.env.ESM === 'true';

let fileDest = `bootstrap${ESM ? '.esm' : ''}`;

const plugins = [
    babel({
        exclude: 'node_modules/**'
    })
];

const rollupConfig = {
    input: path.resolve(__dirname, `src/index.${ESM ? 'esm' : 'umd'}.js`),
    output: {
        file: path.resolve(__dirname, `../dist/js/${fileDest}.js`),
        format: ESM ? 'esm' : 'umd'
    },
    plugins
}

if (!ESM) {
    rollupConfig.output.name = 'bootstrap'
}

module.exports = rollupConfig;