# 上傳東華大學課表至Google Calendar

這項工具能夠將東華大學的課表上傳至Google Calendar上！主要用到的工具有架server的Express，爬學校選課網站的Puppeteer，以及上傳日曆會用到的Google API。

架在VPS上的網站：<https://woodfire.me/ndhucourse>


## 本地端使用
---
首先請確認電腦已安裝好Node.js、Redis。

```bash
$ git clone https://github.com/wooooodfire/ndhu-course.git
$ cd ndhu-course/
$ npm install
```

安裝爬蟲需要的Chromium。
```
$ node node_modules/puppeteer/install.js
```

`fetchCourse.js`的`browser`變數改成這樣。

```js
const browser = await puppeteer.launch({
	headless: true,
});
```

如果不想要花時間安裝，也可以直接用電腦裡的瀏覽器。請將`fetchCourse.js`的`browser`變數替換成自己電腦的Chrome使用。

- Mac用戶
```js
const browser = await puppeteer.launch({
	executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: true,
});
```
- Windows用戶
```js
const browser = await puppeteer.launch({
	executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
	headless: true,
});
```

接著在目錄中新建「.env」檔案，並且新增以下資訊。
```bash
YOUR_CLIENT_ID="自己的client id"
YOUR_CLIENT_SECRET="自己的client secret"
YOUR_REDIRECT_URL="http://127.0.0.1/ndhucourse/google/callback"
SECRET="sessionsecretyaaaa"
REDIS_PWD="redis的password，若沒有設密碼可以整行刪掉"
PORT="8000"
```
Client ID跟Client Secret的取得方式請參考這篇[Notion筆記](https://wooooodfire.notion.site/GCP-Console-Calendar-API-4ed958bbe9824f23aa9850406743a717)。

以上步驟完成之後，就可以開始run。

- 開啟redis的server
```bash
$ redis-server
```

- 另開一個shell，跑app.js
```bash
$ npm start
```
可以在<http://127.0.0.1:8000/ndhucourse>看到網站啦！