
/*
chrome.cookies.getAll({domain: ".amway.com"}, (cookies) => {
    console.log(cookies);
});
*/

/*
let getC = () : Promise<chrome.cookies.Cookie[]> => {
    return new Promise((r)=>{
        chrome.cookies.getAll({domain: ".amway.com"}, (cookies) => {
            r(cookies);
        });
    });
};

let main = async ()=>{
    let result = await getC();
    console.log(result);
};

try {
    main();
}
catch (e: unknown)
{
    console.log(e);
}
*/

import './assets/style.less';


import { createApp } from 'vue';
import App from './vue_components/App.vue';

const app = createApp(App);
app.mount('#root');