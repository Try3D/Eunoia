import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  useColorScheme,
  Dimensions,
  ActivityIndicator,
  Text,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { ThemedText } from "@/components/ThemedText";
import {
  GestureHandlerRootView,
  ScrollView as GestureScrollView,
} from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const SQUARE_SIZE = Math.min(width, height) * 0.8;
const OFFSET = SQUARE_SIZE / 2;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_MARGIN = (SCREEN_WIDTH - CARD_WIDTH) / 2;

// Add animation setup after the constants
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

// Add color schemes
const colors = {
  light: {
    background: "#f5f5f5",
    card: "#ffffff",
    text: "#000000",
    textSecondary: "#666666",
    border: "#eeeeee",
  },
  dark: {
    background: "#121212",
    card: "#1e1e1e",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    border: "#333333",
  },
};

// Add categories with their colors for both themes
const categories = [
  {
    title: "Art & Crafts",
    description: "Paint, draw, and create",
    colorLight: "#FF6B6B",
    colorDark: "#8B3A3A",
  },
  {
    title: "Electronics",
    description: "Build simple circuits",
    colorLight: "#4ECDC4",
    colorDark: "#2A7F7F",
  },
  {
    title: "Arduino",
    description: "Learn programming & hardware",
    colorLight: "#45B7D1",
    colorDark: "#2A7F8B",
  },
  {
    title: "Robotics",
    description: "Make your first robot",
    colorLight: "#96CEB4",
    colorDark: "#5A8F7A",
  },
  {
    title: "3D Printing",
    description: "Design & print objects",
    colorLight: "#FFEEAD",
    colorDark: "#BFAE6A",
  },
  {
    title: "Wood Projects",
    description: "Simple woodworking",
    colorLight: "#D4A373",
    colorDark: "#8B6A4A",
  },
];

// Create makeStyles function
const makeStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 25,
      backgroundColor: theme.card,
      marginBottom: 16,
    },
    headerText: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
    },
    subHeaderText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 8,
    },
    gridCard: {
      width: "46%", // Make each card take up slightly less than half the width
      aspectRatio: 1,
      borderRadius: 16,
      padding: 16,
      justifyContent: "flex-end",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      margin: "2%", // Use percentage margin for consistent spacing
    },
    card: {
      width: CARD_WIDTH,
      backgroundColor: "#222",
      borderRadius: 16,
      padding: 24,
      marginHorizontal: 10,
      height: 600,
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
    analysisContainer: {
      flex: 1,
      backgroundColor: "black",
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 60,
    },
    resultContainer: {
      flex: 1,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    carouselContainer: {
      paddingHorizontal: CARD_MARGIN,
      alignItems: "center",
      paddingVertical: 20,
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
    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#FFF",
      marginBottom: 4,
    },
    cardDescription: {
      fontSize: 14,
      color: "#FFF",
      opacity: 0.9,
    },
    // ...copy all other card-related styles from index.tsx
  });

// Add loading state type
type LoadingState = {
  isLoading: boolean;
  category: string | null;
};

// Add this type definition after LoadingState
type ProjectState = {
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

// Update the main component
export default function TabTwoScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const styles = makeStyles(theme);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    category: null,
  });

  const [projectState, setProjectState] = useState<ProjectState>({
    status: "idle",
  });

  const handleCategoryPress = async (category: string) => {
    try {
      setLoading({ isLoading: true, category });
      setProjectState({ status: "loading" });

      const response = await fetch(
        `http://10.31.23.247:8000/generate/${category
          .toLowerCase()
          .replace(/ /g, "-")}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();
      setProjectState({
        status: "complete",
        project: result.message,
      });
    } catch (error) {
      console.error("Error:", error);
      setProjectState({
        status: "complete",
        error: "Error generating project",
      });
    } finally {
      setLoading({ isLoading: false, category: null });
    }
  };

  // Update the renderProject function
  const renderProject = () => {
    return (
      <View style={styles.analysisContainer}>
        {projectState.status === "loading" ? (
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
              {projectState.error ? (
                <View style={styles.card}>
                  <Text style={styles.errorText}>{projectState.error}</Text>
                </View>
              ) : (
                <>
                  {/* Overview Card */}
                  <View style={styles.card}>
                    <Text style={styles.projectTitle}>
                      {projectState.project?.title}
                    </Text>
                    <View style={styles.projectInfo}>
                      <Text style={styles.infoLabel}>Difficulty:</Text>
                      <Text style={styles.infoText}>
                        {projectState.project?.difficulty}
                      </Text>
                      <Text style={styles.infoLabel}>Time Required:</Text>
                      <Text style={styles.infoText}>
                        {projectState.project?.timeRequired}
                      </Text>
                      <Text style={styles.infoLabel}>Materials Needed:</Text>
                      {projectState.project?.materials.map(
                        (material, index) => (
                          <Text key={index} style={styles.materialItem}>
                            • {material}
                          </Text>
                        )
                      )}
                    </View>
                    <Text style={styles.pageIndicator}>
                      1/{(projectState.project?.steps.length || 0) + 2}
                    </Text>
                  </View>

                  {/* Step Cards */}
                  {projectState.project?.steps.map((step, index) => (
                    <View key={index} style={styles.card}>
                      <Text style={styles.stepNumber}>Step {index + 1}</Text>
                      <Text style={styles.stepText}>{step}</Text>
                      {projectState.project?.warnings &&
                        projectState.project.warnings[index + 1] && (
                          <View style={styles.warningContainer}>
                            <Text style={styles.warningText}>
                              ⚠️ {projectState.project.warnings[index + 1]}
                            </Text>
                          </View>
                        )}
                      <Text style={styles.pageIndicator}>
                        {index + 2}/
                        {(projectState.project?.steps.length || 0) + 2}
                      </Text>
                    </View>
                  ))}

                  {/* Tips Card */}
                  <View style={styles.card}>
                    <Text style={styles.tipsTitle}>Helpful Tips</Text>
                    {projectState.project?.tips.map((tip, index) => (
                      <Text key={index} style={styles.tipItem}>
                        • {tip}
                      </Text>
                    ))}
                    <Text style={styles.pageIndicator}>
                      {(projectState.project?.steps.length || 0) + 2}/
                      {(projectState.project?.steps.length || 0) + 2}
                    </Text>
                  </View>
                </>
              )}
            </GestureScrollView>
            <Pressable
              style={styles.backButtonTop}
              onPress={() => setProjectState({ status: "idle" })}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  // Update the main return statement
  return (
    <SafeAreaView style={styles.container}>
      {projectState.status !== "idle" ? (
        renderProject()
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <ThemedText style={styles.headerText}>Explore</ThemedText>
          </View>
          <View style={styles.grid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.title}
                style={[
                  styles.gridCard,
                  {
                    backgroundColor:
                      colorScheme === "dark"
                        ? category.colorDark
                        : category.colorLight,
                    opacity: loading.isLoading ? 0.5 : 1,
                  },
                ]}
                onPress={() => handleCategoryPress(category.title)}
                disabled={loading.isLoading}
              >
                {loading.isLoading && loading.category === category.title ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <ThemedText style={styles.cardTitle}>
                      {category.title}
                    </ThemedText>
                    <ThemedText style={styles.cardDescription}>
                      {category.description}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
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
