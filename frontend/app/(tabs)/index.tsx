import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState, useEffect } from "react";
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";
import { Animated, Easing, Alert } from "react-native";

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
import { useProjects } from "../../context/ProjectContext";

const { width, height } = Dimensions.get("window");
const SQUARE_SIZE = Math.min(width, height) * 0.8;
const OFFSET = SQUARE_SIZE / 2;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_MARGIN = (SCREEN_WIDTH - CARD_WIDTH) / 2;

type AnalysisState = {
  status: "idle" | "loading" | "complete" | "selecting";
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
  }),
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
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepClarifications, setStepClarifications] = useState<{
    [key: number]: any;
  }>({});
  const [projectSuggestions, setProjectSuggestions] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingClarification, setLoadingClarification] = useState<
    number | null
  >(null);
  const { addProject, updateProjectProgress } = useProjects();

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

        const response = await fetch("http://10.123.179.55:8000/analyze", {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        });

        const result = await response.json();
        console.log("API Response:", result); // Debug log

        setProjectSuggestions(result.message); // Set the entire message object
        setAnalysisState({ status: "selecting" });
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

  const handleStepCompletion = async (stepNumber: number) => {
    try {
      // Update local state
      setCompletedSteps((prev) => new Set(prev.add(stepNumber)));

      // Update shared context
      if (analysisState.project?.title) {
        updateProjectProgress(analysisState.project.title, stepNumber);
      }

      Alert.alert("Success", "Step marked as complete!");
    } catch (error) {
      Alert.alert("Error", "Failed to mark step as complete");
    }
  };

  const handleStepClarification = async (stepNumber: number) => {
    try {
      setLoadingClarification(stepNumber);
      const response = await fetch("http://10.123.179.55:8000/clarify-step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectTitle: analysisState.project?.title,
          stepNumber: stepNumber,
          stepContent: analysisState.project?.steps[stepNumber - 1],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStepClarifications((prev) => ({
          ...prev,
          [stepNumber]: data.clarification,
        }));
      } else {
        Alert.alert("Error", "Failed to get step clarification");
      }
    } catch (error) {
      console.error("Error getting clarification:", error);
      Alert.alert("Error", "Failed to get step clarification");
    } finally {
      setLoadingClarification(null);
    }
  };

  const handleProjectSelection = (project) => {
    // Add project to shared context
    addProject({
      title: project.title,
      totalSteps: project.steps.length,
      completedSteps: [],
    });

    setSelectedProject(project);
    setAnalysisState({
      status: "complete",
      project: {
        ...project,
        title: project.title,
        materials: project.materials,
        difficulty: project.difficulty,
        timeRequired: project.timeRequired,
        steps: project.steps,
        tips: project.tips,
        warnings: project.warnings,
      },
    });
  };

  const handleBackButton = () => {
    if (analysisState.status === "complete") {
      // Just go back to selection view while preserving suggestions
      setAnalysisState({ status: "selecting" });
      setSelectedProject(null);
      setCompletedSteps(new Set()); // Reset completed steps
      setStepClarifications({}); // Reset clarifications
    } else if (analysisState.status === "selecting") {
      // Only when going back from selection to camera
      setUri(null);
      setAnalysisState({ status: "idle" });
      setProjectSuggestions([]);
      setSelectedProject(null);
      setCompletedSteps(new Set());
      setStepClarifications({});
    }
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
    if (analysisState.status === "selecting") {
      return (
        <View style={styles.analysisContainer}>
          <Text style={styles.headerText}>Choose a Project</Text>
          <ScrollView>
            {projectSuggestions?.similar_projects?.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Existing Projects</Text>
                {projectSuggestions.similar_projects.map((project, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.projectSuggestionCard,
                      styles.similarProjectCard,
                    ]}
                    onPress={() => handleProjectSelection(project)}
                  >
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <Text style={styles.materialsText}>
                      Materials: {project.materials.join(", ")}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}

            {projectSuggestions?.ai_projects?.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>New Projects</Text>
                {projectSuggestions.ai_projects.map((project, index) => (
                  <Pressable
                    key={index}
                    style={[styles.projectSuggestionCard, styles.aiProjectCard]}
                    onPress={() => handleProjectSelection(project)}
                  >
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <Text style={styles.materialsText}>
                      Materials: {project.materials.join(", ")}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      );
    }

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
                        ),
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

                      {/* Scrollable container for clarification content */}
                      <View style={styles.cardContentContainer}>
                        <ScrollView
                          style={styles.cardScrollContent}
                          showsVerticalScrollIndicator={true}
                        >
                          {/* Show clarification if available */}
                          {stepClarifications[index + 1] && (
                            <View style={styles.clarificationContainer}>
                              <Text style={styles.clarificationTitle}>
                                Detailed Instructions:
                              </Text>
                              {stepClarifications[index + 1].detailed_steps.map(
                                (substep: string, i: number) => (
                                  <Text key={i} style={styles.substepText}>
                                    • {substep}
                                  </Text>
                                ),
                              )}

                              <Text style={styles.clarificationTitle}>
                                Helpful Tips:
                              </Text>
                              {stepClarifications[index + 1].tips.map(
                                (tip: string, i: number) => (
                                  <Text key={i} style={styles.tipText}>
                                    • {tip}
                                  </Text>
                                ),
                              )}

                              <Text style={styles.clarificationTitle}>
                                Watch Out For:
                              </Text>
                              {stepClarifications[
                                index + 1
                              ].common_mistakes.map(
                                (mistake: string, i: number) => (
                                  <Text key={i} style={styles.mistakeText}>
                                    • {mistake}
                                  </Text>
                                ),
                              )}
                            </View>
                          )}

                          {analysisState.project?.warnings &&
                            analysisState.project.warnings[index + 1] && (
                              <View style={styles.warningContainer}>
                                <Text style={styles.warningText}>
                                  ⚠️ {analysisState.project.warnings[index + 1]}
                                </Text>
                              </View>
                            )}
                        </ScrollView>
                      </View>

                      {/* Button container fixed at the bottom */}
                      <View style={styles.cardButtonContainer}>
                        {/* Need Help button */}
                        <Pressable
                          style={[
                            styles.helpButton,
                            loadingClarification === index + 1 &&
                              styles.helpButtonLoading,
                          ]}
                          onPress={() => handleStepClarification(index + 1)}
                          disabled={loadingClarification === index + 1}
                        >
                          {loadingClarification === index + 1 ? (
                            <View style={styles.helpButtonLoadingContent}>
                              <Animated.View
                                style={[
                                  styles.smallLoaderRing,
                                  { transform: [{ rotate: spin }] },
                                ]}
                              >
                                <Ionicons
                                  name="hammer"
                                  size={16}
                                  color="white"
                                />
                              </Animated.View>
                              <Text style={styles.helpButtonText}>
                                Generating...
                              </Text>
                            </View>
                          ) : (
                            <Text style={styles.helpButtonText}>
                              Need Help?
                            </Text>
                          )}
                        </Pressable>

                        <Pressable
                          style={[
                            styles.completeButton,
                            completedSteps.has(index + 1) &&
                              styles.completeButtonDisabled,
                          ]}
                          onPress={() => handleStepCompletion(index + 1)}
                          disabled={completedSteps.has(index + 1)}
                        >
                          <Text style={styles.completeButtonText}>
                            {completedSteps.has(index + 1)
                              ? "Completed!"
                              : "Mark Complete"}
                          </Text>
                        </Pressable>
                      </View>

                      <Text style={styles.pageIndicator}>
                        {index + 2}/
                        {(analysisState.project?.steps.length || 0) + 2}
                      </Text>
                    </View>
                  ))}

                  {/* Tips Card */}
                  {analysisState.project?.tips?.length > 0 && (
                    <View style={styles.card}>
                      <Text style={styles.tipsTitle}>Helpful Tips</Text>
                      <ScrollView
                        style={styles.cardScrollContent}
                        showsVerticalScrollIndicator={true}
                      >
                        {analysisState.project?.tips.map((tip, index) => (
                          <Text key={index} style={styles.tipItem}>
                            • {tip}
                          </Text>
                        ))}
                      </ScrollView>
                      <Text style={styles.pageIndicator}>
                        {(analysisState.project?.steps.length || 0) + 2}/
                        {(analysisState.project?.steps.length || 0) + 2}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </GestureScrollView>
            <Pressable style={styles.backButtonTop} onPress={handleBackButton}>
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
    textAlign: "left",
    padding: 16,
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
    marginBottom: 16,
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
    height: 600, // Fixed height for cards
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
    position: "relative", // To position elements absolutely within the card
  },
  // New styles for scrollable content
  cardContentContainer: {
    flex: 1,
    width: "100%",
    marginVertical: 10,
    maxHeight: 300, // Allocate fixed height for scrollable content
  },
  cardScrollContent: {
    width: "100%",
    flexGrow: 0,
  },
  cardButtonContainer: {
    width: "100%",
    marginTop: 8,
    marginBottom: 40,
  },
  warningContainer: {
    backgroundColor: "#ff4444",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
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
    top: 0,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  completeButtonDisabled: {
    backgroundColor: "#666",
    opacity: 0.7,
  },
  completeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  helpButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  helpButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  clarificationContainer: {
    backgroundColor: "#2A2A2A",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
  },
  clarificationTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  substepText: {
    color: "#FFF",
    fontSize: 14,
    marginBottom: 6,
    paddingLeft: 8,
  },
  tipText: {
    color: "#4CAF50",
    fontSize: 14,
    marginBottom: 6,
    paddingLeft: 8,
  },
  mistakeText: {
    color: "#FF6B6B",
    fontSize: 14,
    marginBottom: 6,
    paddingLeft: 8,
  },
  projectSuggestionCard: {
    backgroundColor: "#2A2A2A",
    padding: 20,
    margin: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
  },
  similarityScore: {
    color: "#4CAF50",
    fontSize: 16,
    marginTop: 8,
  },
  materialsText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 8,
  },
  sectionHeader: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    padding: 16,
    paddingBottom: 8,
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 16,
  },
  similarProjectCard: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  aiProjectCard: {
    borderColor: "#007AFF",
    borderWidth: 2,
  },
  sourceText: {
    color: "#888",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  helpButtonLoading: {
    opacity: 0.8,
  },

  helpButtonLoadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  smallLoaderRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#444",
    borderTopColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
});

