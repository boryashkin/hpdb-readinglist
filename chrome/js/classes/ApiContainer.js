import {render} from "../lit-html.js";
import {taskItemsTemplate, authItemsTemplate} from "../templates.js";
import {TaskItem} from "../classes.js";

/**
 * Класс, отвечающий за инициализацию всех апи
 */
export class ApiContainer {
    static envDev = true
    constructor(list, api, userAgent) {
        this.version = '0.0.10';
        this.userAgent = userAgent;
        this.authProviderList = [];
        if (typeof api != 'object') {
            ApiContainer._info("api is not an object");
        }
        this.authToken = null;
        this.api = api;
        if (typeof list === 'object') {
            ApiContainer._debug("adding auth api's");
            ApiContainer._debug(list);
            this.authProviderList = list;
        }
        this.eventTarget = document.getElementById('body');
        this.taskItems = [];
    }
    static getExtensionId() {
        //https://***.chromiumapp.org/
        return ApiContainer.envDev ? 'celmndfdmpljifdkjpmlhdohhadhogoi' : '***';
    }
    static getBackendUrl() {
        return ApiContainer.envDev ? "http://localhost:9883" : "https://hpdb.ru/";
    }
    async runGui() {
        this.hireGuiEventHandlers();
        this._auth()
    }
    async _auth() {
        this.getEventTarget().dispatchEvent(new Event("beforeInitAuthProviders"));
        await this._initAuthProviders();
        this.getEventTarget().dispatchEvent(new Event("afterInitAuthProviders"));
        this._renderApiAuthorization();
        this._applyAuth();
    }
    _applyAuth() {
        let container = this;
        let hasAuthorized = false;
        let apply = (function (auth) {
            if (!this.api.isReady() && auth.isAuthorized()) {
                hasAuthorized = true;
                ApiContainer._debug('INIT INITIATED')
                this.api.init(ApiContainer.getBackendUrl(), auth.getBearerToken(), this.userAgent)
                    .then(function () {
                        container.getEventTarget().dispatchEvent(new Event("apiAuthorized"));
                    })
            } else if (auth.isAuthorized()) {
                hasAuthorized = true;
            }
        }).bind(this);
        this.getList().forEach(apply);
        if (!hasAuthorized) {
            ApiContainer._debug('[ApiContainer] hasAuthorized === false')
            container.authToken = null;
            container.api.disable();
            container.taskItems = [];
            container.getEventTarget().dispatchEvent(new Event("apiAuthorized"));
        }
    }
    _removeAuth() {
        this.authToken = null;
    }




    getList() {
        return this.authProviderList;
    }
    getEventTarget() {
        return this.eventTarget;
    }
    _initAuthProviders() {
        let container = this;
        return new Promise(function (resolve, reject) {
            let authProviderListToHandle = container.getList().length;
            container.getList().forEach(function (api) {
                ApiContainer._debug('api before init');
                api.init()
                    .finally(function () {
                        ApiContainer._debug('api finally');
                        authProviderListToHandle--;
                        if (authProviderListToHandle < 1) {
                            ApiContainer._debug("authProviderListToHandle left: " + authProviderListToHandle);
                            ApiContainer._debug('after finally');
                            resolve();
                        } else {
                            ApiContainer._debug("authProviderListToHandle left: " + authProviderListToHandle);
                        }
                    });
            });
        });
    }
    _renderApiAuthorization() {
        let container = this;
        this.getEventTarget().dispatchEvent(new Event("startLoadingAuthForms"));
        const authItems = [];
        let authQty = 0;
        let hasAuth = false;
        this.getList().forEach(function (api) {
            if (authQty > 0) {
                // only one auth required
                return;
            }
            ApiContainer._debug('rendering auth form');
            if (!api.isAuthorized()) {
                ApiContainer._debug('is not authorized; Rendering auth form');
                authItems.push(api.getAuthForm());
            } else {
                authQty++;
                ApiContainer._debug('is authorized; Rendering logout form');
                authItems.push(api.getLogoutForm());
            }
        });
        if (!authQty) {
            this.getEventTarget().dispatchEvent(new Event("changeActiveTabToLoginList"));
        } else {
            this.getEventTarget().dispatchEvent(new Event("changeActiveTabToTasks"));
        }
        ApiContainer._debug('Actual rendering of forms');
        render(
            authItemsTemplate(authItems),
            document.getElementById('authContainer')
        );
        ApiContainer._debug('initializing events of forms');
        this.getList().forEach(function (api) {
            ApiContainer._debug('initializing form events');
            if (!container.authToken && !api.isAuthorized()) {
                api.initAuthFormEvents();
            } else {
                api.initLogoutFormEvents();
            }
        });
        this.getEventTarget().dispatchEvent(new Event("finishLoadingAuthForms"));
    }



    /*
     * Callback to render all the task async
     */
    renderGroups(tasks) {
        this.taskItems = this.taskItems.concat(tasks);
        this.taskItems = this.taskItems.sort(function(a, b){
            return new Date(b.date) - new Date(a.date);
        });
        ApiContainer._debug(tasks);

        render(
            taskItemsTemplate(this.taskItems),
            document.getElementById('taskList')
        );
    }

    initMainListTab() {
        ApiContainer._debug('initMainListTab()')
        let container = this;

        container.taskItems = [];
        if (!this.api.isReady()) {
            ApiContainer._debug('API IS NOT READY');
            return;
        }
        let beforeRendering = (function () {
            this.getEventTarget().dispatchEvent(new Event("startLoadingTasks"));
        }).bind(container);
        let afterRendering = (function () {
            this.getEventTarget().dispatchEvent(new Event("finishLoadingTasks"));
        }).bind(container);
        beforeRendering();
        ApiContainer._debug('[ApiContainer] GROUP ')
        this.api.getGroupProfiles(this.api.group.id).then(this.renderGroups.bind(container))
            .catch(function (e) {
                console.error(e);
                container.renderGroups([]);
            })
            .finally(afterRendering);
    }

    hireGuiEventHandlers() {
        let container = this;
        let tasksProgressBars = document.querySelectorAll("#tasks > .progress");
        let loginListProgressBars = document.querySelectorAll("#loginList > .progress");
        var commonProgressBars = document.querySelectorAll("#body > .container > .progress");
        this.getEventTarget().addEventListener("apiAuthorized", function() {
            ApiContainer._info("[Event] apiAuthorized");
            container.getEventTarget().dispatchEvent(new Event("refreshFeedEvent"));
        });
        this.getEventTarget().addEventListener("refreshAuthEvent", function() {
            ApiContainer._info("[Event] refreshAuthEvent");
            container._renderApiAuthorization();
            container._applyAuth();
            //After refresing some authorizations we should refresh feed also
            container.getEventTarget().dispatchEvent(new Event("refreshFeedEvent"));
        });
        this.getEventTarget().addEventListener("refreshFeedEvent", async function() {
            ApiContainer._info("[Event] refreshFeedEvent");
            container.taskItems = [];
            container.initMainListTab();
        });
        this.getEventTarget().addEventListener("beforeInitAuthProviders", function() {
            ApiContainer._info("[Event] beforeInitAuthProviders");
            commonProgressBars.forEach(ApiContainer.enableProgress);
        });
        this.getEventTarget().addEventListener("afterInitAuthProviders", function() {
            ApiContainer._info("[Event] afterInitAuthProviders");
            commonProgressBars.forEach(ApiContainer.disableProgress);
        });
        this.getEventTarget().addEventListener("startLoadingTasks", function() {
            ApiContainer._info("[Event] startLoadingTasks");
            tasksProgressBars.forEach(ApiContainer.enableProgress);
        });
        this.getEventTarget().addEventListener("finishLoadingTasks", function() {
            ApiContainer._info("[Event] finishLoadingTasks");
            tasksProgressBars.forEach(ApiContainer.disableProgress);
        });
        this.getEventTarget().addEventListener("startLoadingAuthForms", function() {
            ApiContainer._info("[Event] startLoadingAuthForms");
            loginListProgressBars.forEach(ApiContainer.enableProgress);
        });
        this.getEventTarget().addEventListener("finishLoadingAuthForms", function() {
            ApiContainer._info("[Event] finishLoadingAuthForms");
            loginListProgressBars.forEach(ApiContainer.disableProgress);
        });
        this.getEventTarget().addEventListener("changeActiveTabToLoginList", function(e) {
            ApiContainer._info("[Event] changeActiveTabToLoginList");
            container._removeAuth();
            container.initMainListTab();
            document.querySelectorAll("#main-tabs > li > a").forEach(function(item) {
                if (item.attributes.href.value === "#loginList") {
                    item.dispatchEvent(new MouseEvent('click', {bubbles: true}));
                }
            });
        });
        this.getEventTarget().addEventListener("changeActiveTabToTasks", function(e) {
            ApiContainer._info("[Event] changeActiveTabToTasks");
            document.querySelectorAll("#main-tabs > li > a").forEach(function(item) {
                if (item.attributes.href.value === "#tasks") {
                    item.dispatchEvent(new MouseEvent('click', {bubbles: true}));
                }
            });
        });
        document.getElementById("group-btn-add").addEventListener("click", function (e) {
            e.preventDefault();
            ApiContainer._debug(e);
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                var currTab = tabs[0];
                if (currTab) {
                    container.api.addWebsite(currTab.url).then(function (website) {
                        let exists = false;
                        container.taskItems.forEach(function (taskItem) {
                            console.log(taskItem.id === website.id, taskItem.id, website.id)
                            if (taskItem.id === "profile-" + website.id) {
                                exists = true;
                            }
                        });
                        if (exists) {
                            return;
                        }
                        container.api.addWebsiteToGroup(website.id, container.api.group.id).then(function () {
                            let item = new TaskItem(
                                "profile-" + website.id,
                                website.homepage,
                                ApiContainer.getBackendUrl() + "/api/v1/profile/" + website.id,
                                website.description,
                                "",
                                website.updatedAt,
                                []
                            )
                            container.taskItems.unshift(item);
                            let a = container.taskItems;
                            container.taskItems = [];
                            container.renderGroups(a);
                        });
                        ApiContainer._debug('Added website ' + website.id + ', group ' + container.api.group.id);
                    })
                } else {
                    ApiContainer._info('No active tab found')
                }
            });

        });
    }
    static enableProgress(item) {
        ApiContainer._debug("ENABLE progress");
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
        ApiContainer._debug("DISABLE progress");
        let processingItems = 0;
        if (typeof item.processing !== "undefined") {
            processingItems = +item.processing;
        }
        item.processing = --processingItems;
        if (item.processing < 1) {
            item.classList.add("hide");
        }
    }
    static _debug(obj) {
        if (true) {
            console.log(obj);
        }
    }
    static _info(obj) {
        console.log(obj)
    }
}
