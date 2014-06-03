var fs = require('fs');
var imageMagick = require('gm').subClass({imageMagick: true});

var Tailor = function() {
	return this.init();
};

Tailor.prototype.init = function() {
	return this;
};

Tailor.prototype.resize = function(buf, options, callback) {
	var tmp_path = '/tmp/yun.storage.' + Date.now();

	// fs.writeFileSync(tmp_path, buf);
	imageMagick(buf).resize(options.w, options.h).toBuffer(callback);
};

module.exports = Tailor;