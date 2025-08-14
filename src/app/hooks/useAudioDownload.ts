import { useRef } from "react";

function useAudioDownload() {
  // Ref to store the MediaRecorder instance.
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // Ref to collect all recorded Blob chunks.
  const recordedChunksRef = useRef<Blob[]>([]);

  /**
   * Starts recording by combining the provided remote stream with
   * the microphone audio.
   * @param remoteStream - The remote MediaStream (e.g., from the audio element).
   */
  const startRecording = async (remoteStream: MediaStream) => {
    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("Error getting microphone stream:", err);
      // Fallback to an empty MediaStream if microphone access fails.
      micStream = new MediaStream();
    }

    // Create an AudioContext to merge the streams.
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    // Connect the remote audio stream.
    try {
      const remoteSource = audioContext.createMediaStreamSource(remoteStream);
      remoteSource.connect(destination);
    } catch (err) {
      console.error("Error connecting remote stream to the audio context:", err);
    }

    // Connect the microphone audio stream.
    try {
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);
    } catch (err) {
      console.error("Error connecting microphone stream to the audio context:", err);
    }

    const options = { mimeType: "audio/webm" };
    try {
      const mediaRecorder = new MediaRecorder(destination.stream, options);
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      // Start recording without a timeslice.
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
    } catch (err) {
      console.error("Error starting MediaRecorder with combined stream:", err);
    }
  };

  /**
   * Stops the MediaRecorder, if active.
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      // Request any final data before stopping.
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };


  return { startRecording, stopRecording };
}

export default useAudioDownload; 