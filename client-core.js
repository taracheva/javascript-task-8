'use strict';

module.exports.execute = execute;
module.exports.isStar = false;

const request = require('request');
const chalk = require('chalk');

const red = chalk.hex('#f00');
const green = chalk.hex('#0f0');

function execute() {
    const parser = require('minimist');
    const args = parser(process.argv.slice(2));

    let command = args._[0];
    let from = args.from;
    let to = args.to;
    let text = args.text;

    if (command === 'list') {
        return showMessages(from, to);
    } else if (command === 'send') {
        return sendMessage(from, to, text);
    }
}

function showMessages(from, to) {
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
                    let result = messages.map(message => messageToString(message));
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

function sendMessage(from, to, text) {
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
                    resolve(messageToString(message));
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

function messageToString(message) {
    let result = '';
    if (message.from) {
        result += `${red('FROM')}: ${message.from}\n`;
    }
    if (message.to) {
        result += `${red('TO')}: ${message.to}\n`;
    }
    result += `${green('TEXT')}: ${message.text}`;

    return result;
}
