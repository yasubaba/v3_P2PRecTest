import cors from "cors";
import express from "express";
import jsrsasign from "jsrsasign";
import { SkyWayAuthToken, nowInSec, uuidV4 } from "@skyway-sdk/token";
import crypto from "crypto";

const appId = "";
const secret = "";

/*
const gcsConfig = {
  service: "GOOGLE_CLOUD_STORAGE",
  credential: JSON.stringify({
    // サービスアカウントの鍵のJSONファイルの内容をコピーペーストする
  }),
  bucket: "recording-test-front",
};*/

 const s3Config = {
   service: "",
   bucket: "",
   accessKeyId: "",
   secretAccessKey: "",
   region: "",
 };

// const wasabiConfig = {
//   service: "WASABI",
//   bucket: "",
//   accessKeyId: "",
//   secretAccessKey: "",
//   endpoint: "",
// };

const recordingApiBaseUrl = "https://recording.skyway.ntt.com/v1";
const channelApiUrl = "https://channel.skyway.ntt.com/v1/json-rpc";

// Web APIを操作するためのトークン
const createSkyWayAdminAuthToken = () => {
  const token = jsrsasign.KJUR.jws.JWS.sign(
    "HS256",
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
    JSON.stringify({
      exp: nowInSec() + 60,
      iat: nowInSec(),
      jti: uuidV4(),
      appId,
    }),
    secret
  );
  return token;
};

const app = express();
app.use(cors());
app.use(express.json());

const tokenHashChannelIdMap = {};
const channelNameIdMap = {};
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

const channelName = 'RecRoom'

// 入力のchannelNameのChannelを作成する
const response_capi = await fetch(channelApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${createSkyWayAdminAuthToken()}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: uuidV4(),
      method: "findOrCreateChannel",
      params: {
        name: channelName,
      },
    }),
});

  const {
    result: {
      channel: { id: channelId },
    },
  } = await response_capi.json();
  console.log(channelId);

  let body = JSON.stringify({
    input: {
      kind: "SFU",
      publications: [{ id: "*" }], // すべてのPublicationを保存する
    },
    output: s3Config, // Amazon S3を使う場合は s3Config を、Wasabiを使う場合は wasabiConfig を指定
  });

  console.log(body);

  // Recordingを開始する
  const response_recapi = await fetch(
    `${recordingApiBaseUrl}/channels/${channelId}/sessions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${createSkyWayAdminAuthToken()}`,
      },
      body: body,
    }
  );

  const { error, id, type, title, status, detail, instance } = await response_recapi.json();
  console.log(`body: ${response_recapi.body}`)
  console.log(`status code: ${response_recapi.status}`)
  console.log(`id: ${id}`);
  console.log(`type: ${type}`)
  console.log(`title: ${title}`)
  console.log(`status: ${status}`)
  console.log(`detail: ${detail}`)
  console.log(`instance: ${instance}`)


app.listen(9090);
console.log("Server is running on http://localhost:9090");
