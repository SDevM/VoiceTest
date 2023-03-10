export class AudioRecorder {
  private state: RecorderState = RecorderState.OFF;
  private constraints = { audio: true };
  private audioIn: Promise<MediaStream>;
  private mediaRecorder?: MediaRecorder;
  private audioElement = new Audio();
  private buffer: Blob[] = [];

  constructor(private timeslice: number) {
    this.audioIn = navigator.mediaDevices.getUserMedia(this.constraints);
  }

  start(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        reject(
          new Error(
            'mediaDevices API or getUserMedia method is not supported in this browser.'
          )
        );
      } else {
        this.audioIn.then((stream) => {
          this.buffer = [];
          this.mediaRecorder = new MediaRecorder(stream);
          this.mediaRecorder.addEventListener('dataavailable', (event) => {
            this.buffer.push(event.data);
          });
          this.mediaRecorder.start(this.timeslice);
          this.state = RecorderState.RECORDING;
          console.log('STARTED');
          resolve(true);
        });
      }
    });
  }

  resume() {
    if (this.mediaRecorder) this.mediaRecorder.resume();
    this.state = RecorderState.RECORDING;
    console.log('RESUMED');
  }

  pause() {
    if (this.mediaRecorder) this.mediaRecorder.pause();
    this.state = RecorderState.PAUSED;
    console.log('PAUSED');
  }

  stop() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.state = RecorderState.OFF;
      this.playSound(new Blob(this.buffer));
      console.log('STOPPED');
    }
  }

  cancel() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.state = RecorderState.OFF;
      console.log('CANCELLED');
    }
  }

  private async playSound(sound: Blob) {
    // create a new audio element
    const audioElement = new Audio();

    // set the audio element's source to the blob URL
    audioElement.src = URL.createObjectURL(sound);

    // play the audio
    audioElement.play();
  }
}

enum RecorderState {
  OFF,
  RECORDING,
  PAUSED,
}
