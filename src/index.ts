import { runes } from 'runes2';
import { User, Visibility, WebhookResponse } from './misskey';

export interface Env {
  APIKEY: string;
  USERID: string;
  HOST: string;
  SECRET: string;
}

export default {
  async fetch(request: Request, env: Env) {
    if (request.headers.get('X-Misskey-Hook-Secret') !== env.SECRET) {
      console.log('wrong secret');
      return new Response('wrong secret');
    }

    const reqBody = await request.text();
    console.log(reqBody);

    if (!reqBody) {
      console.log('not json');
      return new Response('not json');
    }

    const body: WebhookResponse = JSON.parse(reqBody);

    if (body.type !== 'mention' && body.type !== 'followed') {
      console.log('not mention / followed');
      return new Response('not mention / followed');
    }

    if (body.type === 'followed') {
      const user = body.body.user;
      return await follow(env.HOST, env.APIKEY, user);
    }

    // mention
    const note = body.body.note;
    if (note.userId === env.USERID) {
      console.log('from me');
      return new Response('from me');
    }

    const user = note.user;
    const username = user.host ? `${user.username}@${user.host}` : user.username;
    const replyId = note.id;
    const text = note.reply && note.text?.includes('!reply!') ? note.reply.text : note.text;
    if (!text) {
      console.log('no text');
      return new Response('no text');
    }

    return reply({
      apikey: env.APIKEY,
      host: env.HOST,
      text,
      replyId,
      username,
      visibility: note.visibility,
    });
  },
};

async function reply({
  host,
  apikey,
  text,
  username,
  replyId,
  visibility,
}: {
  host: string;
  apikey: string;
  text: string;
  username: string;
  replyId: string;
  visibility: Visibility;
}) {
  const _text = removeUnnecessary(removeUrl(removeMention(text)));

  if (text.length > 2000) {
    await postNote(host, apikey, {
      text: `@${username}\n投稿の文字数は2000文字以内にしてください`,
      visibility,
      replyId,
    });
    console.log('too long text');
    return new Response('too long text');
  }

  const sortedText = runes(_text).sort().join('').trim();
  const ok = await postNote(host, apikey, {
    text: `@${username}\n${sortedText}`,
    visibility,
    replyId,
  });

  console.log(ok);
  return new Response(ok ? 'ok' : 'error');
}

function removeUnnecessary(text: string): string {
  return text.replaceAll(/[@]/gi, '');
}

function removeMention(text: string): string {
  return text.replace(/@sortbot(@[a-z0-9_][a-z0-9_.-]*[a-z0-9_]?)?\s*/i, '');
}

function removeUrl(text: string): string {
  return text.replaceAll(/https?:\/\/[\w/:%#$&?()~.=+-@]+/gi, '');
}

async function follow(host: string, apikey: string, user: User) {
  await fetch(`${host.replace(/\/$/, '')}/api/following/create`, {
    body: JSON.stringify({ userId: user.id, i: apikey }),
    method: 'POST',
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  }).then((res) => res.ok);
  console.log(`followed @${user.username}@${user.host}(${user.id})`);
  return new Response(`followed @${user.username}@${user.host}(${user.id})`);
}

async function postNote(
  hostUrl: string,
  apikey: string,
  body: Record<string, string | number | string[]>
): Promise<boolean> {
  return await fetch(`${hostUrl.replace(/\/$/, '')}/api/notes/create`, {
    body: JSON.stringify({ ...body, i: apikey }),
    method: 'POST',
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  }).then((res) => res.ok);
}
