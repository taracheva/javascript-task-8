'use strict';

const http = require('http');
const url = require('url');

const server = http.createServer();

let messages = [];
let currentId = 1;

server.on('request', (req, res) => {
    const urlParsed = url.parse(req.url, true);
    var query = urlParsed.query;
    var method = req.method;

    if (urlParsed.pathname === '/messages') {
        if (method === 'GET') {
            sendMessages(query, res);
        }
        if (method === 'POST') {
            saveMessage(req, query, res);
        }
    } else if (urlParsed.pathname.startsWith('/messages/')) {
        if (method === 'DELETE') {
            deleteMessage(urlParsed, res);
        } else {
            updateMessage(urlParsed, res, req);
        }
    } else {
        res.statusCode = 404;
        res.end();
    }
});

function saveMessage(req, query, res) {
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

function sendMessages(query, res) {
    let resultMessages = getMessages(query);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(resultMessages));
}

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
    message.id = `id${currentId++}`;

    return message;
}

function deleteMessage(urlParsed, res) {
    let id = getId(urlParsed.path);
    messages = messages.filter(message => message.id !== id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
}

function updateMessage(urlParsed, res, req) {
    let id = getId(urlParsed.path);
    let message = messages.find(m => m.id === id);
    message.edited = true;

    var body = '';
    req.on('data', function (chunk) {
        body += chunk.toString();
    });
    req.on('end', function () {
        let text = JSON.parse(body).text;
        message.text = text;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(message));
    });
}

function getId(path) {
    return path.substring('/messages/'.length);
}

module.exports = server;
