/**
 * Scroller helper
 */
export class Scroller {
    scrollUp() {
        this.scrollTo();
    }

    scrollTo(selector) {
        window.setTimeout(() => {
            const jqueryObject = $(selector).parent();
            if (jqueryObject && jqueryObject.length) {
                window.scrollTo({
                    left: 0,
                    top: jqueryObject.position().top - 100,
                    behavior: "smooth",
                });
            } else {
                window.scrollTo({
                    left: 0,
                    top: 0,
                    behavior: "smooth",
                });
            }
        }, 300);
    }
}
