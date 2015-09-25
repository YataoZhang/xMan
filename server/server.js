var PORT = 3000;
var http = require('http');
var url = require('url');
var formPost = function (content, response, cookie) {
    var header = {
        'content-type': 'text/html',
        'set-cookie': cookie
    };
    response.writeHead(200, header);
    response.end('<html><head><script>window.name=' + JSON.stringify(content) + ';location.href="about:blank";</script></head><body></body></html>');
};
var server = http.createServer(function (request, response) {
    var urlobj = url.parse(request.url, true);
    var pathname = urlobj.pathname;
    if (pathname === '/form') {
        formPost('hello world', response);
        return;
    }
    if (pathname === '/jsonp') {
        response.writeHead(200, {'content-type': 'application/json'});
        response.end(urlobj.query.cb + '(' + JSON.stringify({name: "jsonp"}) + ')');
        return;
    }
    if (pathname === '/cors') {
        response.writeHead(200, {'Access-Control-Allow-Origin': '*'});
        response.end('this is cors demo');
        return;
    }
    response.writeHead(500);
    response.end('path error')
});
server.listen(PORT, function () {
    console.log('start over')
});