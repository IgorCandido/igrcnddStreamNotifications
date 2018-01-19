/* eslint-disable quote-props */
'use strict';

module.exports = {
	context: __dirname,
	entry: {
		'nodecg-replicant-built': './nodecg-replicant.js'
	},
	output: {
		filename: '[name].js',
		path: __dirname
	},
	devtool: 'source-map'
};
