import { Template } from "meteor/templating";
import { Sortable } from "sortablejs";
import { DateTime } from "luxon";

import "./editNote.html";

import { notesHandle, go, uistate } from "../../main";
import { Notes, Tags } from "../../../both/collections";
import { Scroller } from "../../scroller";
import { SETTINGS } from "../../../both/settings";

const validity = new ReactiveVar({
    text: true,
    title: true,
    email: true,
});

Template.editNote.onRendered(() => {
    window.setTimeout(() => {
        const el = document.querySelector(".notePicturesPreview");
        if (!el) {
            return;
        }
        new Sortable(el, {
            group: "thumbnails",
            draggable: ".thumbnailContainer",
            ghostClass: "sortable-ghost",
            delay: 400,
            delayOnTouchOnly: true,
        });
    }, 2000);
});

Template.editNote.helpers({
    readyLoading() {
        return notesHandle && notesHandle.ready();
    },
    note() {
        return Notes.findOne({ adminKey: uistate.currentAdminKey.get() });
    },
    category(cat) {
        return this.category === cat;
    },
    tagValue() {
        return this.tags.join(", ");
    },
    allTags() {
        return Tags.find();
    },
    checkValid(field) {
        return validity.get()[field] ? "" : "is-invalid";
    },
    deactivated() {
        return this.status === "inactive";
    },
    deletionDate() {
        return DateTime.fromJSDate(this.activatedAt).plus(SETTINGS.deletionThreshold).toJSDate();
    },
});

Template.editNote.events({
    "change #notePictures"(evt) {
        const preview = $(".notePicturesPreview");
        const fileInput = evt.currentTarget;

        const maxAllowed = Math.max(0, Math.min(fileInput.files.length, 5 - preview.children.length));

        for (let i = 0; i < maxAllowed; i++) {
            const file = fileInput.files[i];
            if (!file.type.startsWith("image/")) {
                continue;
            }
            generateThumbnail(file, [1024, 1024]).then((url) => {
                const container = $("<div />");
                container.addClass("thumbnailContainer");
                const img = $("<img/>");
                img.addClass("col-12 col-sm-6 col-md-4 col-lg-3");
                img.attr("alt", file.name);
                img.attr("src", url);
                container.append(img);

                const removeCtrl = $("<button />");
                removeCtrl.addClass("btn btn-link btn-removethumbnail");
                removeCtrl.append('<i class="fas fa-trash-alt"></i>');
                removeCtrl.append(" Löschen");
                $(container).append(removeCtrl);
                preview.append(container);
            });
        }
    },
    "click .btn-removethumbnail"(evt) {
        $(evt.currentTarget.parentElement).remove();
    },
    "click #noteTagsProposals .badge"() {
        $("#noteTags").val(
            Array.from(
                new Set([...$("#noteTags").val().split(", "), this.name].filter((tag) => tag).map((tag) => tag.trim()))
            ).join(", ")
        );
    },
    "click .btn-save-note"() {
        if (!checkValid()) {
            new Scroller().scrollTo(".is-invalid");
            return;
        }

        new Scroller().scrollUp();

        uistate.loading.set(true);
        const pics = $(".notePicturesPreview img")
            .get()
            .map((img) => ({ src: img.src, name: img.alt }));
        const noteData = {
            adminKey: uistate.currentAdminKey.get(),
            title: $("#noteTitle").val(),
            description: $("#noteText").val(),
            price: $("#notePrice").val(),
            category: uistate.currentCategory.get(),
            pictures: pics,
            contact: $("#noteContact").val(),
            email: $("#noteEmail").val(),
            tags: $("#noteTags")
                .val()
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag),
        };
        Meteor.call("updateNote", noteData, (err) => {
            uistate.loading.set(false);
            if (!err) {
                go(uistate.VIEW_NOTES, null, null, true);
            }
        });
    },
    "click .btn-cancel"() {
        go(uistate.VIEW_NOTES, null, null, true);
    },
    "click .btn-delete"() {
        $("#dlgConfirmDelete").modal("show");
    },
    "click .btn-reactivate"() {
        Meteor.call("reactivateNote", this.adminKey);
    },
});

Template.dlgConfirmDelete.events({
    "click .btn-remove-note"() {
        const adminKey = this.adminKey;
        $("#dlgConfirmDelete").on("hidden.bs.modal", function () {
            go(uistate.VIEW_NOTES, null, null, true);
            Meteor.call("closeNote", adminKey, (err) => {});
        });
        $("#dlgConfirmDelete").modal("hide");
    },
});

function generateThumbnail(file, boundBox) {
    const reader = new FileReader();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    return new Promise((resolve) => {
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const scaleRatio = Math.min(...boundBox) / Math.max(img.width, img.height);
                const w = img.width * scaleRatio;
                const h = img.height * scaleRatio;
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);
                return resolve(canvas.toDataURL(file.type));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function checkValid() {
    validity.set({
        title: $("#noteTitle").val().trim() !== "",
        text: $("#noteText").val().trim() !== "",
        email: $("#noteEmail").val().trim() !== "",
    });

    return Object.values(validity.get()).every((v) => v);
}
