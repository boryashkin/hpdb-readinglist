export class VendorApi {
    constructor() {}
    getName() {
        return this.name;
    }
    getIcon() {
        return this.icon;
    }
    /**
     * Проверка авторизованности в апи
     * @returns bool
     */
    isAuthorized() {}

    /**
     * Fulfill internal variables, including authData
     */
    init() {}
    /**
     * Autorization data of class at this moment
     */
    getAuthData() {
        return this.authData;
    }
    /**
     * After getting async data for class, it's better to save it in memory of class without any Promises
     */
    setAuthData(data) {
        this.authData = data;
    }
    /**
     * Store auth data to some database
     */
    persistAuthData() {}
    getAuthForm() {}
    initAuthFormEvents() {}
    initLogoutFormEvents() {}

    login() {}
    logout() {}
}
