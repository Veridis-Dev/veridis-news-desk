module.exports = {
	presets: [
		[ '@babel/preset-typescript', { allExtensions: true, isTSX: true } ],
		[ '@babel/preset-react', { runtime: 'automatic' } ],
	],
	plugins: [
		[
			'@wordpress/babel-plugin-makepot',
			{ output: '.i18n-cache/veridis-news-desk-js.pot' },
		],
	],
};
