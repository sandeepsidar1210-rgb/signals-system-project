window.BASE_URL = (window.location.protocol === 'file:' || window.location.origin === 'null' || (window.location.hostname === 'localhost' && window.location.port === '5500'))
	? 'http://localhost:5000'
	: window.location.origin;
