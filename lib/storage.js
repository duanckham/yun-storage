var fs = require('fs');
var url = require('url');
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

	form.parse(req, function(err, fields, files) {
		
		console.log(err, fields, files);

		if (err) {
			console.error('; err', err);
			return res.send(501);
		}

		if (Object.keys(fields).length + Object.keys(files).length === 0) {
			console.error('; err fields and files');
			return res.send(502);
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
				return res.send(503);
			}

			for (var i = 0; i < block_count; i++) {
				var bin = new mongodb.Binary(buf.slice(i * CONFIG.BLOCK_SIZE, (i + 1) * CONFIG.BLOCK_SIZE));
				var data_block = {
					_id: uid + ':' + i,
					id: uid,
					num: i,
					count: block_count,
					block: bin
				};

				var data_info = {
					_id: uid,
					type: type,
					name: name,
					size: size,
					user: req.user.openID
				};

				self.db.collection('storage-blocks').set(data_block, nullcb);
				self.db.collection('storage-info').set(data_info, nullcb);
			}

			res.send({success: true, data: {id: uid}});
			fs.unlinkSync(path);
		});
	});
};

Storage.prototype.readFile = function(req, res) {
	var self = this;
	var query = url.parse(req.url).query;
	var fid = req.params.file_id;

	this.db.collection('storage-info').one({_id: fid}, function(info) {
		if (!info)
			return res.send(404);

		self.db.collection('storage-blocks').get({id: fid}, function(blocks) {
			var arr = [];
			var buf;

			// SORT BLOCKS
			blocks = blocks.sort(function(a, b) {
				return a.num > b.num;
			});

			// MERGE BUFFER
			for (var i = 0; i < blocks.length; i++)
				arr.push(blocks[i].block.buffer);

			buf = Buffer.concat(arr);

			// SETTING RESPONSE SOURCE TYPE
			res.type(info.type);

			// TAILOR
			if (info.type.indexOf('image') === 0 && query && query.split('x').length === 2) {
				var s = query.split('x');

				self.tailor.resize(buf, {w: s[0], h: s[1]}, function(err, result) {
					res.send(result);
				});
			} else {
				res.send(buf);
			}

			// STATISTICS
			self.statistics.countRead(fid);
		});
	});
};

Storage.prototype.readInfo = function(req, res) {
	var self = this;
	var fid = req.params.file_id;

	this.db.collection('storage-info').one({_id: fid}, function(info) {
		if (!info)
			return res.send({success: false});

		self.db.collection('storage-tags').one({_id: fid}, function(tags) {
			info.tags = tags.tags;
			res.send(info);
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

	res.send({success: true});
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
		return res.send({success: false});

	this.db.collection('storage-info').get({user: req.params.user_id}, function(results) {
		res.send({success: true, data: results});
	});
};

Storage.prototype.listByTag = function(req, res) {
	this.db.collection('storage-tags').get({tags: {$in: [req.params.tag]}}, function(results) {
		res.send({success: true, data: results});
	});
};

module.exports = Storage;