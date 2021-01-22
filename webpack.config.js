const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const path = require('path');

const isProd = process.env.NODE_ENV == 'production';

module.exports = {
    entry: {
        login: './src/js/login.ts',
        admin: './src/js/admin.ts',
        designer: './src/js/designer.ts',
        editor: './src/js/editor.ts',
        planner: './src/js/planner.ts'
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
            include: [path.resolve(__dirname, 'src/js')],
            use: 'ts-loader',
        }, {
            test: /\.css$/,
            include: [path.resolve(__dirname, 'src/css')],
            use: [MiniCssExtractPlugin.loader, "css-loader"]
        }, {
            test: /\.scss$/,
            include: [path.resolve(__dirname, 'src/css')],
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
        publicPath: 'js',
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist/js'),
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: 'src/html/login.html',
            filename: '../login.html',
            chunks : ['login']
        }),
        new HtmlWebPackPlugin({
            template: 'src/html/admin.html',
            filename: '../admin.html',
            chunks : ['admin']
        }),
        new HtmlWebPackPlugin({
            template: 'src/html/designer.html',
            filename: '../designer.html',
            chunks : ['designer']
        }),
        new HtmlWebPackPlugin({
            template: 'src/html/editor.html',
            filename: '../editor.html',
            chunks : ['editor']
        }),
        new HtmlWebPackPlugin({
            template: 'src/html/planner.html',
            filename: '../planner.html',
            chunks : ['planner']
        }),
        new MiniCssExtractPlugin({
            filename: '../css/[name].css'
        }),
        new TerserPlugin({
            cache: true,
            parallel: true,
            terserOptions: {
                format: {
                    comments: false,
                },
                warnings: false,
                compress: {
                    warnings: false,
                    unused: true,
                },
                ecma: 6,
                mangle: true,
                unused: true,
            },
            extractComments: false,
            sourceMap: isProd ? false : true
        }),
        new Dotenv()
    ]
};