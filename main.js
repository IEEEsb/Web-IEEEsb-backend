const express	= require('express');
const fs		= require('fs-extra');


fs.readFile('config.json').then((config) => {
	// Import the whole config as a global variable
	global.config = JSON.parse(config);

	const app = express();
});
