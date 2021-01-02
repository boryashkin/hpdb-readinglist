import {ApiContainer} from "./classes/ApiContainer.js";
import {HpdbApi} from "./auth/HpdbApi.js";
import {HpdbApiV1} from "./classes/HpdbApiV1.js";

let container = new ApiContainer([new HpdbApi()], new HpdbApiV1(), window.navigator.userAgent);

console.log('[popup] before init');
(async function () {
    container.runGui();
    axios.post(
        'https://stats.borisd.ru/api/log/event',
        {
            app: 'HpdbReadingList',
            event: 'initApis',
            version: container.version
        },
        {timeout: 3000}
    )
        .then(function (response) {
            console.log("[popup] Logged stat");
            console.log(response);
        })
        .catch(function (error) {
            console.error(error);
        });

    document.getElementById("extension-version").innerText = "v" + container.version;
})();
