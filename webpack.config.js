module.exports = {
    entry: './index.ts',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts'],
    },
    output: {
        path: __dirname + '/dist/',
        filename: 'index.js',
        sourceMapFilename: 'index.js.map',
        library: 'oracle-ords-client',
        libraryTarget: 'umd',
        globalObject: 'this',
        clean: true
    },
    node: false,
    devtool: 'source-map'
}