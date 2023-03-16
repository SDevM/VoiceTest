export function mediaPlayer(media: MediaStream) {
  const audioElement = document.createElement('audio');

  // set the audio element's source to the blob URL
  audioElement.srcObject = media;
  // play the audio
  audioElement.play();
}

export async function blobPlayer(sound: Blob) {
  const audioElement = document.createElement('audio');
  // set the audio element's source to the blob URL
  audioElement.src = URL.createObjectURL(sound);

  // play the audio
  audioElement.play();
}
