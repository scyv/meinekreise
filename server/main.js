import { Meteor } from "meteor/meteor";

const imageThumbnail = require("image-thumbnail");

import { Notes, COLLECTIONS, Tags } from "../both/collections";

import "../both/methods";
import "./imap";

Meteor.startup(() => {
    Notes.find({ thumbnail: null }).forEach((art) => {
        const pictures = art.pictures;
        if (pictures && pictures.length > 0) {
            const pic = pictures[0];
            try {
                if (pic.src.indexOf("image/jpeg")) {
                    console.log("Creating Thumbnail for " + art._id + " - " + art.title);
                    const options = { width: 200, height: 200, fit: "outside", responseType: "base64" };
                    imageThumbnail(pic.src.substring(pic.src.indexOf("base64") + 7), options).then((data) => {
                        Notes.update({ _id: art._id }, { $set: { thumbnail: "data:image/jpeg;base64," + data } });
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }
    });
});

Meteor.publish(COLLECTIONS.NOTES, function () {
    return Notes.find(
        {},
        {
            limit: 50,
            sort: { activatedAt: -1 },
            fields: { adminKey: 0, email: 0, pictures: 0 },
        }
    );
});

Meteor.publish(COLLECTIONS.NOTES_DETAIL, function (noteId) {
    return Notes.find(
        { _id: noteId },
        {
            fields: { adminKey: 0, email: 0 },
        }
    );
});

Meteor.publish(COLLECTIONS.TAGS, function () {
    return Tags.find({}, { limit: 15, sort: { usage: -1 } });
});
