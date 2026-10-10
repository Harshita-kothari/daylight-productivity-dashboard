import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,scrypt as derive,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const scrypt=promisify(derive);
mkdirSync(new URL('./data/',import.meta.url),{recursive:true});
const db=new DatabaseSync(fileURLToPath(new URL('./data/accounts.sqlite',import.meta.url)));
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,salt TEXT NOT NULL,password_hash TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires INTEGER NOT NULL);');
const hash=token=>createHash('sha256').update(token).digest('hex');
const cookie=req=>(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('skymart_session='))?.slice(16);
const sessionFor=user=>({user:{id:user.id,email:user.email,user_metadata:{full_name:user.name}}});
function startSession(user,res){const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),user.id,Date.now()+604800000);res.setHeader('Set-Cookie',`skymart_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);return sessionFor(user);}
const attempts=new Map();
function limited(req){const key=req.socket.remoteAddress;const now=Date.now();let entry=attempts.get(key);if(!entry||now>entry.until){entry={count:0,until:now+60000};attempts.set(key,entry);}return ++entry.count>20;}
async function readBody(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>8192)throw new SyntaxError('Too large');}return JSON.parse(text||'{}');}
createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
 const send=(status,data)=>{res.writeHead(status);res.end(JSON.stringify(data));};
 const path=new URL(req.url,'http://localhost').pathname;
 try{
  if(req.method==='GET'&&path==='/api/session'){
   db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());const token=cookie(req);
   const user=token&&db.prepare('SELECT u.id,u.email,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?').get(hash(token),Date.now());
   return send(200,{session:user?sessionFor(user):null});
  }
  if(req.method!=='POST'||!['/api/register','/api/login','/api/logout'].includes(path))return send(404,{error:'Not found.'});
  if(req.headers.origin&&!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(req.headers.origin))return send(403,{error:'Origin not allowed.'});
  if(req.headers['content-type']?.split(';')[0]!=='application/json')return send(415,{error:'JSON required.'});
  if(path==='/api/logout'){const token=cookie(req);if(token)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));res.setHeader('Set-Cookie','skymart_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');return send(200,{ok:true});}
  if(limited(req))return send(429,{error:'Too many attempts. Try again in a minute.'});
  const data=await readBody(req);const email=String(data.email||'').trim().toLowerCase();const password=String(data.password||'');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||password.length<6||password.length>256)return send(400,{error:'Enter a valid email and a password between 6 and 256 characters.'});
  let user=db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if(path==='/api/register'){
   const name=String(data.name||'').trim();if(!name||name.length>120)return send(400,{error:'Enter your full name (up to 120 characters).'});
   if(user)return send(409,{error:'An account with this email already exists. Please sign in.'});
   const salt=randomBytes(16).toString('hex');const passwordHash=(await scrypt(password,salt,64)).toString('hex');
   try{const result=db.prepare('INSERT INTO users(email,name,salt,password_hash) VALUES(?,?,?,?)').run(email,name,salt,passwordHash);user={id:Number(result.lastInsertRowid),email,name};}catch(error){if(String(error).includes('UNIQUE'))return send(409,{error:'An account with this email already exists. Please sign in.'});throw error;}
  }else{const candidate=await scrypt(password,user?.salt||'invalid-user-salt',64);if(!user||!timingSafeEqual(candidate,Buffer.from(user.password_hash,'hex')))return send(401,{error:'Incorrect email or password.'});}
  const old=cookie(req);if(old)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(old));return send(200,{session:startSession(user,res)});
 }catch(error){send(error instanceof SyntaxError?400:500,{error:error instanceof SyntaxError?'Invalid request.':'Unable to complete request. Please try again.'});}
}).listen(3001,'127.0.0.1',()=>console.log('SkyMart account API: http://127.0.0.1:3001'));
