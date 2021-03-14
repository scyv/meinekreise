import { Meteor } from "meteor/meteor";
import sanitizeHtml from "sanitize-html";

import { Notes } from "../both/collections";
import config from "./mail.config";

const _ = require("lodash");
const imaps = require("imap-simple");

process.env.MAIL_URL = `smtps://${config.imap.user}:${config.imap.password}@${config.imap.host}:465`;

const checkAndProcessMails = () => {
    imaps.connect(config).then(function (connection) {
        connection
            .openBox("INBOX")
            .then(function () {
                const searchCriteria = ["ALL"];
                const fetchOptions = { bodies: ["HEADER", "TEXT"], struct: true };
                return connection.search(searchCriteria, fetchOptions);
            })
            .then(function (messages) {
                let taskList = messages.map(function (message) {
                    return new Promise((res, rej) => {
                        const headerPart = _.find(message.parts, { which: "HEADER" });
                        let subject = headerPart.body.subject[0];
                        let to = headerPart.body.to[0];
                        const parts = imaps.getParts(message.attributes.struct);
                        const inboxMatch = to.match(/inbox-([a-z0-9]+)/i);
                        if (inboxMatch) {
                            parts.forEach(function (part) {
                                connection.getPartData(message, part).then(function (partData) {
                                    if (
                                        part.disposition == null &&
                                        part.encoding != "base64" &&
                                        part.subtype === "plain"
                                    ) {
                                        processMessage(inboxMatch[1], subject, partData);
                                    }
                                });
                            });
                        }

                        connection.addFlags(message.attributes.uid, "Deleted", (err) => {
                            if (err) {
                                console.error("Problem marking message for deletion");
                                rej(err);
                            }

                            res();
                        });
                    });
                });

                return Promise.all(taskList).then(() => {
                    connection.imap.closeBox(true, (err) => {
                        if (err) {
                            console.error(err);
                        }
                    });
                    connection.end();
                });
            });
    });
};

Meteor.setInterval(checkAndProcessMails, 60000 * 5);

function normalizeText(text) {
    return sanitizeHtml(text.replace("<br>", "\n"), {
        allowedTags: [],
    })
        .replace(/[^( -;)=(?-~)\x0D\x0A\x09öäüß]/gi, " ")
        .replace("&gt;", ">");
}

function normalizeFrom(from) {
    const match = from.toLowerCase().match(/<([^>]+)/i);
    if (match) {
        return match[1];
    }
    return from;
}

function processMessage(inboxId, subject, text) {
    console.log("Processing " + inboxId + ": " + subject);

    // TODO insert note for user with given inboxId
}
