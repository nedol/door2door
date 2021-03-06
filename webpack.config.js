const path = require('path');

const webpack = require('webpack'); //to access built-in plugins

var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
const NODE_ENV = process.env.NODE_ENV //|| 'development';

var JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {

    devtool: NODE_ENV ==='development'?'cheap-inline-module-source-map':false,
    // context: __dirname+'/js',

    entry: {
        // 'supplier': __dirname+'/src/supplier/supplier.entry.js'
        // ,'supplier_offer': __dirname+'/src/supplier/supplier.offer.frame.js'
        // ,'supplier_profile':__dirname+'/src/profile/profile.supplier.js'
        // ,'supplier_settings':__dirname+'/src/supplier/supplier.settings.js'
        // ,'supplier_customer_frame': __dirname+'/src/supplier/customer.frame.js'
        // ,
        // 'deliver': __dirname+'/src/deliver/deliver.entry.js'
        // ,'deliver_offer': __dirname+'/src/deliver/deliver.offer.frame.js'
        // ,'deliver_settings':__dirname+'/src/deliver/deliver.settings.js'
        // ,'deliver_profile':__dirname+'/src/profile/profile.deliver.js'
        // ,'deliver_customer_frame': __dirname+'/src/deliver/customer.frame.js'
        //
        'customer': __dirname+'/src/customer/customer.entry.js'
        ,'customer_order': __dirname+'/src/customer/customer.order.frame.js'
        ,'customer_profile':__dirname+'/src/profile/profile.customer.js'
        ,'customer_settings':__dirname+'/src/customer/customer.settings.js'

        // ,'foodtruck_order':__dirname+'/src/foodtruck/foodtruck.order.js'
        // ,'customer_search':__dirname+'/src/search/customer.search.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: '[name]'
    },
    // watch: NODE_ENV ==='development',
    // watchOptions: {
    //     aggregateTimeout:100
    // },
    module: {
    noParse:/webpack-jquery-ui\/tabs.js/,
    noParse:/jquery-ui\/dialog.js/,
    noParse:/jquery-ui\/autocomplete.js/,
    noParse:/jquery-ui\/sortable.js/,
    noParse:/jquery-ui\/css.js/,
    noParse:/jquery-ui\/index.js/,
    noParse:/jquery-ui\/draggable.js/,
    noParse:/lodash\/lodash.js/,

rules: [
            {
                test: /\.(jpe?g|png|gif)$/i,
                loader:"file-loader",
                query:{
                    name:'[name].[ext]',
                    outputPath:'images/'
                    //the images will be emmited to public/assets/images/ folder
                    //the images will be put in the DOM <style> tag as eg. background: url(assets/images/image.png);
                }
            },
            {
                test: /\.css$/,
                loaders: ["style-loader","css-loader"]
            }
        ],
        loaders:[
            {
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            },
            { test: /\.css/, loader: "style-loader!css-loader" },
            { test: /\.less$/, loader: "style-loader!css-loader!less-loader" },
            //{ test: /\.jsx?$/, exclude: /(node_modules|bower_components)/, loader: 'babel?optional[]=runtime&stage=0'},
            { test: /\.png/, loader: "url-loader?limit=100000&mimetype=image/png" },
            { test: /\.gif/, loader: "url-loader?limit=100000&mimetype=image/gif" },
            { test: /\.jpg/, loader: "file-loader" },
            { test: /\.json/, loader: "json-loader" },
            { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' }
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({

            $: 'jquery',
            '$': 'jquery',
            jquery: 'jquery',
            jQuery: 'jquery',
            ol:'ol'
        }),
        new webpack.DefinePlugin({
            NODE_ENV: JSON.stringify(NODE_ENV),
            LANG: JSON.stringify('ru')
        }),
        new webpack.DefinePlugin({
            'process.browser': 'true'
        }),
        //new webpack.IgnorePlugin(/your_package_name_here/),
        // new HtmlWebpackPlugin({
        //    template: './dist/main.tmplt.html'
        // }),

        new webpack.NoEmitOnErrorsPlugin(),
        new ExtractTextPlugin('./src/html/css/main.css'),

        //, new webpack.optimize.CommonsChunkPlugin({
        //     name:'common'
        // })
        // new JavaScriptObfuscator({
        //     rotateUnicodeArray: true
        // }, ['supplier.js,customer.js'])
    ],
    resolve: {
        alias: {
            jquery: path.join(__dirname, 'node_modules/jquery/src/jquery'),
        },
    },
    externals: {

    }
};