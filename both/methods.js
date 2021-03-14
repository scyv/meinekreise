import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Random } from "meteor/random";
import { DateTime } from "luxon";
import { Notes, Conversations, Tags } from "./collections";
import { SETTINGS } from "./settings";

function normalizePrice(price) {
    return price
        .replace(/[€\s]/g, "")
        .replace(/[,\\.]/g, ".")
        .replace(/[^0-9\\.]/g, "");
}

function normalizeText(text) {
    return text.replace(/[^( -;)=(?-~)\x0D\x0A\x09öäüß]/gi, " ");
}

function ensureFieldGiven(value, fieldName) {
    if (!value) {
        throw new Meteor.Error("Bad Request", "missing " + fieldName);
    }
}

function ensureFieldLength(value, maxLength) {
    if (value.length > maxLength) {
        throw new Meteor.Error("Bad Request", "value too long");
    }
}

Meteor.methods({
    createNote(noteData) {
        check(noteData.title, String);
        check(noteData.description, String);
        check(noteData.price, String);
        check(noteData.pictures, [{ src: String, name: String }]);
        check(noteData.contact, String);
        check(noteData.email, String);
        check(noteData.category, String);
        check(noteData.tags, [String]);

        ensureFieldGiven(noteData.title, "title");
        ensureFieldGiven(noteData.description, "description");
        ensureFieldGiven(noteData.email, "email");

        ensureFieldLength(noteData.title, 100);
        ensureFieldLength(noteData.description, 4000);
        ensureFieldLength(noteData.price, 10);
        ensureFieldLength(noteData.pictures, 5);
        ensureFieldLength(noteData.contact, 250);
        ensureFieldLength(noteData.email, 250);
        ensureFieldLength(noteData.category, 50);
        ensureFieldLength(noteData.tags, 100);

        noteData.price = normalizePrice(noteData.price);

        const adminKey = Random.id(128);
        const noteId = Notes.insert({
            title: noteData.title,
            description: noteData.description,
            createdAt: new Date(),
            activatedAt: new Date(),
            status: "active",
            adminKey: adminKey,
            price: noteData.price,
            category: noteData.category,
            pictures: noteData.pictures,
            contact: noteData.contact,
            email: noteData.email,
            tags: noteData.tags,
            visits: 0,
        });

        noteData.tags.forEach((tag) => {
            const existingTag = Tags.findOne({ name: tag });
            if (existingTag) {
                Tags.update({ _id: existingTag._id }, { $inc: { usage: 1 } });
            } else {
                Tags.insert({ name: tag });
            }
        });

        this.unblock();
        if (Meteor.isServer) {
            import mailConfig from "../server/mail.config";
            import { Emails } from "../server/Emails";

            calculateThumbnail(adminKey, noteData.pictures);
            const rootUrl = Meteor.absoluteUrl();
            const subject = "Regenbogenbörse: Artikel erstellt";
            const deactivationDate = DateTime.local().plus(SETTINGS.deactivationThreshold).toFormat("dd.MM.yyyy");
            const deletionDate = DateTime.local().plus(SETTINGS.deletionThreshold).toFormat("dd.MM.yyyy");

            new Emails("noteCreated.txt").send({
                to: noteData.email,
                from: mailConfig.imap.user,
                subject,
                params: [
                    {
                        key: "$$TITLE$$",
                        value: noteData.title,
                    },
                    {
                        key: "$$VIEW_LINK$$",
                        value: `${rootUrl}artikel/${noteId}`,
                    },
                    {
                        key: "$$EDIT_LINK$$",
                        value: `${rootUrl}bearbeiten/${adminKey}`,
                    },
                    {
                        key: "$$DEACTIVATION_DATE$$",
                        value: deactivationDate,
                    },
                    {
                        key: "$$DELETION_DATE$$",
                        value: deletionDate,
                    },
                ],
            });
        }
        return {
            id: noteId,
            adminKey: adminKey,
        };
    },
    updateNote(noteData) {
        check(noteData.title, String);
        check(noteData.description, String);
        check(noteData.price, String);
        check(noteData.pictures, [{ src: String, name: String }]);
        check(noteData.contact, String);
        check(noteData.email, String);
        check(noteData.tags, [String]);

        ensureFieldGiven(noteData.title, "title");
        ensureFieldGiven(noteData.description, "description");
        ensureFieldGiven(noteData.email, "email");

        ensureFieldLength(noteData.title, 100);
        ensureFieldLength(noteData.description, 4000);
        ensureFieldLength(noteData.price, 10);
        ensureFieldLength(noteData.pictures, 5);
        ensureFieldLength(noteData.contact, 250);
        ensureFieldLength(noteData.email, 250);
        ensureFieldLength(noteData.tags, 100);

        noteData.price = normalizePrice(noteData.price);

        Notes.update(
            { adminKey: noteData.adminKey },
            {
                $set: {
                    title: noteData.title,
                    description: noteData.description,
                    price: noteData.price,
                    pictures: noteData.pictures,
                    contact: noteData.contact,
                    email: noteData.email,
                    tags: noteData.tags,
                },
            }
        );
        noteData.tags.forEach((tag) => {
            if (!Tags.findOne({ name: tag })) {
                Tags.insert({ name: tag });
            }
        });

        if (Meteor.isServer) {
            calculateThumbnail(noteData.adminKey, noteData.pictures);
        }
    },
    closeNote(adminKey) {
        const note = Notes.findOne({ adminKey: adminKey });
        if (note) {
            Notes.remove({ _id: note._id });
        }
    },
    reactivateNote(adminKey) {
        check(adminKey, String);
        Notes.update({ adminKey: adminKey }, { $set: { status: "active", activatedAt: new Date() } });
    },
    logVisits(noteId) {
        check(noteId, String);
        Notes.update({ _id: noteId }, { $inc: { visits: 1 } });
    },
    sendMessageFromInterestedParty(messageData) {
        if (Meteor.isServer) {
            import mailConfig from "../server/mail.config";
            import { Emails } from "../server/Emails";

            check(messageData.message, String);
            check(messageData.email, String);
            check(messageData.noteId, String);

            messageData.email = messageData.email.toLowerCase();

            this.unblock();

            const note = Notes.findOne({ _id: messageData.noteId });
            if (note) {
                const conversation = Conversations.findOne({
                    noteId: note._id,
                    correspondent: messageData.email,
                });
                let convId = conversation._id;
                if (!conversation) {
                    convId = Conversations.insert({
                        noteId: note._id,
                        correspondent: messageData.email,
                    });
                }

                const subject = `Regenbogenbörse: Anfrage zu Artikel ${note.title} [${convId}]`;

                new Emails("conversation.txt").send({
                    to: note.email,
                    from: mailConfig.imap.user,
                    subject,
                    params: [
                        {
                            key: "$$TITLE$$",
                            value: note.title,
                        },
                        {
                            key: "$$TEXT$$",
                            value: normalizeText(messageData.message),
                        },
                    ],
                });
            }
        }
    },
});

function calculateThumbnail(adminKey, pictures) {
    if (pictures && pictures.length > 0) {
        const imageThumbnail = require("image-thumbnail");
        const pic = pictures[0];
        try {
            const options = { width: 200, height: 200, responseType: "base64" };
            // 23 => data:image/jpeg;base64,
            imageThumbnail(pic.src.substring(23), options).then((data) => {
                Notes.update({ adminKey: adminKey }, { $set: { thumbnail: "data:image/jpeg;base64," + data } });
            });
        } catch (err) {
            console.error("Could not create thumbnail for " + adminKey);
        }
    }
}
