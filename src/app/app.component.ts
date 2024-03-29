import { Component } from '@angular/core';
import Peer, { DataConnection, MediaConnection } from 'peerjs';
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
  paused = false;
  started = false;
  me: Peer = new Peer({
    secure: true,
    debug: 1,
  });
  mediaConnections: Map<string, MediaConnection> = new Map();
  peerConnections: Map<string, DataConnection> = new Map();
  peers = new Set<string>();
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
      this.mediaConnections.set(incoming.peer, incoming);

      incoming.on('close', () => {
        this.mediaConnections.delete(incoming.peer);
      });
      incoming.on('stream', (stream) => {
        // Do something with this audio stream
        mediaPlayer(stream);
      });

      this.waitFor<MediaStream | undefined>(
        () => this.stream,
        () => {
          console.log('Answering with', this.stream);
          incoming.answer(this.stream);
        }
      );
    });

    // Upon joing the socket, get a key
    sService.socket.on('new', (key: string, peers: string[]) => {
      console.log('Peerjs Accepted.', key);

      peers.forEach((peer, i) => {
        console.log('Peer #' + i, peer);
        this.peers.add(peer);
        this.peerConnections.set(peer, this.me.connect(peer));
        this.peerConnections
          .get(peer)
          ?.on('data', (data) => blobPlayer(data as Blob));
        console.log('New Channel Participants:', [peer, this.me.id].sort());

        sService.requestConnection(peer);
        sService.invitePeer(peer);
      });
      console.log('Peers: ', peers);
    });

    // Upon recieving a connect request
    sService.socket.on('channel', (peer: string) => {
      console.log('New Channel Participants:', [peer, this.me.id].sort());

      this.peerConnections.set(peer, this.me.connect(peer));
      this.peerConnections
        .get(peer)
        ?.on('data', (data) => blobPlayer(data as Blob));
    });

    // When recieving an offer, set it as a remote description
    sService.socket.on('peer', (peer: string) => {
      this.peers.add(peer);
      console.log('New peer accepted', peer);
    });

    // Remove user from peer connections
    sService.socket.on('delID', (peer: string) => {
      this.mediaConnections.delete(peer);
      this.peerConnections.delete(peer);
      this.peers.delete(peer);
      console.log('Connection deleted for', peer);
    });
  }

  async voice() {
    if (!this.voiceActive) {
      this.voiceActive = true;
      if (this.audioStreamer.isStarted) {
        this.audioStreamer.resume();
      } else
        this.audioStreamer
          .start()
          .then((stream) => {
            console.log('New stream.', stream);

            this.stream = stream;
            console.log('CULPRITS');
            console.log('MediaConnections', this.mediaConnections);
            console.log('Peers', this.peers);
            this.peers.forEach((peer) => {
              this.mediaConnections.set(peer, this.me.call(peer, this.stream!));
              this.mediaConnections.get(peer)?.on('stream', (stream) => {
                mediaPlayer(stream);
              });
              console.log('Call established to', peer);
            });
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
      console.log('Sending vn to peers', this.peers.keys());

      this.peerConnections.forEach((connection) => {
        console.log('Audio sent to', connection.peer);

        connection.send(audio);
      });
      this.paused = false;
    }
    this.started = !this.started;
  }

  waitFor<T>(g: () => T, c: () => void) {
    const hook = setInterval(() => {
      if (g()) {
        c();
        clearInterval(hook);
      }
    }, 500);
  }
}
