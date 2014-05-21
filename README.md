FIRST
-----

Include this js in your frontend page.

```
<script src="http://storage.yunpro.cn/javascript/sdk.js"></script>
```

CREATE BUTTON HANDLE
--------------------

```
var storage = new YunStorage({
	browse_button: 'browse', // HTML ELEMENT'S ID
	upload_button: 'upload'
});
```

EVENTS
------

```
storage.on('progress', function(p) {
	console.log(p); // x%
});

storage.on('end', function(r) {
	console.log(r); // YOU WILL GET A FILE_ID AT HERE
});
```

API
---

`(POST) http://storage.yunpro.cn/upload`

`(POST) http://storage.yunpro.cn/tag/add {id: <string>, tag: <string>}`

`(POST) http://storage.yunpro.cn/tag/remove {id: <string>, tag: <string>}`

`(GET)  http://storage.yunpro.cn/tag/:tag`

`(GET)  http://storage.yunpro.cn/list/:user_id`

`(GET)  http://storage.yunpro.cn/file/:file_id`

`(GET)  http://storage.yunpro.cn/info/:file_id`