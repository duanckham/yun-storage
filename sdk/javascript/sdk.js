var YunStorage = function(settings) {
	this.settings = settings;
	return this.init();
};

YunStorage.prototype.init = function() {
	this.loadPluploadJS(this.initUploader.bind(this));
	return this;
};

YunStorage.prototype.initUploader = function() {
	var uploader = new plupload.Uploader({
		browse_button: this.settings.browse_button,
		url: 'http://www.baidu.com/'
	});

	uploader.init();

	document.getElementById(this.settings.upload_button).onclick = function() {
		uploader.start();
	};
};

YunStorage.prototype.loadPluploadJS = function(callback) {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = '../javascript/plupload.full.min.js?' + Date.now();
	document.body.appendChild(script);

	var loop = setInterval(function() {
		if (typeof plupload === 'object') {
			clearInterval(loop);
			callback();
		}
	}, 500);
};