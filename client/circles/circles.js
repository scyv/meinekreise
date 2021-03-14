import { Template } from "meteor/templating";
import { Notes } from "../../both/collections";
import { notesHandle as notesHandle, uistate, go } from "../main";
import { Markdown } from "../markdown";
import Konva from "konva";

var _ = require("lodash");

import "./circles.html";

import "./note/showNote";
import "./create/createNote";
import "./edit/editNote";

const searchFilter = new ReactiveVar();

let stage = undefined;

Template.notes.helpers({
    readyLoading() {
        return notesHandle && notesHandle.ready();
    },
    circles() {
        window.setTimeout(() => {
            drawScene();
        }, 500);

        return null;
    },
    notes() {
        const filter = searchFilter.get();
        if (filter) {
            return Notes.find(
                {
                    $or: [
                        {
                            title: { $regex: `${filter}`, $options: "gi" },
                        },
                        {
                            description: { $regex: `${filter}`, $options: "gi" },
                        },
                        {
                            tags: { $in: filter.split(" ") },
                        },
                    ],
                },
                { sort: { activatedAt: -1 } }
            );
        }
        return Notes.find({}, { sort: { activatedAt: -1 } });
    },
});

Template.notes.events({
    "click .btn-create-note"() {
        history.pushState(null, null, "/erstellen");
        uistate.currentView.set(uistate.VIEW_CREATE_NOTE);
    },
});

Template.note.helpers({
    firstPicture() {
        if (this.thumbnail) {
            return this.thumbnail;
        }
        if (this.pictures && this.pictures.length > 0) {
            return this.pictures[0].src;
        }
        return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iLTggLTggMzIgMzIiIGNsYXNzPSJiaSBiaS1jYW1lcmEiIGZpbGw9ImN1cnJlbnRDb2xvciIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNSAxMlY2YTEgMSAwIDAgMC0xLTFoLTEuMTcyYTMgMyAwIDAgMS0yLjEyLS44NzlsLS44My0uODI4QTEgMSAwIDAgMCA5LjE3MyAzSDYuODI4YTEgMSAwIDAgMC0uNzA3LjI5M2wtLjgyOC44MjhBMyAzIDAgMCAxIDMuMTcyIDVIMmExIDEgMCAwIDAtMSAxdjZhMSAxIDAgMCAwIDEgMWgxMmExIDEgMCAwIDAgMS0xek0yIDRhMiAyIDAgMCAwLTIgMnY2YTIgMiAwIDAgMCAyIDJoMTJhMiAyIDAgMCAwIDItMlY2YTIgMiAwIDAgMC0yLTJoLTEuMTcyYTIgMiAwIDAgMS0xLjQxNC0uNTg2bC0uODI4LS44MjhBMiAyIDAgMCAwIDkuMTcyIDJINi44MjhhMiAyIDAgMCAwLTEuNDE0LjU4NmwtLjgyOC44MjhBMiAyIDAgMCAxIDMuMTcyIDRIMnoiLz4KICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04IDExYTIuNSAyLjUgMCAxIDAgMC01IDIuNSAyLjUgMCAwIDAgMCA1em0wIDFhMy41IDMuNSAwIDEgMCAwLTcgMy41IDMuNSAwIDAgMCAwIDd6Ii8+CiAgPHBhdGggZD0iTTMgNi41YS41LjUgMCAxIDEtMSAwIC41LjUgMCAwIDEgMSAweiIvPgo8L3N2Zz4=";
    },
    shortDescription() {
        let shortDesc = this.description.substring(0, 200);
        const linesMatch = shortDesc.match(/^(.*)$/m);
        if (linesMatch) {
            shortDesc = linesMatch[0];
        }
        return new Markdown().parseOnlyText(shortDesc);
    },
    price() {
        return this.price ? this.price + " €" : null;
    },
});

Template.note.events({
    "click .note .title, click .note img"() {
        go(uistate.VIEW_SHOW_NOTE, this._id, null, true);
    },
});

const debouncedSetFilter = _.debounce(() => {
    searchFilter.set($("#searchNote").val().trim());
}, 300);

Template.search.events({
    "click #searchNote_addon"() {
        debouncedSetFilter();
    },
    "keydown #searchNote"() {
        debouncedSetFilter();
    },
});

function drawScene() {
    if (stage !== undefined) {
        return;
    }
    stage = new Konva.Stage({
        container: "circles", // id of container <div>
        width: window.innerWidth,
        height: 120,
    });

    var layer = new Konva.Layer();

    const centerX = stage.width() / 2;
    const objects = [];

    ["Familie", "Tec", "Work"].forEach((tag, idx) => {
        const group = new Konva.Group({
            x: centerX - 50,
            y: stage.height() / 2 - 25,
        });

        const text = new Konva.Text({
            x: -50,
            y: -25,
            text: tag,
            fontSize: 14,
            fontFamily: "Arial",
            fill: "#FFF",
            width: 100,
            padding: 20,
            align: "center",
        });

        const circle = new Konva.Circle({
            x: 0,
            y: 0,
            fill: "#1a76c5",
            shadowBlur: 10,
            radius: 50,
        });

        group.add(circle);
        group.add(text);
        objects.push(group);
        layer.add(group);
    });

    stage.add(layer);

    objects.forEach((o, idx) => {
        const tween = new Konva.Tween({
            node: o,
            x: 70 + idx * 110,
            y: 60,
            easing: Konva.Easings.EaseInOut,
            duration: 0.5,
        });

        tween.play();
    });
}
