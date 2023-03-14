export class AudioStreamer {
  private constraints = { audio: true };
  private audioIn: Promise<MediaStream>;
  private stream?: MediaStream;

  constructor() {
    this.audioIn = navigator.mediaDevices.getUserMedia(this.constraints);
  }

  start(): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        reject(
          new Error(
            'mediaDevices API or getUserMedia method is not supported in this browser.'
          )
        );
      } else {
        this.audioIn.then((stream) => {
          this.stream = stream;
          this.stream
            ?.getAudioTracks()
            .forEach((track) => (track.enabled = true));
          console.log('STARTED');
          resolve(stream);
        });
      }
    });
  }

  pause() {
    this.stream?.getAudioTracks().forEach((track) => (track.enabled = false));
    console.log('PAUSED');
  }

  resume() {
    this.stream?.getAudioTracks().forEach((track) => (track.enabled = true));
    console.log('RESUMED');
  }
}
