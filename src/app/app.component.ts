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
  stream: MediaStream | void = undefined;
  paused = false;
  started = false;
  peerConnections: Map<string, RTCPeerConnection> = new Map();
  GlobalAudio = new Audio();

  constructor(sService: SocketService) {
    // When recieving an offer, set it as a remote description
    sService.socket.on(
      'offer',
      (
        offer: RTCSessionDescriptionInit,
        candidate: RTCIceCandidate,
        id: string
      ) => {
        let pc = this.peerConnections.get(id);
        if (pc) {
          pc.addIceCandidate(candidate).catch((err) =>
            console.error(err.message)
          );
          pc.setRemoteDescription(offer).catch((err) =>
            console.error(err.message)
          );
          pc.createAnswer().then((answer) => {
            pc!.setLocalDescription(answer);
            sService.sendAnswer(answer, id);
          });
        }
      }
    );

    // When recieving an answer, set it as a remote description
    sService.socket.on(
      'answer',
      (answer: RTCSessionDescriptionInit, id: string) => {
        this.peerConnections
          .get(id)
          ?.setRemoteDescription(answer)
          .catch((err) => console.error(err.message));
      }
    );

    // Add a new user to peer connections
    sService.socket.on('addID', (Ids: string[]) => {
      Ids.forEach((id) => {
        this.peerConnections.set(id, new RTCPeerConnection());
        this.peerConnections
          .get(id)
          ?.createOffer()
          .then((offer) => {
            this.peerConnections.get(id)!.onicecandidate = (event) => {
              if (event.candidate)
                sService.makeOffer(offer, event.candidate, id);
            };
            this.peerConnections
              .get(id)
              ?.setLocalDescription(offer)
              .catch((err) => console.error(err.message));
          });

        this.peerConnections.get(id)!.ontrack = (event) => {
          console.log('ONTRACK FIRED', id);

          event.streams.forEach((stream) =>
            mediaPlayer(stream, new HTMLAudioElement())
          );
        };
      });

      if (this.voiceActive && this.stream)
        this.stream.getAudioTracks().forEach((track) => {
          console.log('TRACK', track);

          this.peerConnections.forEach((pc) =>
            pc.addTrack(track, this.stream!)
          );
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
      this.stream = await this.audioStreamer.start().catch((err: Error) => {
        console.log('RECORDING FAILED', err.message);
      });
      // if (this.stream) mediaPlayer(this.stream, this.GlobalAudio);
      if (this.stream)
        this.stream.getAudioTracks().forEach((track) => {
          console.log('TRACK', track);

          this.peerConnections.forEach((pc) =>
            pc.addTrack(track, this.stream!)
          );
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
