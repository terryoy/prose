const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: path.resolve(__dirname, 'src/scripts/app.js'),
    output: {
      filename: isProduction ? 'assets/js/[name].[contenthash:8].js' : 'assets/js/[name].js',
      chunkFilename: isProduction ? 'assets/js/[name].[contenthash:8].js' : 'assets/js/[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    resolve: {
      extensions: ['.js'],
      fallback: {
        buffer: require.resolve('buffer/'),
      },
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
        {
          test: /\.s?css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: !isProduction,
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: !isProduction,
              },
            },
          ],
        },
        {
          test: /\.txt$/,
          type: 'asset/source',
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/img/[name][hash][ext][query]',
          },
        },
        {
          test: /\.(woff2?|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name][hash][ext][query]',
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'site/index.html'),
      }),
      new MiniCssExtractPlugin({
        filename: isProduction ? 'assets/css/[name].[contenthash:8].css' : 'assets/css/[name].css',
      }),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.DefinePlugin({
        'process.env': JSON.stringify({
          NODE_ENV: process.env.NODE_ENV || (isProduction ? 'production' : 'development'),
          API_URL: process.env.API_URL || '',
          STATUS_URL: process.env.STATUS_URL || '',
          SITE_URL: process.env.SITE_URL || '',
          OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID || '',
          GATEKEEPER_HOST: process.env.GATEKEEPER_HOST || '',
        }),
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'site'),
            to: '.',
            globOptions: {
              ignore: ['**/index.html'],
            },
            noErrorOnMissing: true,
          },
        ],
      }),
    ],
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'dist'),
      },
      historyApiFallback: true,
      hot: true,
      port: 3000,
      open: false,
    },
    performance: {
      hints: false,
    },
  };
};
