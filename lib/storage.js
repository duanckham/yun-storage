var fs = require('fs');
var url = require('url');
var crypto = require('crypto');
var formidable = require('formidable');
var mongodb = require('mongodb');
var tools = require('./tools');
var Tailor = require('./tailor');
var Statistics = require('./statistics');
var DB = require('./db');
var config = require('../config');
var nullcb = function() {};

var Storage = function() {
	return this.init();
};

Storage.prototype.init = function() {
	CONFIG.DEV_MODE 
		? this.db = new DB('mongodb://127.0.0.1:27017/yun-storage')
		: this.db = new DB(CONFIG.DB.STORAGE);

	this.tailor = new Tailor();
	this.statistics = new Statistics();
};

Storage.prototype.uploader = function(req, res) {
	if (req.method === 'OPTIONS')
		return res.send(200);

	var self = this;
	var form = new formidable.IncomingForm();

	var saveFileInfo = function(uid, file, buf) {
		var dataInfo = {
			_id: uid,
			type: file.type,
			name: file.name,
			size: file.size,
			hash: file.hash,
			user: req.user.openID
		};

		self.db.collection('storage-info').set(dataInfo, nullcb);
	};

	var linkFileInfo = function(uid, file, fid) {
		var dataInfo = {
			_id: uid,
			type: file.type,
			name: file.name,
			size: file.size,
			link: fid,
			user: req.user.openID
		};

		self.db.collection('storage-info').set(dataInfo, nullcb);
	};

	var saveFileBlocks = function(uid, block_count, buf) {

		console.log('W', 'storage-blocks', uid, block_count, 'BLOCKS');

		for (var i = block_count; i--;) {
			var bin = new mongodb.Binary(buf.slice(i * CONFIG.BLOCK_SIZE, (i + 1) * CONFIG.BLOCK_SIZE));
			var dataBlock = {
				_id: uid + ':' + i,
				id: uid,
				num: i,
				count: block_count,
				block: bin
			};

			self.db.collection('storage-blocks').set(dataBlock, nullcb);
		}
	};

	form.parse(req, function(err, fields, files) {
		if (err) {
			console.error('; err', err);
			return res.send(500);
		}

		if (Object.keys(fields).length + Object.keys(files).length === 0) {
			console.error('; err fields and files');
			return res.send(500);
		}

		var uid = self.db.uid();
		var path = files.file.path;
		var name = files.file.name;
		var size = files.file.size;
		var type = files.file.type;
		var block_count = Math.ceil(size/CONFIG.BLOCK_SIZE);

		fs.readFile(path, function(err, buf) {
			if (err) {
				console.error('; err', err);
				return res.send(500);
			}

			files.file.hash = self.hash(buf);

			self.db.collection('storage-info').one({hash: files.file.hash}, function(info) {
				if (info) {
					linkFileInfo(uid, files.file, info._id);
				} else {
					saveFileInfo(uid, files.file, buf);
					saveFileBlocks(uid, block_count, buf);
				}

				res.send(JSON.stringify({success: true, data: {id: uid}}));
				fs.unlinkSync(path);
			});
		});
	});
};

Storage.prototype.readFile = function(req, res) {
	var self = this;
	var query = url.parse(req.url).query;
	var fid = req.params.file_id;

	var readFileBlocks = function(info) {
		self.db.collection('storage-blocks').get({id: info._id}, function(blocks) {
			var arr = [];
			var buf;

			console.log('R', 'storage-blocks', info._id, blocks.length, 'BLOCKS');

			// SORT BLOCKS
			blocks = blocks.sort(function(a, b) {
				return a.num > b.num;
			});

			// MERGE BUFFER
			for (var i = blocks.length; i--;)
				arr.push(blocks[i].block.buffer);

			buf = Buffer.concat(arr.reverse());

			// SETTING RESPONSE SOURCE TYPE
			if (info.type)
				res.type(info.type);

			// TAILOR
			if (info.type && info.type.indexOf('image') === 0 && query && query.split('x').length === 2) {
				var s = query.split('x');

				self.tailor.resize(buf, {w: s[0], h: s[1]}, function(err, result) {
					res.send(result);
				});
			} else {
				res.send(buf);
			}

			// STATISTICS
			self.statistics.countRead(info._id);
		});
	};

	this.db.collection('storage-info').one({_id: fid}, function(info) {
		if (!info)
			return res.send(404);

		info.link
			? self.db.collection('storage-info').one({_id: info.link}, readFileBlocks)
			: readFileBlocks(info);
	});
};

Storage.prototype.readInfo = function(req, res) {
	var self = this;
	var fid = req.params.file_id;

	this.db.collection('storage-info').one({_id: fid}, function(info) {
		if (!info)
			return res.send(JSON.stringify({success: false}));

		self.db.collection('storage-tags').one({_id: fid}, function(tags) {
			delete info.link;
			delete info.hash;

			info.tags = tags.tags;
			res.send(JSON.stringify(info));
		});
	});
};

Storage.prototype.addTag = function(req, res) {
	var self = this;
	var fid = req.body.id;
	var tag = req.body.tag;

	this.db.collection('storage-info').one({_id: fid}, function(info) {
		if (!info)
			return res.send(404);

		self.db.collection('storage-tags').one({_id: fid}, function(result) {
			if (result) {
				result.tags.push(tag);
				result.tags = tools.unique(result.tags);
				self.db.collection('storage-tags').set({_id: fid}, result, nullcb);
			} else {
				self.db.collection('storage-tags').set({_id: fid, tags: [tag]}, nullcb);
			}
		});
	});

	res.send(JSON.stringify({success: true}));
};

Storage.prototype.removeTag = function(req, res) {
	var self = this;
	var fid = req.body.id;
	var tag = req.body.tag;

	this.db.collection('storage-tags').one({_id: fid}, function(result) {
		if (result) {
			result.tags = tools.removeItem(result.tags, tag);
			self.db.collection('storage-tags').set({_id: fid}, result, nullcb);
		} else {
			self.db.collection('storage-tags').set({_id: fid, tags: []}, nullcb);
		}
	});
};

Storage.prototype.listByUser = function(req, res) {
	if (req.params.user_id !== req.user.openID)
		return res.send(JSON.stringify({success: false}));

	this.db.collection('storage-info').get({user: req.params.user_id}, function(results) {
		res.send(JSON.stringify({success: true, data: results}));
	});
};

Storage.prototype.listByTag = function(req, res) {
	this.db.collection('storage-tags').get({tags: {$in: [req.params.tag]}}, function(results) {
		res.send(JSON.stringify({success: true, data: results}));
	});
};

Storage.prototype.hash = function(arg) {
	return crypto.createHash('md5').update(arg).digest('hex');
};

module.exports = Storage;