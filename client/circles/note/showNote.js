import { Notes } from "../../../both/collections";
import { go, uistate } from "../../main";
import { Markdown } from "../../markdown";

import "./showNote.html";

const pictureIdx = new ReactiveVar(null);

Template.showNote.helpers({
    note() {
        return Notes.findOne(uistate.currentNote.get());
    },
    price() {
        return this.price ? this.price + " €" : null;
    },
    description() {
        return new Markdown().parse(this.description);
    },
    pictureOverlayActive() {
        return pictureIdx.get() !== null;
    },
    isAdmin() {
        return false;
    },
});
Template.showNote.events({
    "click .btnBack"() {
        history.back();
    },
    "click img.thumbnail"(evt) {
        pictureIdx.set(parseInt(evt.currentTarget.dataset.idx, 10));
    },
    "click .btnContact"() {
        $("#dlgContact").modal("show");
    },
    "click .btnEditNote"() {
        go(uistate.VIEW_EDIT_NOTE, null, uistate.currentNote.get(), true);
    },
});

Template.pictureOverlay.onRendered(() => {
    $(document).on("keydown", handleShortcuts);
});

Template.pictureOverlay.onDestroyed(() => {
    $(document).off("keydown", handleShortcuts);
});

Template.pictureOverlay.helpers({
    selectedPicture() {
        const pics = Notes.findOne(uistate.currentNote.get()).pictures;
        const idx = pictureIdx.get() + pics.length * 10000; // index nach rechts verschieben um nicht ins negative zu kommen

        const normalizedIdx = Math.abs(idx % pics.length);
        return {
            img: pics[normalizedIdx],
            idx: normalizedIdx + 1,
            count: pics.length,
        };
    },
});
Template.pictureOverlay.events({
    "click .btn-next"() {
        pictureIdx.set(pictureIdx.get() + 1);
        return false;
    },
    "click .btn-last"() {
        pictureIdx.set(pictureIdx.get() - 1);
        return false;
    },
    "click .btn-close"() {
        pictureIdx.set(null);
    },
    "click .pictureOverlay"() {
        pictureIdx.set(null);
    },
});

function handleShortcuts(evt) {
    switch (evt.key) {
        case "Escape":
            pictureIdx.set(null);
            break;
        case "ArrowRight":
            pictureIdx.set(pictureIdx.get() + 1);
            break;
        case "ArrowLeft":
            pictureIdx.set(pictureIdx.get() - 1);
            break;
    }
}
