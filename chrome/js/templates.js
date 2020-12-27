import {html} from './lit-html.js';

//data should be an instance of AuthFormData class
export const authForm = (data) => html`
    <li>
      <div class="collapsible-header"><img height="16" src="${data.icon}">&nbsp; ${data.name} Authorization</div>
      <div class="collapsible-body">
            <div class="row">
                <div class="col s12 center">
                    <h6>${data.name} Авторизация</h6>
                    ${data.formDescription.map((i) => html`<p class="${i.classes}">${i.text}</p>`)}
                    <form class="authorization-form" id="${data.formId}" action="#">
                        ${data.formInputs.map((i) => html`
                            <div class="input-field col s12">
                                <input id="${i.id}" name="${i.name}" type="${i.type}" value="${i.value}" class="validate${i.classes}">
                                <label for="${i.id}">${i.label}</label>
                            </div>
                        `)}
                        <div class="input-field col s12">
                            <button class="btn waves-effect waves-light" type="submit" name="action">${data.mainButtonText}</button>
                        </div>
                        <div class="input-field col s12 errors-container">
                            
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </li>
`;

export const authorizedBlock = (data) => html`
<li>
      <div class="collapsible-header"><img height="16" src="${data.icon}"> ${data.name} (авторизовано)</div>
      <div class="collapsible-body">
            <div class="row">
                <div class="col s12 center">
                    <h6>${data.name}</h6>
                    <p>Вы авторизовались.</p>
                    <p>${data.credentialsString}</p>
                    <p><a  id="${data.logoutId}" href="#">Выйти</a></p>
                </div>
            </div>
       </div>
</li>
`;

export const taskItemsTemplate = (items) => html`
${items.map((i) => html`
            <li class="collection-item avatar" id="${i.id}">
                <img src="${i.icon}" alt="" class="circle">
                <span class="title"><a href="${i.link}" target="_blank">${i.title}</a></span>
                <p>${i.description}</p>
                <p class="additional-space">
                    ${i.spaceItems.map((spaceItem) => html`${spaceItem}`)}
                </p>
                <p class="grey-text">${i.date}</p>
            </li>
`)}
`;

export const authItemsTemplate = (items) => html`
${items.map((i) => html`${i}`)}
`;

export const emojiSpan = (data) => html`
    <span class="${data.spanClasses}" title="${data.spanTitle}"><img src="images/emojis/blank.gif" class="${data.emoji}" /> ${data.text}</span>
`;

export const inputItem = (data) => html`
<form class="${data.wrapperClasses}" method="post" action="#">
    <input class="${data.inputClasses}" placeholder="${data.placeholder}"/>
</form>
`;
