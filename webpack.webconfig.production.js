const crypto = require('crypto');
const path = require('path');
const CSSSplitWebpackPlugin = require('css-split-webpack-plugin').default;
const findImports = require('find-imports');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const without = require('lodash/without');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const nib = require('nib');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const stylusLoader = require('stylus-loader');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');
const buildConfig = require('./build.config');
const pkg = require('./package.json');

// Use publicPath for production
const publicPath = ((payload) => {
    const algorithm = 'sha1';
    const buf = String(payload);
    const hash = crypto.createHash(algorithm).update(buf).digest('hex');
    return '/' + hash.substr(0, 8) + '/'; // 8 digits
})(pkg.version);
const buildVersion = pkg.version;
const timestamp = new Date().getTime();

module.exports = {
    mode: 'production',
    cache: true,
    target: 'web',
    context: path.resolve(__dirname, 'src/web'),
    devtool: 'cheap-module-source-map',
    entry: {
        polyfill: [
            path.resolve(__dirname, 'src/web/polyfill/index.js')
        ],
        vendor: findImports([
            'src/web/**/*.{js,jsx}',
            '!src/web/polyfill/**/*.js',
            '!src/web/**/*.development.js'
        ], { flatten: true }),
        app: [
            path.resolve(__dirname, 'src/web/index.jsx')
        ]
    },
    output: {
        path: path.resolve(__dirname, 'dist/cnc/web'),
        chunkFilename: `[name].[chunkhash].bundle.js?_=${timestamp}`,
        filename: `[name].[chunkhash].bundle.js?_=${timestamp}`,
        publicPath: publicPath
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: 'eslint-loader',
                enforce: 'pre',
                exclude: /node_modules/
            },
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /(node_modules|bower_components)/
            },
            {
                test: /\.styl$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader?camelCase&modules&importLoaders=1&localIdentName=[path][name]__[local]--[hash:base64:5]',
                    'stylus-loader'
                ],
                exclude: [
                    path.resolve(__dirname, 'src/web/styles')
                ]
            },
            {
                test: /\.styl$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader?camelCase',
                    'stylus-loader'
                ],
                include: [
                    path.resolve(__dirname, 'src/web/styles')
                ]
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(png|jpg|svg)$/,
                loader: 'url-loader',
                options: {
                    limit: 8192
                }
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    mimetype: 'application/font-woff'
                }
            },
            {
                test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'file-loader'
            }
        ]
    },
    node: {
        fs: 'empty',
        net: 'empty',
        tls: 'empty'
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                cache: true,
                parallel: true,
                sourceMap: true
            }),
            new OptimizeCSSAssetsPlugin()
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production'),
                BUILD_VERSION: JSON.stringify(buildVersion),
                LANGUAGES: JSON.stringify(buildConfig.languages),
                TRACKING_ID: JSON.stringify(buildConfig.analytics.trackingId)
            }
        }),
        new stylusLoader.OptionsPlugin({
            default: {
                // nib - CSS3 extensions for Stylus
                use: [nib()],
                // no need to have a '@import "nib"' in the stylesheet
                import: ['~nib/lib/nib/index.styl']
            }
        }),
        new webpack.ContextReplacementPlugin(
            /moment[\/\\]locale$/,
            new RegExp('^\./(' + without(buildConfig.languages, 'en').join('|') + ')$')
        ),
        // Generates a manifest.json file in your root output directory with a mapping of all source file names to their corresponding output file.
        new ManifestPlugin({
            fileName: 'manifest.json'
        }),
        new MiniCssExtractPlugin({
            filename: `[name].css?_=${timestamp}`,
            chunkFilename: `[id].css?_=${timestamp}`
        }),
        new CSSSplitWebpackPlugin({
            size: 4000,
            imports: '[name].[ext]?[hash]',
            filename: '[name]-[part].[ext]?[hash]',
            preserve: false
        }),
        new HtmlWebpackPlugin({
            filename: 'index.hbs',
            template: path.resolve(__dirname, 'src/web/assets/index.hbs'),
            chunksSortMode: 'dependency' // Sort chunks by dependency
        })
    ],
    resolve: {
        modules: [
            path.resolve(__dirname, 'src'),
            'node_modules'
        ],
        extensions: ['.js', '.jsx']
    }
};
