import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

export interface RecordingResult {
  uri: string;
  durationMs: number;
  meteringData: number[];
}

let _recording: Audio.Recording | null = null;
const _meteringHistory: number[] = [];

export async function requestPermissions(): Promise<boolean> {
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
}

export async function startRecording(onMeter: (db: number) => void): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(
    { ...Audio.RecordingOptionsPresets.HIGH_QUALITY, isMeteringEnabled: true },
    (status) => {
      if (status.metering !== undefined) {
        _meteringHistory.push(status.metering);
        onMeter(status.metering);
      }
    },
    100,
  );

  _recording = recording;
  _meteringHistory.length = 0;
}

export async function stopRecording(): Promise<RecordingResult> {
  if (!_recording) throw new Error('No active recording');

  await _recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  const status = await _recording.getStatusAsync();
  const tempUri = _recording.getURI()!;

  const dir = `${FileSystem.documentDirectory}recordings/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = `${dir}${Date.now()}.m4a`;
  await FileSystem.moveAsync({ from: tempUri, to: dest });

  const result: RecordingResult = {
    uri: dest,
    durationMs: status.durationMillis ?? 0,
    meteringData: [..._meteringHistory],
  };

  _recording = null;
  _meteringHistory.length = 0;
  return result;
}

export async function deleteAudioFile(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}
