const listeners=new Set();
let session=null;
const notify=()=>listeners.forEach(fn=>fn('SESSION_CHANGED',session));
async function request(path,body){if(import.meta.env.VITE_PUBLIC_PREVIEW==='true'){if(path==='session')return {session:null};throw new Error('Accounts are available on the localhost version. Browse the live shop as a guest.');}const response=await fetch('/api/'+path,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Account service is unavailable. Please try again later.');const result=await response.json();if(!response.ok)throw new Error(result.error||'Request failed.');return result;}
async function authenticate(path,body){try{const data=await request(path,body);session=data.session;notify();return {data,error:null};}catch(error){return {data:null,error};}}
export const auth={auth:{
 onAuthStateChange(fn){listeners.add(fn);request('session').then(data=>{session=data.session;notify();}).catch(()=>{session=null;notify();});return {data:{subscription:{unsubscribe:()=>listeners.delete(fn)}}};},
 signUp:({email,password,options})=>authenticate('register',{email,password,name:options.data.full_name}),
 signInWithPassword:credentials=>authenticate('login',credentials),
 async signOut(){try{await request('logout',{});session=null;notify();return {error:null};}catch(error){return {error};}}
}};
