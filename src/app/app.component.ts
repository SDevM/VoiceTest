import { Component } from '@angular/core';
import Peer, { DataConnection } from 'peerjs';
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
  stream: MediaStream | void = undefined;
  paused = false;
  started = false;
  me: Peer = new Peer({
    debug: 3,
  });
  key?: string;
  peerConnections: Map<string, DataConnection> = new Map();
  GlobalAudio = new Audio();

  constructor(sService: SocketService) {
    // Set your peer id
    sService.setId(this.me?.id);

    // Upon joing the socket, get a key
    sService.socket.on('new', (key: string, peers: string[]) => {
      console.log('Peerjs Initialized.');
      peers?.forEach((peer, i) => {
        console.log('Peer #' + i, peer);
        sService.invitePeer(peer);
      });
    });

    // When recieving an offer, set it as a remote description
    sService.socket.on('peer', (peer: string, response: boolean) => {
      console.log(
        response ? 'Peer response recieved.' : 'Peer invite recieved'
      );

      if (this.peerConnections.has(peer)) return;
      this.peerConnections.set(peer, this.me?.connect(peer)!);
      const pc = this.peerConnections.get(peer);
      pc?.on('open', () => {
        console.log('Connection open', pc.peer);

        pc.send(this.stream);
      });
      pc?.on('data', (data) => {
        console.log('Data recieved from', pc.peer);

        const dataStream: MediaStream = data as MediaStream;
        mediaPlayer(dataStream);
      });
      if (!response) {
        sService.respondPeer(peer);
        console.log('Peer invitation responded to', peer);
      }
    });

    // Remove user from peer connections
    sService.socket.on('delID', (peer: string) => {
      this.peerConnections.delete(peer);
      console.log('Connection deleted for', peer);
    });
  }

  async voice() {
    if (!this.voiceActive) {
      this.voiceActive = true;
      if (this.audioStreamer.isStarted) this.audioStreamer.resume();
      else
        this.audioStreamer
          .start()
          .then((Stream) => {
            this.stream = Stream;
            this.peerConnections.forEach((pc) => pc.send(this.stream));
          })
          .catch((err: Error) => {
            console.error('Streaming failed.', err.message);
          });
    } else {
      this.voiceActive = false;
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
      this.peerConnections.forEach((keyVal) => {
        keyVal.send(audio);
      });
      this.paused = false;
    }
    this.started = !this.started;
  }
}
