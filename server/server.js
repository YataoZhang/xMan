var PORT = 3000;

var http = require('http');
var url = require('url');
var fs = require('fs');
var mine = require('./mime').types;
var path = require('path');
var formPost = function (content, response, cookie) {
    "use strict";
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
        response.writeHead(200, {'Access-Control-Allow-Origin': 'http://localhost:63342',
            'Access-Control-Allow-Credentials': 'true'});
        response.end('this is cors demo');
        return;
    }
    var realPath = path.join("../", pathname);
    var ext = path.extname(realPath);
    ext = ext ? ext.slice(1) : 'unknown';
    fs.exists(realPath, function (exists) {
        if (!exists) {
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            response.write("This request URL " + pathname + " was not found on this server.");
            response.end();
        } else {
            fs.readFile(realPath, "binary", function (err, file) {
                if (err) {
                    response.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });
                    response.end(err);
                } else {
                    var contentType = mine[ext] || "text/plain";
                    response.writeHead(200, {
                        'Content-Type': contentType
                    });
                    response.write(file, "binary");
                    response.end();
                }
            });
        }
    });
});
server.listen(PORT, function () {
    console.log('start over')
});