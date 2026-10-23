(function(){
'use strict';let dbPromise;
function database(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open('autozap-start-assets',1);request.onupgradeneeded=()=>request.result.createObjectStore('identities');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}));}
window.AutoZapBrandStorage={async get(key){const db=await database();return new Promise((resolve,reject)=>{const r=db.transaction('identities').objectStore('identities').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});},async put(key,value){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('identities','readwrite');tx.objectStore('identities').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}};
})();
