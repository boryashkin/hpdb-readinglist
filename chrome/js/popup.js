import {ApiContainer} from "./classes/ApiContainer.js";
import {VkApi} from "./classes/VkApi.js";
import {HpdbApi} from "./classes/HpdbApi.js";

let container = new ApiContainer([new HpdbApi()]);

console.log('before init');
(function () {
    container.getEventTarget().dispatchEvent(new Event("beforeApisInit"));
    container.initApis().then(function () {
        console.log('after init');
        container.renderApiAuthorizationTab();
        container.initTaskListTab();
        console.log('after rendering');
        console.log('container events hired');
        container.getEventTarget().dispatchEvent(new Event("afterApisInit"));
    })
        .then(function () {
            let response = null;
            response = axios.post(
                'https://stats.borisd.ru/api/log/event',
                {
                    app: 'HpdbReadingList',
                    event: 'initApis',
                    version: container.version
                },
                {timeout: 3000}
            )
                .then(function (response) {
                    console.log("Logged stat");
                    console.log(response);
                })
                .catch(function (error) {
                    console.log(error);
                });
        })
        .catch(function (e) {
            console.error('Something goes wrong');
            console.error(e);
        });
        console.log('ending of script');
    document.getElementById("extension-version").innerText = "v" + container.version;
})();
