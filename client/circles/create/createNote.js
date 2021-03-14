import { Template } from "meteor/templating";
import { Sortable } from "sortablejs";

import "./createNote.html";

import { go, uistate } from "../../main";
import { Tags } from "../../../both/collections";
import { Scroller } from "../../scroller";

const validity = new ReactiveVar({
    text: true,
    title: true,
    email: true,
    legal: true,
});

Template.createNote.onRendered(() => {
    const el = document.querySelector(".notePicturesPreview");
    new Sortable(el, {
        group: "thumbnails",
        draggable: ".thumbnailContainer",
        ghostClass: "sortable-ghost",
        delay: 400,
        delayOnTouchOnly: true,
    });
});

Template.createNote.events({
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

                const removeCtrl = $("<button type='button' />");
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
    "click .btn-create-note"() {
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
            title: $("#noteTitle").val(),
            description: $("#noteText").val(),
            price: $("#notePrice").val(),
            pictures: pics,
            contact: $("#noteContact").val(),
            email: $("#noteEmail").val(),
            tags: $("#noteTags")
                .val()
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag),
        };
        Meteor.call("createNote", noteData, (err) => {
            uistate.loading.set(false);
            if (!err) {
                $("#dlgCreated").modal("show");
                $("#dlgCreated").on("hidden.bs.modal", function () {
                    go(uistate.VIEW_NOTES, null, null, true);
                });
            }
        });
    },
    "click .btn-cancel"() {
        go(uistate.VIEW_NOTES, null, null, true);
    },
    "click #noteTagsProposals .badge"() {
        $("#noteTags").val(
            Array.from(
                new Set([...$("#noteTags").val().split(", "), this.name].filter((tag) => tag).map((tag) => tag.trim()))
            ).join(", ")
        );
    },
});

Template.createNote.helpers({
    allTags() {
        return Tags.find();
    },
    checkValid(field) {
        return validity.get()[field] ? "" : "is-invalid";
    },
    email() {
        return validity.get()["email"] ? $("#noteEmail").val() : "";
    },
    title() {
        return validity.get()["title"] ? $("#noteTitle").val() : "";
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
        legal: $("#legalCheck").prop("checked") == true,
    });

    return Object.values(validity.get()).every((v) => v);
}
