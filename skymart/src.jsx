import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
import {auth} from './auth';
import Store from './Store';

function Icon({type}) {
 const paths={mail:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></>,lock:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></>,user:<><circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/></>,eye:<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,arrow:<><path d="M4 12h16m-6-6 6 6-6 6"/></>};
 return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}
function App(){
 const publicPreview=import.meta.env.VITE_PUBLIC_PREVIEW==='true';
 const guest={user:{id:'guest',email:'',user_metadata:{full_name:'Guest'}}};
 const [register,setRegister]=useState(location.pathname.endsWith('/register'));
 const [visible,setVisible]=useState(false);
 const [message,setMessage]=useState('');
 const [session,setSession]=useState(null);
 const signedIn=Boolean(session);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(Boolean(auth));
 React.useEffect(()=>{
  if(!auth)return;
  const {data:{subscription}}=auth.auth.onAuthStateChange((_event,next)=>{setSession(next);setLoading(false);});
  return ()=>subscription.unsubscribe();
 },[]);
 async function signOut(){setBusy(true);setMessage('');try{const {error}=await auth.auth.signOut();if(error)throw error;setSession(null);history.replaceState({},'','/login');setRegister(false);}catch{setMessage('Could not sign out. Please try again.');}finally{setBusy(false);}}
 function navigate(event,value){event.preventDefault();history.pushState({},'',value?'/register':'/login');setRegister(value);setMessage('');setVisible(false);document.querySelector('form')?.reset();}
 React.useEffect(()=>{const fn=()=>{setRegister(location.pathname.endsWith('/register'));setMessage('');};addEventListener('popstate',fn);return()=>removeEventListener('popstate',fn);},[]);
 async function submit(event){
  event.preventDefault();if(busy)return;
  const form=event.currentTarget;const data=new FormData(form);
  if(register&&data.get('password')!==data.get('confirm')){setMessage('Passwords do not match. Please try again.');return;}
  if(!auth){setMessage('Account service is being connected. Please try again later.');return;}
  setBusy(true);setMessage('');
  try{
   const credentials={email:String(data.get('email')).trim(),password:String(data.get('password'))};
   if(register){
    const {data:result,error}=await auth.auth.signUp({...credentials,options:{data:{full_name:String(data.get('name')).trim()}}});
    if(error)throw error;
    setSession(result.session);history.replaceState({},'','/home');
    form.reset();
   }else{
    const {data:result,error}=await auth.auth.signInWithPassword(credentials);
    if(error)throw error;setSession(result.session);history.replaceState({},'','/home');form.reset();
   }
  }catch(error){setMessage(error?.message||'Unable to connect. Please try again.');}finally{setBusy(false);}
 }
 function field(name,placeholder,icon,type='text'){return <div className="field"><Icon type={icon}/><input key={name} name={name} aria-label={placeholder} placeholder={placeholder} type={name==='password'&&visible?'text':type} minLength={type==='password'?6:undefined} autoComplete={name==='email'?'email':name==='name'?'name':register?'new-password':'current-password'} required/>{name==='password'&&<button type="button" className="reveal" aria-label={visible?'Hide password':'Show password'} aria-pressed={visible} onClick={()=>setVisible(!visible)}><Icon type="eye"/></button>}</div>}
 if(publicPreview&&!['/login','/register'].includes(location.pathname))return <Store session={guest} onSignOut={()=>{location.href='/login'}} busy={false}/>;
 if(signedIn)return <Store key={session.user.id} session={session} onSignOut={signOut} busy={busy}/>;
 return <main><div className="auth"><a className="brand" href="/login" onClick={e=>{navigate(e,false)}} aria-label="SkyMart home"><span className="bolt"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z"/></svg></span><span>Sky<span className="lime">Mart</span></span></a><section className="panel" aria-labelledby="title">{publicPreview&&<p className="message" style={{marginBottom:20}}>Live shop preview · Accounts run locally. <a href="/home" style={{color:"#c4f500"}}>Browse as guest →</a></p>}{signedIn?<><h1 id="title">Welcome to SkyMart</h1><p>Signed in as {session.user.email}</p><div className="welcome">✦<h2>You’re all set.</h2><p>Your next great find is just around the corner.</p></div><button className="primary" disabled={busy} onClick={signOut}>{busy?'Signing out…':'Sign out'} <Icon type="arrow"/></button>{message&&<p className="message" role="status">{message}</p>}</>:<><h1 id="title">{register?'Create account':'Sign in'}</h1><p>{register?'Join SkyMart and start shopping':'Enter your credentials to continue'}</p><form onSubmit={submit} key={register?'register':'login'}>{register&&field('name','Full name','user')}{field('email','Email address','mail','email')}{field('password',register?'Password (min 6 chars)':'Password','lock','password')}{register&&field('confirm','Confirm password','lock','password')}<button className="primary" type="submit" disabled={busy||loading} aria-busy={busy}>{loading?'Loading…':busy?'Please wait…':register?'Create Account':'Sign in'} <Icon type="arrow"/></button>{message&&<p className="message" role="status">{message}</p>}</form><p className="switch">{register?'Already have an account?':'Don’t have an account?'} <a href={register?'/login':'/register'} onClick={e=>navigate(e,!register)}>{register?'Sign in':'Create one'}</a></p></>}</section></div></main>
}
createRoot(document.getElementById('root')).render(<App/>);
