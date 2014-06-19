var express = require('express');
var Storage = require('./storage');

var router = express.Router();
var storage = new Storage();

router.get('/', function(req, res) {
	res.send('update, 20140617');
});

router.all('/upload', storage.uploader.bind(storage));
router.all('/tag/add', storage.addTag.bind(storage));
router.all('/tag/remove', storage.removeTag.bind(storage));
router.get('/tag/:tag', storage.listByTag.bind(storage));
router.get('/list/:user_id', storage.listByUser.bind(storage));
router.get('/file/:file_id', storage.readFile.bind(storage));
router.get('/info/:file_id', storage.readInfo.bind(storage));

module.exports = router;