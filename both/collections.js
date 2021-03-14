import { Mongo } from "meteor/mongo";

export const COLLECTIONS = {
    NOTES: "notes",
    NOTES_ARCHIVE: "notesArchive",
    ARTICLES_ADMIN: "adminArticles",
    ARTICLES_DETAIL: "adminDetail",
    TAGS: "tags",
};

export const Notes = new Mongo.Collection(COLLECTIONS.NOTES);
export const NotesArchive = new Mongo.Collection(COLLECTIONS.NOTES_ARCHIVE);
export const Tags = new Mongo.Collection(COLLECTIONS.TAGS);
