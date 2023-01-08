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
        filename: 'oracl-ords-client.js',
        sourceMapFilename: 'oracl-ords-client.map',
        library: 'oracle-ords-client',
        libraryTarget: 'umd',
        globalObject: 'this'
    },
    node: false,
    devtool: 'source-map'
}