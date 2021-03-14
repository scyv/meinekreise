const footer = Assets.getText("mail-templates/footer.txt");

export class Emails {
    constructor(template) {
        this.template = Assets.getText("mail-templates/" + template);
    }

    send(opts) {
        let text = this.template + footer;
        opts.params.forEach((keyValue) => {
            text = text.replace(keyValue.key, keyValue.value);
        });

        const emailOpts = {
            to: opts.to,
            from: opts.from,
            subject: opts.subject,
            text: text,
        };
        try {
            Email.send(emailOpts);
            return null;
        } catch (err) {
            console.error(err);
            return err;
        }
    }
}
