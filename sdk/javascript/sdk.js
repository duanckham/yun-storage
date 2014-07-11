var YunStorage = function(settings) {
	this.settings = settings;
	this.listeners = {};
	this.uploader;

	this.fixBrowser();
	this.init();

	return this;
};

YunStorage.prototype.init = function() {
	this.loadPluploadJS(this.initUploader.bind(this));
	return this;
};

YunStorage.prototype.fixBrowser = function() {
	if (!Function.prototype.bind) {
		Function.prototype.bind = function(oThis) {
			if (typeof this !== 'function')
				throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');

			var aArgs = Array.prototype.slice.call(arguments, 1),
				fToBind = this,
				fNOP = function() {},
				fBound = function() {
					return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
				};

			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();

			return fBound;
		};
	}

	if (!Array.prototype.forEach) {
		Array.prototype.forEach = function(callback, thisArg) {
			var T, k;

			if (this == null)
				throw new TypeError('this is null or not defined');

			var O = Object(this);
			var len = O.length >>> 0;

			if (typeof callback !== 'function')
				throw new TypeError(callback + ' is not a function');

			if (arguments.length > 1)
				T = thisArg;

			k = 0;

			while (k < len) {
				var kValue;

				if (k in O) {
					kValue = O[k];
					callback.call(T, kValue, k, O);
				}

				k++;
			}
		};
	}
};

YunStorage.prototype.initUploader = function() {
	var self = this;

	this.settings.server = this.settings.server || 'http://storage.yunpro.cn';
	this.uploader = new plupload.Uploader({
		browse_button: this.settings.browse_button,
		url: this.settings.server + '/upload'
	});

	try {
		document.getElementById(this.settings.upload_button).onclick = function() {
			self.uploader.start();
		};	
	} catch (err) {}

	this.uploader.bind('UploadProgress', function(up, file) {
		self.emit('progress', file.percent);
	});

	this.uploader.bind('FileUploaded', function(up, file, res) {
		self.emit('end', JSON.parse(res.response));
	});

	this.uploader.bind('FilesAdded', function(up, files, res) {
		self.emit('change', files);
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

YunStorage.prototype.files = function() {
	return this.uploader.files;
};

YunStorage.prototype.get = function(id) {
	return this.uploader.getFile(id);
};

YunStorage.prototype.remove = function(id) {
	return this.uploader.removeFile(id);	
};

YunStorage.prototype.clean = function() {
	var files = this.files();
	
	for (var i = files.length; i > 0; i--)
		this.remove(files[i - 1].id);
};

YunStorage.prototype.upload = function() {
	this.uploader.start();
	return this;
};

YunStorage.prototype.on = function(event_name, callback) {
	if (!this.listeners[event_name])
		this.listeners[event_name] = [];

	this.listeners[event_name].push(callback);
};

YunStorage.prototype.emit = function(event_name, data) {
	if (this.listeners && this.listeners[event_name]) {
		this.listeners[event_name].forEach(function(callback) {
			callback(data);
		});	
	}
};

YunStorage.prototype.destory = function() {
	this.uploader.destroy();
	this.listeners = false;
};