require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');

const {
  SESSION_SECRET,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI,
  DISCORD_GUILD_ID,
  DISCORD_PRIV_ROLE_ID,
  TILE_SECRET,
  PUBLIC_MASTER,
  SECRET_MASTER,
} = process.env;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
  secret: SESSION_SECRET || 'dev',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

// ---- Image paths (keep these OUT of /public) ----
const MAPS = {
  public: path.resolve(PUBLIC_MASTER || 'private/world-public.png'),
  secret: path.resolve(SECRET_MASTER || 'private/world-secret.png'),
};

// ---- Signing helpers ----
const sign = s =>
  crypto.createHmac('sha256', TILE_SECRET || 'change-me').update(String(s)).digest('hex').slice(0,16);

// ---- Discord OAuth (only needed for secret map) ----
const DISCORD_API = 'https://discord.com/api';
const SCOPES = ['identify','guilds','guilds.members.read'];

function oauthUrl() {
  const u = new URL('/oauth2/authorize', DISCORD_API);
  u.searchParams.set('client_id', DISCORD_CLIENT_ID);
  u.searchParams.set('redirect_uri', DISCORD_REDIRECT_URI);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', SCOPES.join(' '));
  u.searchParams.set('prompt', 'consent');
  return u.toString();
}
async function tokenFromCode(code) {
  const body = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: DISCORD_REDIRECT_URI,
  });
  const r = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded'}, body
  });
  if (!r.ok) throw new Error('Token exchange failed');
  return r.json();
}
async function dget(pathname, token) {
  const r = await fetch(`${DISCORD_API}${pathname}`, { headers:{ Authorization:`Bearer ${token}` }});
  return r.ok ? r.json() : null;
}

app.get('/login', (_req, res) => res.redirect(oauthUrl()));
app.get('/logout', (req, res) => req.session.destroy(()=>res.redirect('/')));
app.get('/oauth/discord/callback', async (req, res) => {
  try {
    const tok = await tokenFromCode(req.query.code);
    const me  = await dget('/users/@me', tok.access_token);
    const mbr = await dget(`/users/@me/guilds/${DISCORD_GUILD_ID}/member`, tok.access_token);
    req.session.auth = {
      access_token: tok.access_token,
      user: { id: me.id, username: me.username, avatar: me.avatar },
      memberRoles: mbr?.roles || [],
      inGuild: !!mbr
    };
    req.session.save(()=>res.redirect('/'));
  } catch (e) {
    console.error(e);
    res.status(500).send('Auth failed');
  }
});

function isPriv(req) {
  return !!req.session?.auth?.memberRoles?.includes(DISCORD_PRIV_ROLE_ID);
}
app.get('/api/me', (req, res) => {
  const a = req.session?.auth;
  if (!a) return res.json({ ok:false });
  res.json({ ok:true, user:a.user, inGuild:a.inGuild, isPriv:isPriv(req), roles:a.memberRoles });
});

// ---- Signed image src (public: no login; secret: login + role) ----
app.get('/img-meta', (req, res) => {
  const map = (req.query.map === 'secret') ? 'secret' : 'public';
  if (map === 'secret') {
    if (!req.session?.auth?.access_token) return res.status(401).json({ ok:false, error:'not_authenticated' });
    if (!req.session?.auth?.inGuild)       return res.status(403).json({ ok:false, error:'not_in_guild' });
    if (!isPriv(req))                       return res.status(403).json({ ok:false, error:'missing_role' });
  }
  const expires = Date.now() + (map === 'public' ? 10*60*1000 : 60*1000); // public: 10min, secret: 1min
  const keyPayload = (map === 'public')
    ? `public:${expires}`
    : `${req.session.auth.user.id}:secret:${expires}`;
  const sig = sign(keyPayload);
  res.json({ ok:true, src: `/img/${map}?expires=${expires}&sig=${sig}` });
});

// ---- Protected image endpoints (send bytes; never expose file path) ----
app.get('/img/public', (req, res) => {
  const { expires, sig } = req.query;
  if (!expires || !sig || Date.now() > +expires || sig !== sign(`public:${expires}`)) {
    return res.sendStatus(403);
  }
  if (!fs.existsSync(MAPS.public)) return res.sendStatus(404);
  res.set('Cache-Control','no-store');
  res.type(path.extname(MAPS.public));
  fs.createReadStream(MAPS.public).pipe(res);
});

app.get('/img/secret', (req, res) => {
  if (!req.session?.auth?.access_token) return res.sendStatus(401);
  if (!req.session?.auth?.inGuild || !isPriv(req)) return res.sendStatus(403);

  const { expires, sig } = req.query;
  const userId = req.session.auth.user.id;
  if (!expires || !sig || Date.now() > +expires || sig !== sign(`${userId}:secret:${expires}`)) {
    return res.sendStatus(403);
  }
  if (!fs.existsSync(MAPS.secret)) return res.sendStatus(404);
  res.set('Cache-Control','no-store');
  res.type(path.extname(MAPS.secret));
  fs.createReadStream(MAPS.secret).pipe(res);
});

// ---- Static front-end (your updated index2.html) ----
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.listen(PORT, () => console.log(`✅ http://localhost:${PORT}`));
