var fs = require('fs');
var child_process = require('child_process')

var THRESHOLD = 50;
var PATH = '/tmp/storage-cache-';
var rank = {};
var running = false;

var heartbeat = function() {
	if (running) 
		return;

	running = true;

	setInterval(function() {
		rank = {};
	}, 1000 * 60);

	setInterval(function() {
		clean();
	}, 30 * 1000);
};

var clean = function() {
	child_process.exec('rm /tmp/storage-cache-*');
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
	heartbeat();

	fs.exists(PATH + uid, function(exists) {
		exists
			? fs.readFile(PATH + uid, callback)
			: callback('NOT_FOUND', null);
	});
};

exports.save = save;
exports.read = read;