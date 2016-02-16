'use strict';

let webpack = require('webpack'),
	path = require('path');

const PATH_NODE_MODULES = path.resolve(__dirname, './node_modules');
const PATH_BOWER_MODULES = path.resolve(__dirname, './bower_components');

module.exports = {
	resolve: {
		extensions: ['', '.js', '.jsx'],
		modulesDirectories: [
			PATH_NODE_MODULES,
			PATH_BOWER_MODULES,
			path.join(__dirname, './src')
		],
	},
	devtool: 'inline-source-map',
	plugins: [
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false
			}
		}),
		new webpack.NoErrorsPlugin(),
		new webpack.ResolverPlugin(
			new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('.bower.json', ['main'])
		)
	],
	module: {
		loaders: [{
			test: /\.(js|jsx)$/,
			loaders: [
				'babel-loader'
			],
			exclude: [
				PATH_NODE_MODULES
			]
		}]
	}
};
