import assert from 'node:assert/strict';
const base='http://127.0.0.1:3001/api/';
const email=`verification-${Date.now()}@example.com`;
async function post(path,data,cookie){return fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(data)});}
const registered=await post('register',{email,password:'test-only-4829',name:'Verification Account'});
assert.equal(registered.status,200);assert.equal((await registered.json()).session.user.email,email);
const cookie=registered.headers.get('set-cookie').split(';')[0];assert.match(registered.headers.get('set-cookie'),/HttpOnly/);
assert.equal((await post('register',{email,password:'test-only-4829',name:'Duplicate'})).status,409);
assert.equal((await post('login',{email,password:'wrong-password'})).status,401);
let session=await fetch(base+'session',{headers:{Cookie:cookie}});assert.equal((await session.json()).session.user.email,email);
assert.equal((await post('logout',{},cookie)).status,200);
session=await fetch(base+'session',{headers:{Cookie:cookie}});assert.equal((await session.json()).session,null);
assert.equal((await post('login',{email,password:'test-only-4829'})).status,200);
console.log('Passed: registration, duplicate rejection, incorrect-password rejection, session restoration, logout invalidation, saved-account login.');
