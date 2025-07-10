## ファイルの修正
下記を修正してください。

### ./server/main.js #7,8
ご自身のappId, secretを入力してください。
```javascript
const appId = "";
const secret = "";
```
### ./server/main.js #10,33
保存先のクラウドストレージの情報を入力してください。
ref) https://skyway.ntt.com/ja/docs/user-guide/recording/recording-quickstart/#340

### ./server/main.js #93
保存先のクラウドストレージがS3ではない場合は、該当のクラウドストレージのものに書き換えてください。

- gcsの場合: `output: gcsConfig,`
- s3の場合: `output: s3Config,`
- s3の場合: `output: wasabiConfig,`

### ./client/main.js #10,11
ご自身のappId, secretを入力してください。
```javascript
const appId = "";
const secret = "";
```

## アプリの起動
`npm run server` を起動してください。RecordingSessionが開始されます。
`npm run client` を起動してください。フロントエンドのアプリケーションが立ち上がります。出力された url にアクセスしてください。

## 注意事項
- RecordingSessionが起動するRoomNameは固定となっています。
- RecordingSessionを終了する機能は準備していません。
- RoomをCloseする機能は準備してません。
