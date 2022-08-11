const express = require('express');
const app = express();
const superagent = require('superagent');
const ImageSuffix = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];

app.use(express.urlencoded({ extended: true }));

app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Request-With');
  res.header('Access-Control-Methods', 'GET, POST, PUT, DELETE');
  next();
});

app.all('*', (req, res) => {
  const method = req.method.toLocaleLowerCase();
  const url = req.url.includes('kf-ui.cdn-go.cn') ? req.url : `https://kftest.qq.com${req.url}`;

  switch (method) {
    case 'get':
      superagent
        .get(url)
        .set({
          Referer: 'https://kftest.qq.com',
        })
        .then((data) => {
          try {
            if (ImageSuffix.some((type) => req.url.includes(type))) {
              return handleImageData(req.url, res, data);
            }

            if (data.text) {
              return handleTextData(res, data);
            }

            if (data.body) {
              return handleBodyData(res, data);
            }

            res.status(200).json('{}');
          } catch (error) {
            res.status(200).json('{}');
          }
        })
        .catch((e) => {
          res.status(200).json('{}');
          console.log(req.url, e.message);
        });
      break;
    case 'post':
      superagent
        .post(url)
        .send(req.body)
        .set({
          Referer: 'https://kftest.qq.com',
        })
        .then((data) => {
          res.status(200).json(JSON.parse(data.text));
        })
        .catch((e) => {
          console.log(e.message);
        });
      break;
    default:
      break;
  }
});

function handleImageData(url, res, data) {
  if (url.includes('.png')) {
    return res.setHeader('Content-Type', 'image/png').end(data.body);
  }

  if (url.includes('.jpg')) {
    return res.setHeader('Content-Type', 'image/jpg').end(data.body);
  }

  if (url.includes('.jpeg')) {
    return res.setHeader('Content-Type', 'image/jpeg').end(data.body);
  }

  if (url.includes('.svg')) {
    return res.setHeader('Content-Type', 'image/svg').end(data.body);
  }

  if (url.includes('.gif')) {
    return res.setHeader('Content-Type', 'image/gif').end(data.body);
  }
}

function handleTextData(res, data) {
  if (typeof data.text == 'string') {
    try {
      return res.status(200).json(JSON.parse(data.text));
    } catch (error) {
      return res.status(200).json(data.text);
    }
  }

  return res.status(200).json(JSON.parse(JSON.stringify(data.text)));
}

function handleBodyData(res, data) {
  if (typeof data.body == 'string') {
    return res.status(200).json(JSON.parse(data.body));
  }

  return res.status(200).json(JSON.parse(Buffer.from(data.body).toString('utf8')));
}

app.listen(4000, () => {
  console.log('please access 127.0.0.1:4000');
});
