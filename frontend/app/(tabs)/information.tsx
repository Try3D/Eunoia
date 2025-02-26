import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Button,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";

export default function InformationScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [fact, setFact] = useState<string | null>(null);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

  // Poll the backend for a quick fact every 10 seconds
  useEffect(() => {
    if (!permission?.granted) return;

    const interval = setInterval(async () => {
      if (cameraRef) {
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
          const response = await fetch(
            "http://10.57.140.132:8000/information",
            {
              method: "POST",
              body: formData,
              // Force connection closure after each request
              headers: {
                Connection: "close",
              },
            },
          );

          console.log("Response received, status:", response.status);

          const result = await response.json();
          console.log("Response parsed, status:", result.status);

          if (result.status === "success") {
            setFact(result.fact);
            console.log("Fact received:", result.fact);
          } else {
            console.log("Error response from server:", result);
          }
        } catch (error: any) {
          console.error("Error in image capture/analysis cycle:", error);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [cameraRef, permission]);

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
          <Text style={styles.playingText}>📸 Analyzing...</Text>
        </View>
        <Text style={styles.factText}>{fact || "Analyzing what I see..."}</Text>
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
});
