// Run locally. Prompts do not echo the password and output contains no secrets.
import readline from 'node:readline';
import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const names={elite:'the-elite'};
const name=names[process.argv[2]];if(!name)throw Error('Usage: node scripts/admin-secrets.mjs elite');
if(!process.stdin.isTTY)throw Error('Run in an interactive terminal on your computer.');
const rl=readline.createInterface({input:process.stdin,output:process.stdout});
const email=await new Promise(resolve=>rl.question('Admin email: ',resolve));
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Email tidak sah.');
rl.close();
async function password(prompt){process.stdout.write(prompt);process.stdin.setRawMode(true);process.stdin.resume();let value='';return new Promise((resolve,reject)=>{function receive(chunk){for(const char of chunk.toString()){if(char==='\u0003'){cleanup();reject(Error('Cancelled'));return}if(char==='\r'||char==='\n'){cleanup();resolve(value);return}if(char==='\u007f'){value=value.slice(0,-1)}else if(char>=' '){value+=char}}}function cleanup(){process.stdin.off('data',receive);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n')}process.stdin.on('data',receive)})}
const value=await password('Admin password (hidden, at least 12 characters): ');
if(value.length<12||value.length>256)throw Error('Use 12–256 characters.');
if(value!==await password('Confirm password (hidden): '))throw Error('Passwords do not match.');
const salt=randomBytes(16),secrets={ADMIN_EMAIL:email.trim(),ADMIN_PASSWORD_HASH:pbkdf2Sync(value,salt,100000,32,'sha256').toString('hex'),ADMIN_PASSWORD_SALT:salt.toString('hex'),ADMIN_SESSION_SECRET:randomBytes(32).toString('hex')};
const cli=fileURLToPath(new URL('../the-elite/node_modules/wrangler/bin/wrangler.js',import.meta.url));
const r=spawnSync(process.execPath,[cli,'secret','bulk','--name',name],{input:JSON.stringify(secrets),stdio:['pipe','inherit','inherit']});
if(r.status!==0)process.exit(r.status||1);
console.log('Admin secrets uploaded. Password was not printed or saved to disk.');
