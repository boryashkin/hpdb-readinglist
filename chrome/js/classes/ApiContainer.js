import {render} from "../lit-html.js";
import {taskItemsTemplate, authItemsTemplate} from "../templates.js";

/**
 * Класс, отвечающий за инициализацию всех апи
 */
export class ApiContainer {
    constructor(list) {
        this.version = '0.0.10';
        this.authProviderList = [];
        if (typeof list === 'object') {
            console.log("adding auth api's");
            console.log(list);
            this.authProviderList = list;
        }
        this.eventTarget = document.getElementById('body');
        this.taskItems = [];
        this.hireEventHandlers();
    }
    static getExtensionId() {
        let envDev = true;
        //https://***.chromiumapp.org/
        return envDev ? 'celmndfdmpljifdkjpmlhdohhadhogoi' : '***';
    }
    static getBackendUrl() {
        let envDev = true;
        return envDev ? "http://localhost:9883/" : "https://hpdb.ru/";
    }
    getList() {
        return this.authProviderList;
    }
    getEventTarget() {
        return this.eventTarget;
    }
    initApis() {
        let container = this;
        return new Promise(function (resolve, reject) {
            let authProviderListToHandle = container.getList().length;
            container.getList().forEach(function (api) {
                console.log('api before init');
                api.init()
                    .finally(function () {
                        console.log('api finally');
                        authProviderListToHandle--;
                        if (authProviderListToHandle < 1) {
                            console.log("authProviderListToHandle left: " + authProviderListToHandle);
                            console.log('after finally');
                            resolve();
                        } else {
                            console.log("authProviderListToHandle left: " + authProviderListToHandle);
                        }
                    });
            });
        });
    }

    /*
     * Callback to render all the task async
     */
    renderTasks(tasks) {
        this.taskItems = this.taskItems.concat(tasks);
        this.taskItems = this.taskItems.sort(function(a, b){
            return new Date(b.date) - new Date(a.date);
        });
        render(
            taskItemsTemplate(this.taskItems),
            document.getElementById('taskList')
        );
    }

    initTaskListTab() {
        let container = this;
        container.taskItems = [];
        container.renderTasks([]);
        this.getList().forEach(function (api) {
            if (api.isAuthorized()) {
                let beforeRendering = (function () {
                    this.getEventTarget().dispatchEvent(new Event("startLoadingTasks"));
                }).bind(container);
                let afterRendering = (function () {
                    this.getEventTarget().dispatchEvent(new Event("finishLoadingTasks"));
                }).bind(container);
                //api.renderTasks(container.renderTasks.bind(container), beforeRendering, afterRendering);
            }
        });
    }
    renderApiAuthorizationTab() {
        this.getEventTarget().dispatchEvent(new Event("startLoadingAuthForms"));
        const authItems = [];
        let authQty = 0;
        let hasAuth = false;
        this.getList().forEach(function (api) {
            if (authQty > 0) {
                // only one auth required
                return;
            }
            console.log('rendering auth form');
            if (!api.isAuthorized()) {
                console.log('is not authorized; Rendering auth form');
                authItems.push(api.getAuthForm());
            } else {
                authQty++;
                console.log('is authorized; Rendering logout form');
                authItems.push(api.getLogoutForm());
            }
        });
        if (!authQty) {
            this.getEventTarget().dispatchEvent(new Event("changeActiveTabToLoginList"));
        } else {
            this.getEventTarget().dispatchEvent(new Event("changeActiveTabToTasks"));
        }
        console.log('Actual rendering of forms');
        render(
            authItemsTemplate(authItems),
            document.getElementById('authContainer')
        );
        console.log('initializing events of forms');
        this.getList().forEach(function (api) {
            console.log('initializing form events');
            if (!api.isAuthorized()) {
                api.initAuthFormEvents();
            } else {
                api.initLogoutFormEvents();
            }
        });
        this.getEventTarget().dispatchEvent(new Event("finishLoadingAuthForms"));
    }
    hireEventHandlers() {
        let container = this;
        let tasksProgressBars = document.querySelectorAll("#tasks > .progress");
        let loginListProgressBars = document.querySelectorAll("#loginList > .progress");
        var commonProgressBars = document.querySelectorAll("#body > .container > .progress");
        this.getEventTarget().addEventListener("refreshAuthEvent", function() {
            console.log("Refreshing auth tab");
            container.renderApiAuthorizationTab();
            //After refresing some authorizations we should refresh feed also
            container.getEventTarget().dispatchEvent(new Event("refreshFeedEvent"));
        });
        this.getEventTarget().addEventListener("refreshFeedEvent", function() {
            console.log("Refreshing tasks tab");
            container.taskItems = [];
            container.initTaskListTab();
        });
        this.getEventTarget().addEventListener("beforeApisInit", function() {
            commonProgressBars.forEach(ApiContainer.enableProgress);
        });
        this.getEventTarget().addEventListener("afterApisInit", function() {
            commonProgressBars.forEach(ApiContainer.disableProgress);
        });
        this.getEventTarget().addEventListener("startLoadingTasks", function() {
            tasksProgressBars.forEach(ApiContainer.enableProgress);
        });
        this.getEventTarget().addEventListener("finishLoadingTasks", function() {
            tasksProgressBars.forEach(ApiContainer.disableProgress);
        });
        this.getEventTarget().addEventListener("startLoadingAuthForms", function() {
            loginListProgressBars.forEach(ApiContainer.enableProgress);
        });
        this.getEventTarget().addEventListener("finishLoadingAuthForms", function() {
            loginListProgressBars.forEach(ApiContainer.disableProgress);
        });
        this.getEventTarget().addEventListener("changeActiveTabToLoginList", function(e) {
            document.querySelectorAll("#main-tabs > li > a").forEach(function(item) {
                if (item.attributes.href.value === "#loginList") {
                    item.dispatchEvent(new MouseEvent('click', {bubbles: true}));
                }
            });
        });
        this.getEventTarget().addEventListener("changeActiveTabToTasks", function(e) {
            document.querySelectorAll("#main-tabs > li > a").forEach(function(item) {
                if (item.attributes.href.value === "#tasks") {
                    item.dispatchEvent(new MouseEvent('click', {bubbles: true}));
                }
            });
        });
    }
    static enableProgress(item) {
        console.log("ENABLE progress");
        let processingItems = 0;
        if (typeof item.processing === "undefined") {
            item.processing = processingItems;
        } else {
            processingItems = +item.processing;
        }
        item.processing = ++processingItems;
        item.classList.remove("hide");
    }
    static disableProgress(item) {
        console.log("DISABLE progress");
        let processingItems = 0;
        if (typeof item.processing !== "undefined") {
            processingItems = +item.processing;
        }
        item.processing = --processingItems;
        if (item.processing < 1) {
            item.classList.add("hide");
        }
    }

}
