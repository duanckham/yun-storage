global.CONFIG = {
	OAUTH_ID: '02m45oc8f90os3z65pqau3kv9gry78ab',
	OAUTH_SECRET: 'yun',
	APP_USERAGENT_SIGN: 'Yun web-view',
	DEV_MODE: process.env.LOGNAME === 'vagrant' ? true : false,
	BLOCK_SIZE: 500*1024,
	PORT: 10005,
	DB: {
		STORAGE: 'mongodb://192.168.3.12:27017/yun-storage'
	}
};