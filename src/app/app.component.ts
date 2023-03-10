import { Component } from '@angular/core';
import { AudioRecorder } from './helpers/audioRecorder.helper';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'VoiceTest';
  voiceActive = false;
  audioRecorder = new AudioRecorder(250);

  async voice() {
    if (!this.voiceActive) {
      this.voiceActive = true;
      await this.audioRecorder.start().catch((err: Error) => {
        console.log('RECORDING FAILED', err.message);
      });
    } else {
      await this.audioRecorder.stop();
      this.voiceActive = false;
    }
    console.log('VOICE ACTIVE', this.voiceActive);
  }
}
