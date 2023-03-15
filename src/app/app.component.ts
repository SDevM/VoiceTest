import { Component } from '@angular/core';
import Peer, { MediaConnection } from 'peerjs';
import { blobPlayer, mediaPlayer } from './helpers/audioPlayer.helper';
import { AudioRecorder } from './helpers/audioRecorder.helper';
import { AudioStreamer } from './helpers/audioStreamer.helper';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'VoiceTest';
  voiceActive = false;
  audioStreamer = new AudioStreamer();
  audioRecorder = new AudioRecorder(250);
  stream?: MediaStream;
  rec?: MediaRecorder;
  paused = false;
  started = false;
  me: Peer = new Peer({
    debug: 1,
  });
  peers = new Set<string>();
  mediaConnections: Map<string, MediaConnection> = new Map();
  GlobalAudio = new Audio();

  constructor(sService: SocketService) {
    // Set your peer id
    this.me.on('open', () => {
      console.log('Peerjs Initialized');

      sService.setId(this.me?.id);
    });

    // Respond to call
    this.me.on('call', (incoming) => {
      console.log('Call recieved', incoming.peer);

      incoming.answer(this.stream);
      incoming.on('stream', (stream) => {
        // Do something with this audio stream
        mediaPlayer(stream);
      });
    });

    // Upon joing the socket, get a key
    sService.socket.on('new', (key: string, peers: string[]) => {
      console.log('Peerjs Accepted.', key);
      console.log('Peers: ', peers);

      peers.forEach((peer, i) => {
        console.log('Peer #' + i, peer);
        this.peers.add(peer);
        sService.invitePeer(peer);
      });
    });

    // When recieving an offer, set it as a remote description
    sService.socket.on('peer', (peer: string, response: boolean) => {
      console.log(
        response ? 'Peer response recieved.' : 'Peer invite recieved'
      );

      if (this.mediaConnections.has(peer)) return;
      if (!response) {
        sService.respondPeer(peer);
        console.log('Peer invitation responded to', peer);
      } else {
        this.peers.add(peer);
      }
      // this.mediaConnections.set(peer, this.me?.connect(peer)!);
      if (!this.stream) return;
      this.mediaConnections.set(peer, this.me.call(peer, this.stream));
      const mc = this.mediaConnections.get(peer);
      mc?.on('stream', (stream) => {
        // Do something with this audio stream
        mediaPlayer(stream);
      });

      // pc?.on('open', () => {
      //   console.log('Connection open', pc.peer);

      //   if (!this.stream) return;
      //   const rec = new MediaRecorder(this.stream!);
      //   rec.ondataavailable = (data) => {
      //     pc.send(data.data);
      //   };
      // });
      // pc?.on('data', function (data) {
      //   console.log('Data recieved from', pc.peer);

      //   const audioBlob = new Blob([data as Blob], {
      //     type: 'audio/webm;codecs=opus',
      //   });
      //   blobPlayer(audioBlob);
      // });
      console.log('New Call Started', mc);
    });

    // Remove user from peer connections
    sService.socket.on('delID', (peer: string) => {
      this.mediaConnections.delete(peer);
      this.peers.delete(peer);
      console.log('Connection deleted for', peer);
    });
  }

  async voice() {
    if (!this.voiceActive) {
      this.voiceActive = true;
      if (this.audioStreamer.isStarted) {
        this.audioStreamer.resume();
        this.rec?.resume();
      } else
        this.audioStreamer
          .start()
          .then((stream) => {
            this.stream = stream;
            this.mediaConnections.forEach((mc) => {
              mc.answer(this.stream);
            });
            this.peers.forEach((peer) => this.me.call(peer, this.stream!));
          })
          .catch((err: Error) => {
            console.error('Streaming failed.', err.message);
          });
    } else {
      this.voiceActive = false;
      this.rec?.pause();
      await this.audioStreamer.pause();
    }
    console.log('Voice active.', this.voiceActive);
  }

  toggle() {
    if (!this.paused) this.audioRecorder.pause();
    else if (this.paused) this.audioRecorder.resume();
    this.paused = !this.paused;
  }

  recordToggle() {
    if (!this.started) this.audioRecorder.start();
    else if (this.started) {
      let audio = this.audioRecorder.stop();
      if (audio) blobPlayer(audio);
      this.paused = false;
    }
    this.started = !this.started;
  }
}
