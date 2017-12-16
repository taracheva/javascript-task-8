'use strict';

const http = require('http');
const url = require('url');

const server = http.createServer();

let messages = [];

server.on('request', (req, res) => {
    const urlParsed = url.parse(req.url, true);
    var query = urlParsed.query;
    if (urlParsed.pathname === '/messages') {
        var method = req.method;
        if (method === 'GET') {
            let resultMessages = getMessages(query);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(resultMessages));
        }
        if (method === 'POST') {
            var body = '';
            req.on('data', function (chunk) {
                body += chunk.toString();
            });
            req.on('end', function () {
                let text = JSON.parse(body).text;
                let message = createMessage(text, query);
                messages.push(message);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(message));
            });
        }
    } else {
        res.statusCode = 404;
        res.end();
    }
});

function getMessages(query) {
    if (query.from === undefined && query.to === undefined) {
        return messages;
    }
    if (query.from === undefined) {
        return messages.filter(message => message.to === query.to);
    }
    if (query.to === undefined) {
        return messages.filter(message => message.from === query.from);
    }

    return messages.filter(message =>
        message.from === query.from &&
            message.to === query.to);
}

function createMessage(text, query) {
    let message = { text };
    if (query.from) {
        message.from = query.from;
    }
    if (query.to) {
        message.to = query.to;
    }

    return message;
}

module.exports = server;
