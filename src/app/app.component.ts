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
  remoteStream: MediaStream = new MediaStream();
  paused = false;
  started = false;
  peerConnections: Map<string, RTCPeerConnection> = new Map();
  GlobalAudio = new Audio();

  constructor(sService: SocketService) {
    // When recieving an offer, set it as a remote description
    sService.socket.on(
      'session',
      (session: RTCSessionDescriptionInit, id: string, answer: boolean) => {
        let pc = this.peerConnections.get(id)!;
        if (!pc) return;

        if (answer) {
          console.log('Answer', session);

          this.peerConnections
            .get(id)
            ?.setRemoteDescription(session)
            .catch((err) => console.error(err.message));
        } else {
          console.log('Offer', session);

          pc.createAnswer().then((answer) => {
            // pc!.setLocalDescription(answer);
            sService.sendSession(answer, id, true);
          });
          pc.setRemoteDescription(session).catch((err) =>
            console.error(err.message)
          );
        }
      }
    );

    // When recieving a candidate, set it on the apropriate pc
    sService.socket.on(
      'candidate',
      (candidate: RTCIceCandidate, id: string) => {
        console.log('ICE CANDIDATE DETECTED', candidate);
        if (this.peerConnections.has(id)) {
          this.peerConnections
            .get(id)!
            .addIceCandidate(candidate)
            .catch((err) => console.error(err.message));
        } else {
          console.log('ICE CANDIDATE FAILED');
        }
      }
    );

    // Add a new user to peer connections
    sService.socket.on('addID', async (Ids: string[]) => {
      console.log('addID');

      Ids.forEach((id) => {
        console.log('CURRENT ID', id);

        this.peerConnections.set(
          id,
          new RTCPeerConnection({
            iceServers: [
              {
                urls: 'stun:stun.12voip.com:3478',
              },
            ],
          })
        );

        console.log('PEER CONNECTION', this.peerConnections.get(id));

        this.peerConnections
          .get(id)
          ?.createOffer()
          .then((offer) => {
            console.log('TARGET CONNECTION', this.peerConnections.get(id));

            this.peerConnections.get(id)!.onicecandidate = (event) => {
              console.log('ONICECANDIDATE');

              if (event.candidate) sService.sendCandidate(event.candidate, id);
              console.log('OFFER SENT', offer);
            };

            this.peerConnections
              .get(id)
              ?.setLocalDescription(offer)
              .then(() => sService.sendSession(offer, id, false))
              .catch((err) => console.error(err.message));
          });

        this.peerConnections.get(id)!.ontrack = (event) => {
          console.log('ONTRACK FIRED', id);
          this.remoteStream.addTrack(event.track);
        };
      });

      if (this.voiceActive && this.stream) console.log('delID');
      this.stream?.getAudioTracks().forEach((track: MediaStreamTrack) => {
        console.log('TRACK', track);

        this.peerConnections.forEach((pc) => pc.addTrack(track, this.stream!));
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

          this.peerConnections.forEach(async (pc) => {
            pc.addTrack(track, this.stream!);
          });
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
