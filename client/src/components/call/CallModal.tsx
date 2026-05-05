import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  useWindowDimensions,
} from 'react-native';
import Constants from 'expo-constants';
import { CallTimer } from './CallTimer';
import { theme } from '../../constants/theme';
import { CallState } from '../../types';
import { muteLocalAudio, muteLocalVideo } from '../../services/call/agoraService';

interface CallModalProps {
  visible: boolean;
  callState: CallState;
  localUid: number;
  remoteUid: number | null;
  onEndCall: () => void;
}

export function CallModal({
  visible,
  callState,
  localUid,
  remoteUid,
  onEndCall,
}: CallModalProps) {
  const { width, height } = useWindowDimensions();
  const isExpoGo = Constants.appOwnership === 'expo';
  const agora = !isExpoGo ? (require('react-native-agora') as typeof import('react-native-agora')) : null;
  const RtcSurface = agora?.RtcSurfaceView as React.ComponentType<any> | undefined;
  const VideoSourceType = agora?.VideoSourceType;
  const canRenderAgoraVideo = !!RtcSurface && !!VideoSourceType;

  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0.8)).current;

  // Connecting pulse animation
  useEffect(() => {
    if (callState === 'connecting') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [callState]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    muteLocalAudio(next);
  };

  const toggleCam = () => {
    const next = !isCamOff;
    setIsCamOff(next);
    muteLocalVideo(next);
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* Remote video (large) */}
        {callState === 'connected' && remoteUid && canRenderAgoraVideo ? (
          <RtcSurface
            style={[styles.remoteVideo, { width, height }]}
            canvas={{ uid: remoteUid, sourceType: VideoSourceType.VideoSourceRemote }}
          />
        ) : (
          <View style={styles.connectingOverlay}>
            <Animated.View style={[styles.pulse, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.connectingIcon}>📡</Text>
            </Animated.View>
            <Text style={styles.connectingText}>
              {callState === 'connecting' ? 'Connecting...' : 'Call Ended'}
            </Text>
            {isExpoGo && (
              <Text style={styles.expoGoHint}>
                Video calling requires a development build.
              </Text>
            )}
          </View>
        )}

        {/* Local video PIP */}
        {callState === 'connected' && canRenderAgoraVideo && (
          <View
            style={[
              styles.pipContainer,
              {
                width: Math.max(92, Math.min(width * 0.28, 132)),
                height: Math.max(128, Math.min(height * 0.22, 180)),
              },
            ]}
          >
            <RtcSurface
              style={styles.pipVideo}
              canvas={{ uid: localUid, sourceType: VideoSourceType.VideoSourceCamera }}
            />
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <CallTimer isRunning={callState === 'connected'} />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.ctrlBtn, isMuted && styles.ctrlBtnActive]}
            onPress={toggleMute}
          >
            <Text style={styles.ctrlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.endBtn} onPress={onEndCall}>
            <Text style={styles.endIcon}>📵</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctrlBtn, isCamOff && styles.ctrlBtnActive]}
            onPress={toggleCam}
          >
            <Text style={styles.ctrlIcon}>{isCamOff ? '📷' : '📸'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    position: 'absolute',
  },
  connectingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  pulse: { marginBottom: theme.spacing.xl },
  connectingIcon: { fontSize: 64 },
  connectingText: {
    ...theme.typography.h2,
    color: theme.colors.textSecondary,
  },
  expoGoHint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  pipContainer: {
    position: 'absolute',
    top: 56,
    right: 14,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  pipVideo: { width: '100%', height: '100%' },
  header: {
    position: 'absolute',
    top: 48,
    left: 14,
  },
  controls: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  ctrlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${theme.colors.surface}cc`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnActive: {
    backgroundColor: `${theme.colors.primary}cc`,
  },
  ctrlIcon: { fontSize: 26 },
  endBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.danger,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  endIcon: { fontSize: 30 },
});
