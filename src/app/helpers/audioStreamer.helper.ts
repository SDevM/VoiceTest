export class AudioStreamer {
  private constraints = { audio: true };
  private audioIn?: Promise<MediaStream>;
  private stream?: MediaStream;
  private started = false;
  public get isStarted(): boolean {
    return this.started;
  }

  constructor() {}

  start(): Promise<MediaStream> {
    this.audioIn = navigator.mediaDevices.getUserMedia(this.constraints);
    return new Promise((resolve, reject) => {
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        reject(
          new Error(
            'mediaDevices API or getUserMedia method is not supported in this browser.'
          )
        );
      } else {
        this.audioIn?.then((stream) => {
          this.stream = stream;
          resolve(this.stream);
          this.started = true;
          console.log('STARTED');
        });
      }
    });
  }

  pause() {
    if (!this.started) return
    this.stream?.getAudioTracks().forEach((track) => (track.enabled = false));
    console.log('PAUSED');
  }

  resume() {
    if (!this.started) return
    this.stream?.getAudioTracks().forEach((track) => (track.enabled = true));
    console.log('RESUMED');
  }
}
