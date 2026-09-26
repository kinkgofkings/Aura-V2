const http = require('http');
http.get('http://localhost:3000/api/proxy/pdf?url=https://www.thebibleunpacked.net/studies/TBU_Foundations_Study_A.pdf', (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers['content-type']);
    res.on('data', () => {});
    res.on('end', () => console.log('Done'));
}).on('error', (e) => {
    console.error(e);
});
