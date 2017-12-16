'use strict';

module.exports.execute = execute;
module.exports.isStar = true;

const request = require('request');
const chalk = require('chalk');

const red = chalk.hex('#f00');
const green = chalk.hex('#0f0');
const yellow = chalk.hex('#ff0');
const gray = chalk.hex('#777');

function execute() {
    const parser = require('minimist');
    const args = parser(process.argv.slice(2));

    let command = args._[0];
    let from = args.from;
    let to = args.to;
    let text = args.text;
    let isDetailed = args.v;

    if (command === 'list') {
        return showMessages(from, to, isDetailed);
    }
    if (command === 'send') {
        return sendMessage(from, to, text, isDetailed);
    }
    if (command === 'delete') {
        return deleteMessage(args.id);
    }
    if (command === 'edit') {
        return editMessage(args.id, text, isDetailed);
    }
}

function showMessages(from, to, isDetailed) {
    return new Promise((resolve, reject) => {
        let req = request
            .get({ uri: 'http://localhost:8080/messages', qs: createQueryParams(from, to) })
            .on('response', res => {
                let body = '';
                res.on('data', function (chunk) {
                    body += chunk.toString();
                });

                res.on('end', function () {
                    let messages = JSON.parse(body);
                    let result = messages.map(message => messageToString(message, isDetailed));
                    let m = result.join('\n\n');
                    resolve(m);
                });
            });
        req.on('error', function (err) {
            reject(err);
        });

        req.end();
    });
}

function sendMessage(from, to, text, isDetailed) {
    return new Promise((resolve, reject) => {
        let req = request
            .post({ uri: 'http://localhost:8080/messages', qs: createQueryParams(from, to) })
            .on('response', res => {
                let body = '';
                res.on('data', function (chunk) {
                    body += chunk.toString();
                });

                res.on('end', function () {
                    let message = JSON.parse(body);
                    resolve(messageToString(message, isDetailed));
                });
            });
        req.on('error', function (err) {
            console.info('вот здесь ошибка');
            reject(err);
        });

        req.write(JSON.stringify({ text }));
        req.end();
    });
}

function deleteMessage(id) {
    return new Promise((resolve, reject) => {
        request
            .delete({ uri: `http://localhost:8080/messages/${id}` })
            .on('response', res => {
                res.on('end', function () {
                    resolve('DELETED');
                });
            })
            .on('error', function (err) {
                console.info('вот здесь ошибка');
                reject(err);
            });
    });
}

function editMessage(id, text, isDetailed) {
    return new Promise((resolve, reject) => {
        let req = request
            .patch({ uri: `http://localhost:8080/messages/${id}` })
            .on('response', res => {
                let body = '';
                res.on('data', function (chunk) {
                    body += chunk.toString();
                });

                res.on('end', function () {
                    let message = JSON.parse(body);
                    resolve(messageToString(message, isDetailed));
                });
            });
        req.on('error', function (err) {
            console.info('вот здесь ошибка');
            reject(err);
        });

        req.write(JSON.stringify({ text }));
        req.end();
    });
}

function createQueryParams(from, to) {
    let queryParams = {};
    if (from) {
        queryParams.from = from;
    }
    if (to) {
        queryParams.to = to;
    }

    return queryParams;
}

function messageToString(message, isDetailed) {
    let result = '';
    if (isDetailed) {
        result += `${yellow('ID')}: ${message.id}\n`;
    }
    if (message.from) {
        result += `${red('FROM')}: ${message.from}\n`;
    }
    if (message.to) {
        result += `${red('TO')}: ${message.to}\n`;
    }
    result += `${green('TEXT')}: ${message.text}`;
    if (message.edited) {
        result += gray('(edited)');
    }

    return result;
}
