import { Component } from '@angular/core';
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

  async voice() {
    if (!this.voiceActive) {
      this.voiceActive = true;
      await this.audioStreamer.start().catch((err: Error) => {
        console.log('RECORDING FAILED', err.message);
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
    else if (this.started) this.audioRecorder.stop();
    this.started = !this.started;
  }
}
