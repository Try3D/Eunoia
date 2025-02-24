import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState, useEffect } from "react";
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";
import { Animated, Easing } from "react-native";

import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Pressable,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const SQUARE_SIZE = Math.min(width, height) * 0.8;
const OFFSET = SQUARE_SIZE / 2;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_MARGIN = (SCREEN_WIDTH - CARD_WIDTH) / 2;

type AnalysisState = {
  status: "idle" | "loading" | "complete";
  project?: {
    title: string;
    materials: string[];
    difficulty: string;
    timeRequired: string;
    steps: string[];
    tips: string[];
    warnings: { [key: number]: string };
  };
  error?: string;
};

const spinValue = new Animated.Value(0);

Animated.loop(
  Animated.timing(spinValue, {
    toValue: 1,
    duration: 1000,
    easing: Easing.linear,
    useNativeDriver: true,
  })
).start();

const spin = spinValue.interpolate({
  inputRange: [0, 1],
  outputRange: ["0deg", "360deg"],
});

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: "idle",
  });

  useEffect(() => {
    requestPermission();
  }, []);

  if (!permission || !permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to camera</Text>
      </View>
    );
  }

  const takePicture = async () => {
    try {
      const photo = await ref.current?.takePictureAsync();
      setUri(photo?.uri);

      if (photo?.uri) {
        setAnalysisState({ status: "loading" });

        const formData = new FormData();
        formData.append("file", {
          uri: photo.uri,
          type: "image/jpeg",
          name: "photo.jpg",
        } as any);

        const response = await fetch("http://10.31.23.247:8000/analyze", {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        });

        const result = await response.json();
        setAnalysisState({
          status: "complete",
          project: result.message,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setAnalysisState({
        status: "complete",
        error: "Error analyzing image",
      });
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const renderPicture = () => {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri }} contentFit="contain" style={styles.preview} />
        <Pressable style={styles.retakeButton} onPress={() => setUri(null)}>
          <Text style={styles.retakeText}>Retake</Text>
        </Pressable>
      </View>
    );
  };

  const renderCamera = () => {
    return (
      <CameraView style={styles.camera} ref={ref} facing={facing}>
        <View style={styles.buttonContainer}>
          <View style={styles.buttonPlaceholder} />
          <Pressable style={styles.button} onPress={takePicture}>
            <View style={styles.shutterBtn}>
              <View style={styles.shutterBtnInner} />
            </View>
          </Pressable>
          <Pressable style={styles.button} onPress={toggleFacing}>
            <Ionicons name="camera-reverse" size={30} color="white" />
          </Pressable>
        </View>
      </CameraView>
    );
  };

  const renderAnalysis = () => {
    return (
      <View style={styles.analysisContainer}>
        {analysisState.status === "loading" ? (
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[styles.loaderRing, { transform: [{ rotate: spin }] }]}
            >
              <Ionicons name="hammer" size={32} color="white" />
            </Animated.View>
            <Text style={styles.loadingText}>
              Searching for the perfect project...
            </Text>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <GestureScrollView
              horizontal
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + 20}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
            >
              {analysisState.error ? (
                <View style={styles.card}>
                  <Text style={styles.errorText}>{analysisState.error}</Text>
                </View>
              ) : (
                <>
                  {/* Overview Card */}
                  <View style={styles.card}>
                    <Text style={styles.projectTitle}>
                      {analysisState.project?.title}
                    </Text>
                    <View style={styles.projectInfo}>
                      <Text style={styles.infoLabel}>Difficulty:</Text>
                      <Text style={styles.infoText}>
                        {analysisState.project?.difficulty}
                      </Text>
                      <Text style={styles.infoLabel}>Time Required:</Text>
                      <Text style={styles.infoText}>
                        {analysisState.project?.timeRequired}
                      </Text>
                      <Text style={styles.infoLabel}>Materials Needed:</Text>
                      {analysisState.project?.materials.map(
                        (material, index) => (
                          <Text key={index} style={styles.materialItem}>
                            • {material}
                          </Text>
                        )
                      )}
                    </View>
                    <Text style={styles.pageIndicator}>
                      1/{(analysisState.project?.steps.length || 0) + 2}
                    </Text>
                  </View>

                  {/* Step Cards */}
                  {analysisState.project?.steps.map((step, index) => (
                    <View key={index} style={styles.card}>
                      <Text style={styles.stepNumber}>Step {index + 1}</Text>
                      <Text style={styles.stepText}>{step}</Text>
                      {analysisState.project?.warnings &&
                        analysisState.project.warnings[index + 1] && (
                          <View style={styles.warningContainer}>
                            <Text style={styles.warningText}>
                              ⚠️ {analysisState.project.warnings[index + 1]}
                            </Text>
                          </View>
                        )}
                      <Text style={styles.pageIndicator}>
                        {index + 2}/
                        {(analysisState.project?.steps.length || 0) + 2}
                      </Text>
                    </View>
                  ))}

                  {/* Tips Card */}
                  <View style={styles.card}>
                    <Text style={styles.tipsTitle}>Helpful Tips</Text>
                    {analysisState.project?.tips.map((tip, index) => (
                      <Text key={index} style={styles.tipItem}>
                        • {tip}
                      </Text>
                    ))}
                    <Text style={styles.pageIndicator}>
                      {(analysisState.project?.steps.length || 0) + 2}/
                      {(analysisState.project?.steps.length || 0) + 2}
                    </Text>
                  </View>
                </>
              )}
            </GestureScrollView>
            <Pressable
              style={styles.backButtonTop}
              onPress={() => {
                setUri(null);
                setAnalysisState({ status: "idle" });
              }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
          </View>
        )}
      </View>
    );
  };
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {analysisState.status !== "idle"
          ? renderAnalysis()
          : uri
          ? renderPicture()
          : renderCamera()}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "transparent",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    alignItems: "center",
  },
  buttonPlaceholder: {
    width: 30, // Same width as the camera-reverse icon
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: "white",
  },
  squareFrame: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    transform: [{ translateX: -OFFSET }, { translateY: -OFFSET }],
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "transparent",
  },
  previewContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  preview: {
    width: "100%",
    flex: 1,
  },
  retakeButton: {
    position: "absolute",
    bottom: 40,
    padding: 20,
  },
  retakeText: {
    color: "white",
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
    marginTop: 20,
  },
  loaderRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#444",
    borderTopColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  analysisImage: {
    width: "100%",
    height: 300,
    marginBottom: 20,
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
    marginVertical: 20,
  },
  analysisText: {
    color: "white",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "left",
    padding: 16,
  },
  projectTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  listItem: {
    color: "white",
    fontSize: 16,
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 8,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
    padding: 16,
  },
  stepNumber: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  stepText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
  },
  pageIndicator: {
    color: "#666",
    fontSize: 14,
    position: "absolute",
    bottom: 16,
  },
  projectInfo: {
    width: "100%",
    padding: 10,
  },
  infoLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  infoText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
  materialItem: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 16,
    marginBottom: 4,
  },
  tipsTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  tipItem: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 8,
    textAlign: "left",
  },
  analysisContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60, // Add padding for notification bar
  },
  resultContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center", // Center content vertically
    alignItems: "center",
  },
  carouselContainer: {
    paddingHorizontal: CARD_MARGIN,
    alignItems: "center", // Center cards horizontally
    paddingVertical: 20, // Add vertical padding
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#222",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 10,
    height: 600, // Increased height to 600
    justifyContent: "flex-start",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  warningContainer: {
    backgroundColor: "#ff4444",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 24,
    width: "100%",
  },
  warningText: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  backButtonTop: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
