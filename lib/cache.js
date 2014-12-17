var fs = require('fs');

var THRESHOLD = 50;
var PATH = '/tmp/storage-cache-';
var rank = {};

var heartbeat = function() {
	setInterval(function() {
		rank = {};
	}, 1000 * 60);

	setInterval(function() {
		clean();
	}, 1000 * 60 * 30);
};

var clean = function() {
	console.log();
};

var save = function(uid, buf) {
	rank[uid]
		? rank[uid]++
		: rank[uid] = 1;

	if (rank[uid] == THRESHOLD)
		fs.writeFile(PATH + uid + '.ing', buf, function(err) {
			if (!err)
				fs.renameSync(PATH + uid + '.ing', PATH + uid);
		});
};

var read = function(uid, callback) {
	fs.exists(PATH + uid, function(exists) {
		exists
			? fs.readFile(PATH + uid, callback)
			: callback('NOT_FOUND', null);
	});
};

exports.save = save;
exports.read = read;