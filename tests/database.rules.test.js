import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, test } from 'node:test';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, get, set, remove, push, serverTimestamp } from 'firebase/database';

const projectId = 'demo-loveworld-security';
let env;
const code = 'a'.repeat(64);
const room = 'love-' + code;

before(async () => {
  const rules = await readFile(new URL('../database.rules.json', import.meta.url), 'utf8');
  env = await initializeTestEnvironment({
    projectId,
    database: { rules, host: '127.0.0.1', port: 9000 }
  });
});

beforeEach(async () => env.clearDatabase());
after(async () => env.cleanup());

function db(uid) { return env.authenticatedContext(uid).database(); }
function presence(uid) {
  // Exact field shape emitted by Net.presence() in the production game.
  return { n:'Adil', a:[1,0,1,0], x:1.2, z:-2.4, y:0.15, r:0.75, s:'w', v:0, q:0, u:uid, e:null };
}
function player() {
  return { n:'Adil', a:[1,0,1,0], x:1, z:2, s:'w', t:Date.now() };
}
function base(uid) { return ref(db(uid), 'couples/' + code); }

test('unauthenticated users cannot read a room', async () => {
  await assertFails(get(ref(env.unauthenticatedContext().database(), 'couples/' + code)));
});

test('authenticated room members can read a room when they know its invite key', async () => {
  await assertSucceeds(get(base('alice')));
});

test('a player can write only their own player profile', async () => {
  await assertSucceeds(set(ref(db('alice'), 'couples/' + code + '/db/players/alice'), player()));
  await assertFails(set(ref(db('alice'), 'couples/' + code + '/db/players/bob'), player()));
});

test('presence allows authenticated users; free rules cannot enforce a two-player cap', async () => {
  const path = 'couples/' + code + '/rooms/' + room + '/presence/';
  await assertSucceeds(set(ref(db('alice'), path + 'alice'), presence('alice')));
  await assertSucceeds(set(ref(db('bob'), path + 'bob'), presence('bob')));
  await assertSucceeds(set(ref(db('charlie'), path + 'charlie'), presence('charlie')));
});

test('presence rejects spoofed UID and malformed data', async () => {
  const path = 'couples/' + code + '/rooms/' + room + '/presence/';
  await assertFails(set(ref(db('alice'), path + 'alice'), presence('bob')));
  await assertFails(set(ref(db('alice'), path + 'alice'), { n: 'A' }));
});

test('chat validates author, name, and message length', async () => {
  const path = 'couples/' + code + '/rooms/' + room + '/chat/';
  const mine = push(ref(db('alice'), path));
  await assertSucceeds(set(mine, { p:'alice', d:{n:'Adil',t:'Hello'}, ts:Date.now() }));
  await assertFails(set(push(ref(db('alice'), path)), { p:'bob', d:{n:'Bob',t:'Hello'}, ts:Date.now() }));
  await assertFails(set(push(ref(db('alice'), path)), { p:'alice', d:{n:'Adil',t:'x'.repeat(121)}, ts:Date.now() }));
  await assertSucceeds(remove(mine));
});

test('shared world and house accept valid data and reject malformed data', async () => {
  const worldPath = 'couples/' + code + '/db/shared/world';
  await assertSucceeds(set(ref(db('alice'), worldPath), { disc:{beach:1, villa:1}, pins:[{id:'pin1',x:2,z:3,t:'Meet me',e:'📍',by:'Adil'}], rev:Date.now() }));
  await assertFails(set(ref(db('alice'), worldPath), { disc:{}, rev:1 }));
  const housePath = 'couples/' + code + '/db/shared/house';
  await assertSucceeds(set(ref(db('alice'), housePath), { wall:1, floor:0, mood:'evening', items:[{t:2,x:1.5,z:-2,r:1,c:3}], rev:Date.now() }));
  await assertFails(set(ref(db('alice'), housePath), { wall:'invalid', floor:0, mood:'evening', items:[{id:'chair'}], rev:Date.now() }));
});
