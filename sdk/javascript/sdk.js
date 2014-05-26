var YunStorage = function(settings) {
	this.settings = settings;
	this.listeners = {};
	this.uploader;
	return this.init();
};

YunStorage.prototype.init = function() {
	this.loadPluploadJS(this.initUploader.bind(this));
	return this;
};

YunStorage.prototype.initUploader = function() {
	var self = this;

	this.uploader = new plupload.Uploader({
		browse_button: this.settings.browse_button,
		url: 'http://storage.yunpro.cn/upload'
	});

	document.getElementById(this.settings.upload_button).onclick = function() {
		self.uploader.start();
	};

	this.uploader.bind('UploadProgress', function(up, file) {
		self.emit('progress', file.percent);
	});

	this.uploader.bind('FileUploaded', function(up, file, res) {
		self.emit('end', JSON.parse(res.response));
	});

	this.uploader.bind('FilesAdded', function(up, file, res) {
		self.emit('change', {});
	});

	this.uploader.init();
};

YunStorage.prototype.loadPluploadJS = function(callback) {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = 'http://storage.yunpro.cn/javascript/plupload.full.min.js';
	document.body.appendChild(script);

	var loop = setInterval(function() {
		if (typeof plupload === 'object') {
			clearInterval(loop);
			callback();
		}
	}, 500);
};

YunStorage.prototype.upload = function() {
	self.uploader.start();
};

YunStorage.prototype.on = function(event_name, callback) {
	if (!this.listeners[event_name])
		this.listeners[event_name] = [];

	this.listeners[event_name].push(callback);
};

YunStorage.prototype.emit = function(event_name, data) {
	this.listeners[event_name].forEach(function(callback) {
		callback(data);
	});
};