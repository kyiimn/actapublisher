const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');

const isProd = process.env.NODE_ENV == 'production';

module.exports = {
    entry: {
        login: './src/login.ts',
        editor: './src/editor.ts'
    },
    module: {
        rules: [{
            test: /\.html$/,
            use: [{
                loader: "html-loader",
                options: { minimize: true }
            }]
        }, {
            test: /\.ts$/,
            include: [path.resolve(__dirname, 'src')],
            use: 'ts-loader',
        }, {
            test: /\.css$/,
            use: [MiniCssExtractPlugin.loader, "css-loader"]
        }, {
            test: /\.scss$/,
            use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
        },
        {
            enforce: "pre", test: /\.js$/, loader: "source-map-loader"
        }, {
            enforce: 'pre', test: /\.ts$/, loader: 'tslint-loader'
        }]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.css', '.scss', '.html'],
    },
    devtool: isProd ? false : 'eval-source-map',
    output: {
        publicPath: 'dist',
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: 'html/editor.html',
            filename: '../editor.html',
            chunks : ['editor']
        }),
        new HtmlWebPackPlugin({
            template: 'html/login.html',
            filename: '../login.html',
            chunks : ['login']
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
        new TerserPlugin({
            cache: true,
            parallel: true,
            terserOptions: {
                warnings: false,
                compress: {
                    warnings: false,
                    unused: true,
                },
                ecma: 6,
                mangle: true,
                unused: true,
            },
            sourceMap: isProd ? false : true
        })
    ]
};