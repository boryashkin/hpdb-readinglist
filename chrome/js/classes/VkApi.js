import {authForm, authorizedBlock} from "../templates.js";
import {AuthFormData, AuthFormHeader, AuthFormInput, TaskItem} from "../classes.js";
import {VendorApi} from "./VendorApi.js";
import {ApiContainer} from "./ApiContainer.js";

//todo: implement oauth2
export class VkApi extends VendorApi {
    init() {
        let api = this;
        this.name = "Vk";
        this.icon = "images/icons/vk.png";
        return new Promise(function(resolve, reject) {
            chrome.storage.sync.get(['vkApiStore'], function(result) {
                api.setAuthData(result.vkApiStore);
                console.log(result);
                console.log(api.getAuthData());
                resolve(result);
            });
        });
    }
    persistAuthData() {
        let vk = this;
        return new Promise(function(resolve, reject) {
            chrome.storage.sync.set({vkApiStore: vk.getAuthData()}, function() {
                console.log('Saved auth data to db');
                resolve();
            });
        });
    }
    isAuthorized() {
        console.log('isAuthorized vk?');
        console.log(this.getAuthData());
        let data = this.getAuthData();

        return data !== null && typeof data !== "undefined" && typeof data.token === "string";
    }

    logout() {
        this.setAuthData(null);
        this.login();
    }
    login() {
        this.persistAuthData().then(function () {
            document.getElementById("body").dispatchEvent(new Event("refreshAuthEvent"));
        });
    }
    getAuthForm() {
        let form = null;
        let vkData = new AuthFormData(
            "Vk",
            "vk-auth",
            [
                new AuthFormHeader(
                    "Сайт vk должен открыться в новом окне",
                    "orange-text"
                ),
            ],
            [],
            this.getIcon(),
            "Войти"
        );

        return authForm(vkData);
    }
    getLogoutForm() {
        let token = this.getAuthData().token;
        return authorizedBlock({
            name: "vk",
            logoutId: "vk-logout",
            credentialsString: "token: " + token.slice(-6).padStart(12, '*'),
            icon: this.getIcon()
        });
    }
    initAuthFormEvents() {
        let vk = this;
        document.getElementById("vk-auth").addEventListener("submit", function (e) {
            e.preventDefault();
            console.log(ApiContainer.getBackendUrl() + 'api/auth/vk/state');
            axios.get(ApiContainer.getBackendUrl() + 'api/auth/vk/state')
                .then(vk._callAuthWindow.bind(vk))
                .catch(function (e) {
                    console.log(e);
                });

        });
        let vkAuthForm = document.getElementById('vk-auth');
        if (!vkAuthForm) {
            console.log('unable to find vk form');
            console.log(document);
            return null;
        }
    }
    initLogoutFormEvents() {
        console.log('vk logout events init');
        let vk = this;
        let vkExit = document.getElementById('vk-logout');
        vkExit.onclick = function(e) {
            e.preventDefault();
            vk.logout();
        }
    }

    _callAuthWindow(stateResponse) {
        let vk = this;
        console.log('callAuthWindow');
        chrome.identity.launchWebAuthFlow(
            {
                'url': vkApi._getvkAuthUrl(stateResponse.data.state),
                'interactive': true
            },
            vk._handleAuthCodeResponse.bind(vk)
        );
    }
    _handleAuthCodeResponse(redirect_url) {
        let vk = this;
        let authData = this.getAuthData();
        if (!authData) {
            authData = {};
        }
        authData.vkUrl = redirect_url;
        let parsedUrl = new URL(redirect_url);
        console.log(parsedUrl);
        axios.post(ApiContainer.getBackendUrl() + 'api/auth/vk/token', {
            "state": parsedUrl.searchParams.get("state"),
            "code": parsedUrl.searchParams.get("code")
        })
            .then(function (response) {
                console.log('BEFORE LOGIN');
                console.log(response);
                authData.token = response.data.token;
                vk.setAuthData(authData);
                vk.login();
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    _getEvents() {
        let vk = this;
        const vkApi = axios.create({
            baseURL: ApiContainer.getBackendUrl(),
            headers: {'Authorization': "Bearer " + vk.getAuthData().token}
        });
        return new Promise(function(resolve, reject) {
            vkApi.get('api/auth/vk/resources').then(function (response) {
                console.log(response);
            });

            resolve([]);
        });
    }
    static _getvkAuthUrl(state) {
        return "https://oauth.vk.com/authorize?";
    }
}
