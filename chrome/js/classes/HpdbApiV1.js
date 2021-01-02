import {authForm, authorizedBlock} from "../templates.js";
import {User, TaskItem, Group, WebsiteGroupsResponse, Website} from "../classes.js";
import {ApiContainer} from "./ApiContainer.js";

export class HpdbApiV1 {
    init(baseUrl, token, userAgent) {
        HpdbApiV1._debug('HpdbApiV1::init()')
        let api = this;
        this.name = "HPDB v1";
        this.userAgent = userAgent;
        this.httpClient = axios.create({
            baseURL: baseUrl,
            headers: {'Authorization': token}
        });
        let userHandler = async function (user) {
            this.user = user;
            await this.getCurrentGroup().then((function (group) {this.group = group; console.log('DEMO', group)}).bind(this));
            this.ready = true;
            HpdbApiV1._debug('[HpDb] group READY')
            HpdbApiV1._debug(this.group)
        }
        let init1 = function (resolve, reject) {
            this.getCurrentUser().then(userHandler.bind(api)).finally(resolve)
        }

        return new Promise(init1.bind(api));
    }
    disable() {
        this.ready = false;
    }
    isReady() {
        HpdbApiV1._debug('HpdbApiV1::isReady()')
        return this.ready === true;
    }
    async getCurrentGroup() {
        HpdbApiV1._debug('HpdbApiV1::getCurrentGroup()')
        if (this.group) {
            HpdbApiV1._debug('[HpdbApiV1] group is already set, returning')
            return this.group;
        }

        try {
            HpdbApiV1._debug('[HpdbApiV1] getGroup')
            return await this.getGroup(HpdbApiV1.getGroupSlug(this.user.id, this.userAgent));
        } catch (err) {
            console.error(err);
        }

        HpdbApiV1._debug('[HpdbApiV1] createGroup')
        return await this.createGroupForUserAgent(this.userAgent)
    }
    createGroupForUserAgent(userAgent) {
        let api = this;
        HpdbApiV1._debug('HpdbApiV1::createGroupForUserAgent("' + userAgent + ')"')
        let getMyGroupsHandler = function(resolve, reject) {
            this.httpClient.post(
                '/api/v1/group',
                {
                    "name": "Users " + this.user.id + " reading list",
                    "slug": HpdbApiV1.getGroupSlug(this.user.id, userAgent),
                    "description": userAgent,
                    "showOnMain": false,
                    "public": false,
                }
            ).then(function (response) {
                resolve(new Group(response.data))
            }).catch(reject);
        };

        return new Promise(getMyGroupsHandler.bind(api));
    }
    getGroup(slug) {
        let api = this;
        HpdbApiV1._debug('HpdbApiV1::getGroup(' + slug + ')')
        let handler = function(resolve, reject) {
            this.httpClient.get('/api/v1/group/' + slug).then(function (response) {
                resolve(new Group(response.data))
            }).catch(reject);
        };

        return new Promise(handler.bind(api));
    }
    getMyGroups() {
        let api = this;
        HpdbApiV1._debug('HpdbApiV1::getMyGroups()')
        let getMyGroupsHandler = function(resolve, reject) {
            this.httpClient.get('/api/v1/rpc/my-groups').then(function (response) {
                let items = []
                response.data.forEach(function(group) {
                    items.push(
                        new TaskItem(
                            "group-" + group.slug,
                            group.name,
                            ApiContainer.getBackendUrl() + "/api/v1/group/" + group.slug,
                            group.description,
                            group.logo,
                            group.updatedAt,
                            []
                        )
                    );
                });

                resolve(items)
            }).catch(reject);
        };

        return new Promise(getMyGroupsHandler.bind(api));
    }
    getGroupProfiles(groupId) {
        let api = this;
        HpdbApiV1._debug('HpdbApiV1::getGroupProfiles()')
        let getMyGroupsHandler = function(resolve, reject) {
            this.httpClient.get('/api/v1/profile?group=' + groupId).then(function (response) {
                let items = []
                response.data.forEach(function(profile) {
                    items.push(
                        new TaskItem(
                            "profile-" + profile.id,
                            profile.homepage,
                            ApiContainer.getBackendUrl() + "/api/v1/profile/" + profile.id,
                            profile.description,
                            "",
                            profile.updatedAt,
                            []
                        )
                    );
                });

                resolve(items)
            }).catch(reject);
        };

        return new Promise(getMyGroupsHandler.bind(api));

    }
    getCurrentUser() {
        let api = this;
        HpdbApiV1._debug('HpdbApiV1::getCurrentUser()')
        let handler = function(resolve, reject) {
            this.httpClient.get("/api/v1/rpc/current-user").then(function (response) {
                let user = new User(response.data.email, response.data.createdAt);

                resolve(user)
            }).catch(reject);
        };

        return new Promise(handler.bind(api));
    }
    addWebsite(uri) {
        let api = this;
        HpdbApiV1._debug('HpdbApiV1::addWebsite(' + uri + ')')
        let handler = function(resolve, reject) {
            this.httpClient.post(
                "/api/v1/profile",
                {
                    "website": uri,
                    "isPublic": false
                }
            ).then(function (response) {
                let website = new Website(response.data);

                resolve(website)
            }).catch(reject);
        };

        return new Promise(handler.bind(api));
    }
    addWebsiteToGroup(websiteId, groupId) {
        let api = this;
        HpdbApiV1._debug('HpdbApiV1::addProfileToGroup(' + groupId + ')')
        let handler = function(resolve, reject) {
            this.httpClient.put(
                "/api/v1/rpc/add-website-to-group",
                {
                    "websiteId": websiteId,
                    "groupId": groupId
                }
            ).then(function (response) {
                let websiteGroupsResponse = new WebsiteGroupsResponse(response.data);

                resolve(websiteGroupsResponse)
            }).catch(reject);
        };

        return new Promise(handler.bind(api));
    }

    _getEvents() {

    }
    static getGroupSlug(userId, userAgent) {
        return ("r-list-" + userId + userAgent.replace(/[^a-z0-9]/gi,'')).substr(0, 20)
    }
    static _debug(obj) {
        if (true) {
            console.log(obj)
        }
    }
}
