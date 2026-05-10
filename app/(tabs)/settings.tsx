import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRecordingStore } from '../../src/stores/useRecordingStore';
import { clearAllData } from '../../src/services/database';
import { downloadModel, isModelDownloaded } from '../../src/services/whisperManager';
import { downloadLlamaModel, isLlamaModelDownloaded } from '../../src/services/llamaManager';

const API_KEY_STORE = 'anthropic_api_key';

type ModelStatus = 'checking' | 'none' | 'downloading' | 'ready';

export default function SettingsScreen() {
  const { aiMode, apiKey, setAiMode, setApiKey, setRecordings } = useRecordingStore();
  const [keyDraft, setKeyDraft] = useState(apiKey);
  const [keySaved, setKeySaved] = useState(false);
  const [whisperStatus, setWhisperStatus] = useState<ModelStatus>('checking');
  const [downloadPct, setDownloadPct] = useState(0);
  const downloadingRef = useRef(false);

  const [llamaStatus, setLlamaStatus] = useState<ModelStatus>('checking');
  const [llamaDownloadPct, setLlamaDownloadPct] = useState(0);
  const llamaDownloadingRef = useRef(false);

  useEffect(() => {
    isModelDownloaded().then((ready) => setWhisperStatus(ready ? 'ready' : 'none'));
    isLlamaModelDownloaded().then((ready) => setLlamaStatus(ready ? 'ready' : 'none'));
  }, []);

  const handleDownloadWhisper = async () => {
    if (downloadingRef.current) return;
    downloadingRef.current = true;
    setWhisperStatus('downloading');
    setDownloadPct(0);
    try {
      await downloadModel((pct) => setDownloadPct(pct));
      setWhisperStatus('ready');
    } catch {
      setWhisperStatus('none');
      Alert.alert('Download failed', 'Check your internet connection and try again.');
    } finally {
      downloadingRef.current = false;
    }
  };

  const handleDownloadLlama = async () => {
    if (llamaDownloadingRef.current) return;
    llamaDownloadingRef.current = true;
    setLlamaStatus('downloading');
    setLlamaDownloadPct(0);
    try {
      await downloadLlamaModel((pct) => setLlamaDownloadPct(pct));
      setLlamaStatus('ready');
    } catch {
      setLlamaStatus('none');
      Alert.alert('Download failed', 'Check your internet connection and try again.');
    } finally {
      llamaDownloadingRef.current = false;
    }
  };

  const handleSaveKey = async () => {
    await SecureStore.setItemAsync(API_KEY_STORE, keyDraft);
    setApiKey(keyDraft);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleClearData = () => {
    Alert.alert('Clear all data?', 'All recordings and notes will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete all',
        style: 'destructive',
        onPress: async () => {
          await clearAllData();
          setRecordings([]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.section}>AI Mode</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Cloud Mode</Text>
              <Text style={styles.rowSub}>
                {aiMode === 'cloud'
                  ? 'Claude API — richer summaries & analysis'
                  : 'On-device AI — private & offline'}
              </Text>
            </View>
            <Switch
              value={aiMode === 'cloud'}
              onValueChange={(v) => setAiMode(v ? 'cloud' : 'local')}
              trackColor={{ true: '#6366f1', false: '#e2e8f0' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {aiMode === 'cloud' && (
          <>
            <Text style={styles.section}>Anthropic API Key</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                value={keyDraft}
                onChangeText={setKeyDraft}
                placeholder="sk-ant-..."
                placeholderTextColor="#cbd5e1"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={[styles.saveBtn, keySaved && styles.saveBtnDone]}
                onPress={handleSaveKey}
              >
                <Text style={styles.saveBtnText}>{keySaved ? 'Saved ✓' : 'Save key'}</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>
              Your key is stored securely on device and never sent anywhere other than Anthropic.
            </Text>
          </>
        )}

        <Text style={styles.section}>Models</Text>
        <View style={styles.card}>
          <View style={styles.modelRow}>
            <View style={styles.modelInfo}>
              <Text style={styles.rowTitle}>Whisper (Transcription)</Text>
              <Text style={styles.rowSub}>whisper-base.en · ~74 MB</Text>
              {whisperStatus === 'downloading' && (
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${downloadPct}%` }]} />
                </View>
              )}
            </View>
            {whisperStatus === 'checking' && (
              <Text style={styles.notReady}>···</Text>
            )}
            {whisperStatus === 'none' && (
              <Pressable style={styles.downloadBtn} onPress={handleDownloadWhisper}>
                <Text style={styles.downloadBtnText}>Download</Text>
              </Pressable>
            )}
            {whisperStatus === 'downloading' && (
              <Text style={styles.progressPct}>{downloadPct}%</Text>
            )}
            {whisperStatus === 'ready' && (
              <Text style={styles.ready}>Ready</Text>
            )}
          </View>
          <View style={[styles.modelRow, styles.divider]}>
            <View style={styles.modelInfo}>
              <Text style={styles.rowTitle}>Phi-3 Mini (Notes)</Text>
              <Text style={styles.rowSub}>Q4_K_M GGUF · ~2.2 GB</Text>
              {llamaStatus === 'downloading' && (
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${llamaDownloadPct}%` }]} />
                </View>
              )}
            </View>
            {llamaStatus === 'checking' && (
              <Text style={styles.notReady}>···</Text>
            )}
            {llamaStatus === 'none' && (
              <Pressable style={styles.downloadBtn} onPress={handleDownloadLlama}>
                <Text style={styles.downloadBtnText}>Download</Text>
              </Pressable>
            )}
            {llamaStatus === 'downloading' && (
              <Text style={styles.progressPct}>{llamaDownloadPct}%</Text>
            )}
            {llamaStatus === 'ready' && (
              <Text style={styles.ready}>Ready</Text>
            )}
          </View>
        </View>
        <Text style={styles.hint}>Whisper runs fully on-device — audio never leaves your phone.</Text>

        <Text style={styles.section}>Data</Text>
        <View style={styles.card}>
          <Pressable style={styles.dangerRow} onPress={handleClearData}>
            <Text style={styles.dangerText}>Clear all recordings & notes</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 48 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, color: '#0f172a', fontWeight: '500' },
  rowSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  modelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  modelInfo: { flex: 1 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#f1f5f9' },
  notReady: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  ready: { fontSize: 12, color: '#22c55e', fontWeight: '700' },
  downloadBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  downloadBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  progressPct: { fontSize: 13, color: '#6366f1', fontWeight: '600', minWidth: 36, textAlign: 'right' },
  progressTrack: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  hint: { fontSize: 13, color: '#94a3b8', marginTop: 8, marginLeft: 4 },
  input: {
    fontSize: 15,
    color: '#0f172a',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  saveBtn: {
    margin: 12,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  saveBtnDone: { backgroundColor: '#22c55e' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  dangerRow: { padding: 16, alignItems: 'center' },
  dangerText: { fontSize: 16, color: '#ef4444', fontWeight: '500' },
});
