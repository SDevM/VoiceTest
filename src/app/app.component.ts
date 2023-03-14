import { Component } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { blobPlayer, mediaPlayer } from './helpers/audioPlayer.helper';
import { AudioRecorder } from './helpers/audioRecorder.helper';
import { AudioStreamer } from './helpers/audioStreamer.helper';

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
  paused = false;
  started = false;
  peerConnection = new RTCPeerConnection();
  dataChannel?: RTCDataChannel;
  GlobalAudio = new Audio();

  constructor(private socket: Socket) {
    socket.on('offer', (offer: any) => {});
  }

  async voice() {
    if (!this.voiceActive) {
      this.voiceActive = true;
      let stream = await this.audioStreamer.start().catch((err: Error) => {
        console.log('RECORDING FAILED', err.message);
      });
      // if (stream) mediaPlayer(stream, this.GlobalAudio);
      if (stream)
        this.peerConnection.addTrack(stream.getAudioTracks()[0], stream);
        this.peerConnection.
    } else {
      await this.audioStreamer.stop();
      this.voiceActive = false;
    }
    console.log('VOICE ACTIVE', this.voiceActive);
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
      if (audio) blobPlayer(audio, this.GlobalAudio);
      this.paused = false;
    }
    this.started = !this.started;
  }
}
