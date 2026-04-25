const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/committees',
    method: 'GET',
    headers: {
        'Accept-Language': 'en'
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        try {
            const data = JSON.parse(body);
            console.log(`Received ${data.length} committees`);
        } catch (e) {
            console.log('BODY:', body);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
