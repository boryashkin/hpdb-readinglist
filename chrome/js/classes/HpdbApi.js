import {authForm, authorizedBlock} from "../templates.js";
import {AuthFormData, AuthFormHeader, AuthFormInput, TaskItem} from "../classes.js";
import {VendorApi} from "./VendorApi.js";
import {ApiContainer} from "./ApiContainer.js";

export class HpdbApi extends VendorApi {
    init() {
        let api = this;
        this.name = "HPDB";
        this.icon = "icon.png";
        return new Promise(function(resolve, reject) {
            chrome.storage.sync.get(['hpdbApiStore'], function(result) {
                api.setAuthData(result.hpdbApiStore);
                console.log(result);
                console.log(api.getAuthData());
                resolve(result);
            });
        });
    }
    persistAuthData() {
        let hpdb = this;
        return new Promise(function(resolve, reject) {
            chrome.storage.sync.set({hpdbApiStore: hpdb.getAuthData()}, function() {
                console.log('Saved auth data to db');
                resolve();
            });
        });
    }
    isAuthorized() {
        console.log('isAuthorized hpdb?');
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
        let hpdbData = new AuthFormData(
            "hpdb",
            "hpdb-auth",
            [
                new AuthFormHeader(
                    "Если не регистрировались, сделайте это на hpdb.ru",
                    "orange-text"
                ),
            ],
            [
                new AuthFormInput('hpdbEmail', 'email', 'email', 'Email'),
                new AuthFormInput('hpdbPassword', 'password', 'password', 'Password')
            ],
            this.getIcon(),
            "Войти"
        );

        return authForm(hpdbData);
    }
    getLogoutForm() {
        let token = this.getAuthData().token;
        return authorizedBlock({
            name: "hpdb",
            logoutId: "hpdb-logout",
            credentialsString: "token: " + token.slice(-6).padStart(12, '*'),
            icon: this.getIcon()
        });
    }
    initAuthFormEvents() {
        let hpdb = this;
        let hpdbAuthForm = document.getElementById('hpdb-auth');
        if (!hpdbAuthForm) {
            console.log('unable to find hpdb form');
            console.log(document);
            return null;
        }
        let hpdbEmailInput = document.getElementById('hpdbEmail');
        let hpdbPasswordInput = document.getElementById('hpdbPassword');
        hpdbAuthForm.addEventListener("submit", function (e) {
            e.preventDefault();
            console.log(e);
            hpdb._addTextToErrorBlock('')
            axios.put(
                'http://localhost:9883/api/v1/rpc/auth',
                {email: hpdbEmailInput.value, password: hpdbPasswordInput.value}
            )
                .then(hpdb._handleAuthResponse.bind(hpdb))
                .catch(function (e) {
                    if (e.response.status === 400) {
                        hpdb._addTextToErrorBlock("Неправильный email или password")
                    } else {
                        hpdb._addTextToErrorBlock("Сервер ответил ошибкой")
                    }
                    console.log(e);
                });

        });
    }
    initLogoutFormEvents() {
        console.log('hpdb logout events init');
        let hpdb = this;
        let hpdbExit = document.getElementById('hpdb-logout');
        hpdbExit.onclick = function(e) {
            e.preventDefault();
            hpdb.logout();
        }
    }
    _getEvents() {
        let hpdb = this;
        const hpdbApi = axios.create({
            baseURL: ApiContainer.getBackendUrl(),
            headers: {'Authorization': "Bearer " + hpdb.getAuthData().token}
        });
        return new Promise(function(resolve, reject) {
            hpdbApi.get('api/auth/hpdb/resources').then(function (response) {
                console.log(response);
            });

            resolve([]);
        });
    }
    _handleAuthResponse(response) {
        console.log("auth response", response)
        let hpdb = this;
        hpdb.setAuthData({token: response.data.token});
        hpdb.login();
    }
    _addTextToErrorBlock(text) {
        let hpdbAuthForm = document.getElementById('hpdb-auth');
        let errorsBlock =  hpdbAuthForm.getElementsByClassName('errors-container').item(0);
        let newErrNode = document.createElement('span');
        newErrNode.classList.add('red-text');
        newErrNode.appendChild(document.createTextNode(text))
        while (errorsBlock.firstChild) {
            errorsBlock.removeChild(errorsBlock.lastChild);
        }
        errorsBlock.appendChild(newErrNode)
    }
}
