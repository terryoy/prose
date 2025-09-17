const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env = {}, argv = {}) => {
  const isProduction = argv.mode === 'production';

  const plugins = [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'site/index.html'),
      inject: 'body',
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
  ];

  if (isProduction) {
    plugins.push(
      new MiniCssExtractPlugin({
        filename: 'assets/css/[name].[contenthash].css',
        chunkFilename: 'assets/css/[name].[contenthash].css',
      }),
    );
  }

  return {
    entry: path.resolve(__dirname, 'src/scripts/app.js'),
    output: {
      filename: isProduction ? 'assets/js/[name].[contenthash].js' : 'assets/js/[name].js',
      chunkFilename: isProduction ? 'assets/js/[name].[contenthash].js' : 'assets/js/[name].js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/',
      clean: true,
      assetModuleFilename: 'assets/[hash][ext][query]',
    },
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
    module: {
      rules: [
        {
          test: /\.js$/u,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
        {
          test: /\.(scss|css)$/u,
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
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/iu,
          type: 'asset/resource',
          generator: {
            filename: 'assets/img/[name][hash][ext][query]',
          },
        },
        {
          test: /\.(woff2?|eot|ttf|otf)$/iu,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name][hash][ext][query]',
          },
        },
        {
          test: /\.txt$/u,
          type: 'asset/source',
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.json'],
    },
    plugins,
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'dist'),
      },
      port: 3000,
      hot: true,
      historyApiFallback: true,
      open: false,
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
    },
  };
};
