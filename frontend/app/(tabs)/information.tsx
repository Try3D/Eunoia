import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Button,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  Switch,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Audio } from "expo-av";

export default function InformationScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [fact, setFact] = useState<string | null>(null);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const audioRef = useRef<Audio.Sound | null>(null);
  const appState = useRef(AppState.currentState);

  // Function to capture image and send to server
  const captureAndAnalyze = async () => {
    if (!cameraRef || isAnalyzing || isPlayingAudio) return;

    setIsAnalyzing(true);
    setHasAnalyzed(false);

    try {
      const photo = await cameraRef.takePictureAsync({
        quality: 0.5,
        base64: true,
      });

      console.log("Photo taken, sending to backend");

      const formData = new FormData();
      formData.append("file", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "photo.jpg",
      } as any);

      console.log("Sending request to server...");
      const response = await fetch("http://10.123.179.55:8000/information", {
        method: "POST",
        body: formData,
        headers: {
          Connection: "close",
        },
      });

      console.log("Response received, status:", response.status);

      const result = await response.json();
      console.log("Response parsed, status:", result.status);

      if (result.status === "success") {
        setFact(result.fact);
        console.log("Fact received:", result.fact);

        // Play audio if available
        if (result.audio_file) {
          setIsPlayingAudio(true);
          await playAudio(`http://10.123.179.55:8000/${result.audio_file}`);
        } else if (continuousMode) {
          // If no audio but in continuous mode, schedule next capture
          setTimeout(() => {
            captureAndAnalyze();
          }, 3000);
        }
      } else {
        console.log("Error response from server:", result);
        if (continuousMode) {
          // If error but in continuous mode, schedule next capture
          setTimeout(() => {
            captureAndAnalyze();
          }, 5000);
        }
      }
    } catch (error: any) {
      console.error("Error in image capture/analysis:", error);
      setFact("Error analyzing image. Please try again.");
      if (continuousMode) {
        // If error but in continuous mode, schedule next capture
        setTimeout(() => {
          captureAndAnalyze();
        }, 5000);
      }
    } finally {
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    }
  };

  // Function to play audio
  const playAudio = async (audioUri: string) => {
    try {
      // Unload previous sound if it exists
      if (audioRef.current) {
        await audioRef.current.unloadAsync();
      }

      // Load and play the new audio
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      audioRef.current = sound;
      setSound(sound);

      console.log("Playing audio...");
      await sound.playAsync();

      // Set up completion listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          console.log("Audio playback finished");
          setIsPlayingAudio(false);

          // If in continuous mode, start another analysis after audio completes
          if (continuousMode) {
            console.log("Continuous mode enabled, starting next analysis");
            setTimeout(() => {
              captureAndAnalyze();
            }, 2000); // Short delay before next capture
          }
        }
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlayingAudio(false);

      // If in continuous mode and audio fails, try next capture
      if (continuousMode) {
        setTimeout(() => {
          captureAndAnalyze();
        }, 3000);
      }
    }
  };

  // Function to stop audio playback
  const stopAudio = async () => {
    if (audioRef.current) {
      try {
        console.log("Stopping audio playback");
        await audioRef.current.stopAsync();
        setIsPlayingAudio(false);
      } catch (error) {
        console.error("Error stopping audio:", error);
      }
    }
  };

  // Toggle continuous mode
  const toggleContinuousMode = () => {
    const newMode = !continuousMode;
    setContinuousMode(newMode);

    // If turning on continuous mode and not currently analyzing or playing,
    // start a new analysis
    if (newMode && !isAnalyzing && !isPlayingAudio) {
      captureAndAnalyze();
    }
  };

  // Handle app state changes (background, inactive, active)
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/active/) &&
      (nextAppState === "background" || nextAppState === "inactive")
    ) {
      console.log("App has gone to background or inactive, stopping audio");
      stopAudio();
    }

    appState.current = nextAppState;
  };

  // Start the capture once when the camera is ready
  useEffect(() => {
    if (
      permission?.granted &&
      cameraRef &&
      !isAnalyzing &&
      !isPlayingAudio &&
      !hasAnalyzed
    ) {
      captureAndAnalyze();
    }
  }, [cameraRef, permission]);

  // Set up app state change listener for detecting tab switches
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
      // Clean up audio
      if (audioRef.current) {
        audioRef.current.unloadAsync();
      }
    };
  }, []);

  // Function to manually trigger capture when needed
  const handleManualCapture = () => {
    captureAndAnalyze();
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={(ref) => setCameraRef(ref)}
        />
      </View>
      <ScrollView style={styles.factContainer}>
        <View style={styles.factHeader}>
          <Text style={styles.factTitle}>Quick Fact:</Text>
          <Text style={styles.playingText}>
            {isAnalyzing
              ? "📸 Analyzing..."
              : isPlayingAudio
                ? "🔊 Playing audio..."
                : hasAnalyzed
                  ? "✅ Complete"
                  : "⏳ Waiting..."}
          </Text>
        </View>
        <Text style={styles.factText}>
          {fact || "Waiting to analyze what I see..."}
        </Text>

        <View style={styles.controlsContainer}>
          <View style={styles.continuousModeContainer}>
            <Text style={styles.continuousModeText}>Continuous Learning</Text>
            <Switch
              value={continuousMode}
              onValueChange={toggleContinuousMode}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={continuousMode ? "#4a90e2" : "#f4f3f4"}
            />
          </View>

          {hasAnalyzed && !isPlayingAudio && !continuousMode && (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleManualCapture}
            >
              <Text style={styles.captureButtonText}>Analyze Again</Text>
            </TouchableOpacity>
          )}

          {isPlayingAudio && (
            <TouchableOpacity style={styles.stopButton} onPress={stopAudio}>
              <Text style={styles.captureButtonText}>Stop Audio</Text>
            </TouchableOpacity>
          )}

          {continuousMode && (
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={() => setContinuousMode(false)}
            >
              <Text style={styles.captureButtonText}>Pause Learning</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  message: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
  },
  cameraContainer: {
    flex: 2,
  },
  camera: {
    flex: 1,
  },
  factContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  factHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  factTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  factText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 24,
  },
  playingText: {
    color: "#666",
    fontSize: 16,
  },
  controlsContainer: {
    marginTop: 20,
  },
  continuousModeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 8,
  },
  continuousModeText: {
    color: "#fff",
    fontSize: 16,
  },
  captureButton: {
    backgroundColor: "#4a90e2",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  stopButton: {
    backgroundColor: "#e24a4a",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  pauseButton: {
    backgroundColor: "#e2a14a",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  captureButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
