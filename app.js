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

const arr = [];

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
  res.send({ to: new Date(), v: 'v2' });
});

app.post('/push', (req, res) => {
  try {
    const authorization = req.headers.authorization;
    const title = req.body.title;
    const body = req.body.body;

    if (authorization !== 'Bearer abc') {
      throw new Error();
    }

    arr.push({ title: title, body: body });

    // await sendmail(title, body);

    res.send({ to: 'ok' });
  } catch (error) {
    res.send({ to: 'ng' });
  }
});

app.listen(process.env.PORT || 1234, async () => {
  console.log(process.env.NODE_ENV);
  console.log('v2');
});

const main = () => {
  try {
    for (let i = 0; i < 2; i++) {
      // console.log(arr[0] == null);
      if (arr[0] == null) {
        continue;
      }
      sendmail(arr[0].title, arr[0].body);
      arr.shift();
    }
  } catch (error) {
  } finally {
    setTimeout(main, 1000);
  }
};

main();
