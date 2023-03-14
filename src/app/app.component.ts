import { Component } from '@angular/core';
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
  paused = false;
  started = false;
  peerConnections: Map<string, RTCPeerConnection> = new Map();
  GlobalAudio = new Audio();

  constructor(sService: SocketService) {
    // When recieving an offer, set it as a remote description
    sService.socket.on(
      'offer',
      (offer: RTCSessionDescriptionInit, id: string) => {
        const pc = this.peerConnections.get(id);
        if (pc) {
          pc.setRemoteDescription(offer);
          pc.createAnswer().then((answer) => {
            sService.sendAnswer(answer);
          });
        }
      }
    );

    // When recieving an answer, set it as a remote description
    sService.socket.on(
      'answer',
      (answer: RTCSessionDescriptionInit, id: string) => {
        this.peerConnections.get(id)?.setRemoteDescription(answer);
      }
    );

    // Add a new user to peer connections
    sService.socket.on('addID', (Ids: string[]) => {
      Ids.forEach((id) => {
        this.peerConnections.set(id, new RTCPeerConnection());
        this.peerConnections
          .get(id)
          ?.createOffer()
          .then((offer) => sService.makeOffer(offer));
      });
    });

    // Remove user from peer connections
    sService.socket.on('delID', (id: string) => {
      this.peerConnections.delete(id);
    });
  }

  async voice() {
    if (!this.voiceActive) {
      this.voiceActive = true;
      let stream = await this.audioStreamer.start().catch((err: Error) => {
        console.log('RECORDING FAILED', err.message);
      });
      // if (stream) mediaPlayer(stream, this.GlobalAudio);
      if (stream)
        stream.getAudioTracks().forEach((track) => {
          this.peerConnections.forEach((pc) => pc.addTrack(track, stream!));
        });
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
