if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const gmail = google.gmail('v1');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const sleep = () => {
  return new Promise(r =>
    setTimeout(() => {
      r(true);
    }, 500)
  );
};

const makeBody = params => {
  params.subject = Buffer.from(params.subject).toString('base64'); //日本語対応

  const str = [
    `Content-Type: text/plain; charset=\"UTF-8\"\n`,
    `MIME-Version: 1.0\n`,
    `Content-Transfer-Encoding: 7bit\n`,
    `to: ${params.to} \n`,
    `from: ${params.from} \n`,
    `subject: =?UTF-8?B?${params.subject}?= \n\n`,
    params.message,
  ].join('');
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const sendmail = async (title, body) => {
  try {
    const oauth2Client = new OAuth2Client(
      process.env.CLIENTID,
      process.env.CLIENTSECRET,
      'http://localhost'
    );

    oauth2Client.credentials = JSON.parse(process.env.QUICKSTART);

    const raw = makeBody({
      to: process.env.TO,
      from: 'me',
      subject: title,
      message: body,
    });

    await gmail.users.messages.send({
      auth: oauth2Client,
      userId: 'me',
      resource: {
        raw: raw,
      },
    });
  } catch (error) {
    console.log('send error');
  }
};

app.get('/get', (_, res) => {
  res.send({ to: new Date(), v: 'v4' });
});

app.get('/push', async (req, res) => {
  try {
    const authorization = req.headers.authorization;
    const title = req.query.title;
    const body = req.query.body;

    // console.log(title, body, authorization);

    if (authorization !== 'Bearer abc') {
      throw new Error();
    }

    await sleep();
    sendmail(title, body);

    res.send({ to: 'ok' });
  } catch (error) {
    res.send({ to: 'ng' });
  }
});

app.listen(process.env.PORT || 1234, async () => {
  console.log(process.env.NODE_ENV);
  console.log('v4');
});
