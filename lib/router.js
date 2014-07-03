var express = require('express');
var Storage = require('./storage');

var router = express.Router();
var storage = new Storage();


router.all('/*', function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', req.headers && req.headers.origin ? req.headers.origin : '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);

	if (req.method === 'POST')
		console.log('this is a POST req.', req.url);

	if (req.method === 'OPTIONS')
		return res.send(200);

	next();
})

router.get('/', function (req, res) {
	res.send('update, 20140701');
});

router.all('/upload', storage.uploader.bind(storage));
router.all('/tag/add', storage.addTag.bind(storage));
router.all('/tag/remove', storage.removeTag.bind(storage));
router.get('/tag/:tag', storage.listByTag.bind(storage));
router.get('/list/:user_id', storage.listByUser.bind(storage));
router.get('/file/:file_id', storage.readFile.bind(storage));
router.get('/info/:file_id', storage.readInfo.bind(storage));

module.exports = router;