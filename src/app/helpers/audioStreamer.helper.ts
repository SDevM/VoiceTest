export class AudioStreamer {
  private constraints = { audio: true };
  private audioIn: Promise<MediaStream>;
  private stream?: MediaStream;
  private audioElement = new Audio();

  constructor() {
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
          this.stream = stream;
          if (this.stream) this.mediaPlayer(this.stream);
          console.log('STARTED');
          resolve(true);
        });
      }
    });
  }

  stop() {
    this.stream?.getAudioTracks().forEach((track) => track.stop());
    console.log('STOPPED');
  }

  private mediaPlayer(media: MediaStream) {
    // set the audio element's source to the blob URL
    this.audioElement.srcObject = media;

    // play the audio
    this.audioElement.play();
  }
}
