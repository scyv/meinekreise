import sanitizeHtml from "sanitize-html";
import marked from "marked";

export class Markdown {
    parseOnlyText(markdown) {
        return sanitizeHtml(marked(markdown), {
            allowedTags: [],
        });
    }

    parse(markdown) {
        return sanitizeHtml(marked(markdown), {
            allowedTags: [
                "a",
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
                "div",
                "hr",
                "li",
                "ol",
                "p",
                "pre",
                "ul",
                "b",
                "br",
                "code",
                "em",
                "i",
                "span",
                "strong",
                "sub",
                "sup",
                "table",
                "tbody",
                "td",
                "tfoot",
                "th",
                "thead",
                "tr",
            ],
        });
    }
}
