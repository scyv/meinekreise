import { Template } from "meteor/templating";
import { DateTime } from "luxon";

import { COLLECTIONS } from "../both/collections";

import "bootstrap/dist/js/bootstrap.bundle";

import "./main.html";
import "./loading/loading.html";

import "./login/login";

import "../both/methods";
import "./circles/circles";

import "./legal/datenschutz";
import "./legal/nutzungsbedingungen";
import "./legal/impressum";

export const uistate = {
    VIEW_LANDING: "landing",
    VIEW_NOTES: "notes",
    VIEW_CREATE_NOTE: "createNote",
    VIEW_EDIT_NOTE: "editNote",
    VIEW_SHOW_NOTE: "note",
    VIEW_NUTZUNGSBEDINGUNGEN: "nutzungsbedingungen",
    VIEW_DATENSCHUTZ: "datenschutz",
    VIEW_IMPRESSUM: "impressum",
    currentView: new ReactiveVar(this.VIEW_NOTES),
    currentNote: new ReactiveVar(),
    currentCategory: new ReactiveVar(),
    loading: new ReactiveVar(false),
};
window.uistate = uistate;

export let notesHandle;
export let noteDetailsHandle;

Tracker.autorun(() => {
    notesHandle = Meteor.subscribe(COLLECTIONS.NOTES);
    if (uistate.currentNote.get() != null)
        noteDetailsHandle = Meteor.subscribe(COLLECTIONS.NOTES_DETAIL, uistate.currentNote.get());
    Meteor.subscribe(COLLECTIONS.TAGS);
});

Template.registerHelper("formattedDate", (date) => {
    return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_HUGE);
});

Template.main.helpers({
    viewCreateNote() {
        return uistate.currentView.get() === uistate.VIEW_CREATE_NOTE;
    },
    viewShowNote() {
        return uistate.currentView.get() === uistate.VIEW_SHOW_NOTE;
    },
    viewShowNotes() {
        return uistate.currentView.get() === uistate.VIEW_NOTES;
    },
    viewEditNote() {
        return uistate.currentView.get() === uistate.VIEW_EDIT_NOTE;
    },
    viewDatenschutz() {
        return uistate.currentView.get() === uistate.VIEW_DATENSCHUTZ;
    },
    viewNutzungsbedingungen() {
        return uistate.currentView.get() === uistate.VIEW_NUTZUNGSBEDINGUNGEN;
    },
    viewImpressum() {
        return uistate.currentView.get() === uistate.VIEW_IMPRESSUM;
    },
    loading() {
        return uistate.loading.get() === true;
    },
});

const route = () => {
    const path = document.location.pathname;

    const datenschutz = path.match(/\/datenschutz/i);
    if (datenschutz) {
        go(uistate.VIEW_DATENSCHUTZ, null, null);
        return;
    }

    const nutzungsbedingungen = path.match(/\/nutzungsbedingungen/i);
    if (nutzungsbedingungen) {
        go(uistate.VIEW_NUTZUNGSBEDINGUNGEN, null, null);
        return;
    }

    const impressum = path.match(/\/impressum/i);
    if (impressum) {
        go(uistate.VIEW_IMPRESSUM, null, null);
        return;
    }

    const showNoteRoute = path.match(/\/artikel\/([A-Z0-9]+)\/?$/i);
    if (showNoteRoute) {
        go(uistate.VIEW_SHOW_NOTE, showNoteRoute[1], null, false);
        return;
    }

    const createNoteRoute = path.match(/\/erstellen/i);
    if (createNoteRoute) {
        go(uistate.VIEW_CREATE_NOTE, null, null, false);
        return;
    }

    const editNoteRoute = path.match(/\/bearbeiten\/([A-Z0-9]+)\/?$/i);
    if (editNoteRoute) {
        go(uistate.VIEW_EDIT_NOTE, null, editNoteRoute[1], false);
        return;
    }

    go(uistate.VIEW_NOTES, null, null, false);
};

export const go = (view, noteId, adminId, navigate = false) => {
    switch (view) {
        case uistate.VIEW_NOTES:
            uistate.currentNote.set(null);
            navigate && history.pushState(null, "Regenbogenbörse", "/");
            break;
        case uistate.VIEW_CREATE_NOTE:
            uistate.currentNote.set(null);
            navigate && history.pushState(null, "Regenbogenbörse", "/erstellen");
            break;
        case uistate.VIEW_SHOW_NOTE:
            uistate.currentNote.set(noteId);
            navigate && history.pushState(null, "Regenbogenbörse", `/artikel/${noteId}`);
            Meteor.call("logVisits", noteId);
            break;
        case uistate.VIEW_EDIT_NOTE:
            uistate.currentNote.set(null);
            navigate && history.pushState(null, "Regenbogenbörse", `/bearbeiten/${adminId}`);
            break;
        default:
            uistate.currentNote.set(null);
            break;
    }

    uistate.currentView.set(view);
};

window.onpopstate = function () {
    route();
};
route();
