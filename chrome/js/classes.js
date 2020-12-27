import {authForm, authorizedBlock, emojiSpan, inputItem} from "./templates.js";

export class AuthFormData {
    constructor(name, formId, formDescription, formInputs, icon, mainButtonText) {
        this.name = name;
        this.formId = formId;
        this.formDescription = formDescription;
        this.formInputs = formInputs;
        this.icon = icon;
        if (typeof mainButtonText === "string") {
            this.mainButtonText = mainButtonText;
        } else {
            this.mainButtonText = "Сохранить";
        }
    };
}
export class AuthFormInput {
    constructor(id, name, type, label, value, classes) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.label = label;
        this.value = value;
        if (typeof classes !== "string") {
            this.classes = '';
        } else {
            this.classes = " " + classes;
        }
        if (typeof value === "undefined") {
            this.value = '';
        }

    };
}
export class AuthFormHeader {
    constructor(text, classes) {
        this.text = text;
        if (typeof classes !== "string") {
            this.classes = '';
        } else {
            this.classes = " " + classes;
        }
    };
}

export class TaskItem {
    constructor(id, title, link, description, icon, date, spaceItems) {
        this.id = id;
        //todo: Make a "data" field: array of "data-" attributes of task element to render
        this.title = title;
        this.link = link;
        this.description = description;
        this.icon = icon;
        this.date = date;
        try {
            this.date = new Date(this.date);
            this.date = this.date.toGMTString();
        } catch (e) {
            this.date = date;
        }
        if (typeof spaceItems !== "undefined" && spaceItems !== null) {
            this.spaceItems = spaceItems;
        } else {
            this.spaceItems = [];
        }
    }
}

export class EmojiSpanItem {
    constructor(spanClasses, spanTitle, emoji, text) {
        this.spanClasses = spanClasses;
        if (typeof spanTitle !== "string") {
            this.spanTitle = "";
        } else {
            this.spanTitle = spanTitle;
        }
        this.emoji = emoji;
        this.text = text;
        console.log('EMOJI CONSTRUCTOR');
    }
}

export class AdditionalInputItem {
    constructor(inputClasses, placeholder, wrapperClasses) {
        this.inputClasses = "";
        this.placeholder = "";
        this.wrapperClasses = "";

        if (typeof inputClasses === "string") {
            this.inputClasses = inputClasses;
        }
        if (typeof inputClasses === "string") {
            this.placeholder = placeholder;
        }
        if (typeof inputClasses === "string") {
            this.wrapperClasses = wrapperClasses;
        }
    }
}
