import {
  nowInSec,
  SkyWayAuthToken,
  SkyWayContext,
  SkyWayRoom,
  SkyWayStreamFactory,
  uuidV4,
} from "@skyway-sdk/room";

const appId = "";
const secret = "";

const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24,
  version: 3,
  scope: {
    appId: appId,
    analytics: {
      enabled: true,
    },
    rooms: [
    {
      name: "*",
      methods: ["create", "close", "updateMetadata"],
      member: {
        name: "*",
        methods: ["publish", "subscribe", "updateMetadata"]
      },
      sfu: {
        enabled: true,
        maxSubscribersLimit: 1,
      }
    }],
    turn: {
      enabled: true
    }
  }
}).encode(secret);

void (async () => {
  const localVideo = document.getElementById('local-video');
  const buttonArea = document.getElementById('button-area');
  const remoteMediaArea = document.getElementById('remote-media-area');
  const channelNameInput = document.getElementById('channel-name');

  const dataStreamInput = document.getElementById('data-stream');

  const myId = document.getElementById('my-id');
  const joinButton = document.getElementById('join');
  const recordingTgl = document.getElementById('recording-tgl');
  const writeButton = document.getElementById('write');
  // button init
  recordingTgl.disabled = true;
  writeButton.disabled = true;

  const { audio, video } =
    await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  video.attach(localVideo);
  await localVideo.play();

  const data = await SkyWayStreamFactory.createDataStream();
  writeButton.onclick = () => {
    data.write(dataStreamInput.value);
    dataStreamInput.value = '';
  };

  joinButton.onclick = async () => {
    if (channelNameInput.value === '') return;

    const context = await SkyWayContext.Create(token, {
      log: {
        level: 'debug',
      },
    });
    const channel = await SkyWayRoom.FindOrCreate(context, {
      type: 'p2p',
      name: channelNameInput.value,
    });
    const me = await channel.join();
    
    recordingTgl.disabled = false;
    recordingTgl.addEventListener( 'click', async () => {
      const recordingSFURoom = await SkyWayRoom.FindOrCreate(context, {
        type: 'sfu',
        name: `RecRoom`,
      });
      const recordingAgent = await recordingSFURoom.join();

      // 一度PublishしたStreamは再度Publishすることができないので、改めて録音・録画用のStreamを取得します
      const { audio: recordingAudio, video: recordingVideo } =
        await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
      const recordingAudioPublication = await recordingAgent.publish(recordingAudio, {
        maxSubscribers: 1
      });
      const recordingVideoPublication = await recordingAgent.publish(recordingVideo, {
        maxSubscribers: 1
      });

      // 録音録画を開始します
      // startRecording関数はあくまでも例であり、実際はユーザーのアプリケーションにて実装していただく処理です
      // await startRecording([recordingAudioPublication.id, recordingVideoPublication.id]);
      console.log('start recording');
      
    });
    
    writeButton.disabled = false;

    myId.textContent = me.id;

    await me.publish(audio);
    await me.publish(video);
    await me.publish(data);

    const subscribeAndAttach = (publication) => {
      if (publication.publisher.id === me.id) return;

      const subscribeButton = document.createElement('button');
      subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
      buttonArea.appendChild(subscribeButton);

      subscribeButton.onclick = async () => {
        const { stream } = await me.subscribe(publication.id);

        switch (stream.contentType) {
          case 'video':
            {
              const elm = document.createElement('video');
              elm.playsInline = true;
              elm.autoplay = true;
              stream.attach(elm);
              remoteMediaArea.appendChild(elm);
            }
            break;
          case 'audio':
            {
              const elm = document.createElement('audio');
              elm.controls = true;
              elm.autoplay = true;
              stream.attach(elm);
              remoteMediaArea.appendChild(elm);
            }
            break;
          case 'data': {
            const elm = document.createElement('div');
            remoteMediaArea.appendChild(elm);
            elm.innerText = 'data\n';
            stream.onData.add((data) => {
              elm.innerText += data + '\n';
            });
          }
        }
      };
    };

    channel.publications.forEach(subscribeAndAttach);
    channel.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
  };
})();

