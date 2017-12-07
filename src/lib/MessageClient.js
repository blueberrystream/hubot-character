"use strict"

const format    = require("string-template");

class MessageClient {
    constructor(messageSender, character, robot) {
        this.messageSender = messageSender;
        this.character = character;
        this.robot = robot;
        this.cache = "";
    }

    postMessage(channel, speakerName) {
        const selectedOnceBefore = this.cache;

        if (this.character.messages) {
            const messages = (this.character.messages.length > 1 && selectedOnceBefore) ?
                this.character.messages.filter((m) => m !== selectedOnceBefore) :
                this.character.messages;
            const selected = random(messages);
            this.cache = selected;
            if( typeof selected === "object" ) {
                return this.postMultiMessage(selected, channel, speakerName);
            }
            const message = formatMessage(selected, speakerName);
            return this.messageSender(message, channel, this.character.name, this.character.icon);
        }

        if (this.character.json_url) {
            this.robot.http(this.character.json_url)
                .header('Accept', 'application/json')
                .get()((err, response, body) => {
                    let message = "";
                    if (err) {
                        message = err;
                    } else {
                        if (response.statusCode !== 200) {
                            message = 'response status code: ' + response.statusCode;
                        } else {
                            message = JSON.parse(body)[0];
                        }
                    }

                    return this.messageSender(message, channel, this.character.name, this.character.icon);
                });
        }
    }

    postMultiMessage(messages, channel, speakerName) {
        return messages.reduce((pre, setting) => {
            return pre.then((values) => {
                const message = formatMessage(selected, speakerName);
                return this.messageSender(message, channel, setting.name, setting.icon).then(
                    (v) => Promise.resolve(values.concat([v]))
                );
            });
        }, Promise.resolve([]));
    }
}

function random(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function formatMessage(message, name) {
    return message = format(message, {
      "name": name,
      "time": new Date().getTime()
    });
}

module.exports = MessageClient;
