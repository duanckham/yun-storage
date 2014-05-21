exports.unique = function(arr) {

	console.log(arr);

	var _self = arr.concat();
	var _temp = arr.concat().sort();

	_temp.sort(function(a, b) {
		if (a == b)
			_self.splice(_self.indexOf(a), 1);
	});

	return _self;
};

exports.removeItem = function(arr, value) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] === value) {
			arr.splice(i, 1);
			break;
		}
	}
	
	return arr;
};