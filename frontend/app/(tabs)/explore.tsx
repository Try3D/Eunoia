import { StyleSheet, ScrollView, TouchableOpacity, View, useColorScheme, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

const colors = {
  light: {
    background: "#f5f5f5",
    card: "#ffffff",
    text: "#000000",
    textSecondary: "#666666",
  },
  dark: {
    background: "#121212",
    card: "#1e1e1e",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
  },
};

// Extended categories with tutorial content
const categories = [
  {
    title: "Art & Crafts",
    description: "Paint, draw, and create",
    colorLight: "#FF6B6B",
    colorDark: "#8B3A3A",
    tutorial: {
      title: "Watercolor Painting for Beginners",
      introduction: "Watercolor is a beautiful medium that creates luminous, transparent effects. This tutorial will help you get started with basic techniques.",
      materials: [
        "Watercolor paper (140lb/300gsm)",
        "Watercolor paints (student grade is fine)",
        "Watercolor brushes (sizes 2, 6, and 10)",
        "Water container",
        "Paper towels",
        "Masking tape"
      ],
      steps: [
        {
          title: "Prepare Your Paper",
          instructions: "Tape your watercolor paper to a board using masking tape. This prevents the paper from buckling when wet."
        },
        {
          title: "Mix Your Colors",
          instructions: "Start with just 3 colors. Mix them on a palette, adding water to create different tints."
        },
        {
          title: "Basic Wash Technique",
          instructions: "Wet your paper first, then apply color for a soft, diffused effect. For more control, apply color to dry paper."
        },
        {
          title: "Layer Colors",
          instructions: "Allow each layer to dry before adding another. This creates depth and dimension."
        },
        {
          title: "Experiment",
          instructions: "Try adding salt to wet paint, using rubbing alcohol, or lifting color with a dry brush for texture."
        }
      ],
      tips: "Remember watercolor dries lighter than it appears when wet. Be patient and build up colors gradually."
    }
  },
  {
    title: "Electronics",
    description: "Build simple circuits",
    colorLight: "#4ECDC4",
    colorDark: "#2A7F7F",
    tutorial: {
      title: "Simple LED Circuit",
      introduction: "Electronics doesn't have to be complicated. In this beginner tutorial, you'll create a basic LED circuit that lights up with the press of a button.",
      materials: [
        "1 LED light (any color)",
        "1 resistor (220 ohm)",
        "1 pushbutton switch",
        "1 battery (3V coin cell or 9V with battery clip)",
        "Jumper wires or copper tape",
        "Breadboard (optional but recommended)"
      ],
      steps: [
        {
          title: "Understand Your Components",
          instructions: "The LED has two legs: the longer one is positive (anode), shorter is negative (cathode). The resistor protects the LED from too much current."
        },
        {
          title: "Connect the Battery",
          instructions: "Place your battery in the holder or clip. If using a breadboard, connect the positive and negative terminals to the power rails."
        },
        {
          title: "Add the Resistor",
          instructions: "Connect one end of the resistor to the positive terminal of the battery."
        },
        {
          title: "Add the Button",
          instructions: "Connect the other end of the resistor to one terminal of the button. Connect the other button terminal to the LED's anode (longer leg)."
        },
        {
          title: "Complete the Circuit",
          instructions: "Connect the LED's cathode (shorter leg) to the negative terminal of the battery."
        }
      ],
      tips: "If the LED doesn't light up, check your connections and make sure the LED is oriented correctly. LEDs only work when current flows in one direction."
    }
  },
  {
    title: "Arduino",
    description: "Learn programming & hardware",
    colorLight: "#45B7D1",
    colorDark: "#2A7F8B",
    tutorial: {
      title: "Blink an LED with Arduino",
      introduction: "Arduino is a popular platform for beginners to learn coding and electronics. This tutorial will guide you through making an LED blink - the 'Hello World' of Arduino programming.",
      materials: [
        "Arduino Uno or compatible board",
        "USB cable for your Arduino",
        "1 LED (any color)",
        "1 resistor (220 ohm)",
        "Breadboard",
        "Jumper wires"
      ],
      steps: [
        {
          title: "Set Up Your Arduino IDE",
          instructions: "Download and install the Arduino IDE from arduino.cc. Launch the software and select your board model from Tools > Board."
        },
        {
          title: "Build the Circuit",
          instructions: "Connect the resistor to digital pin 13 on the Arduino. Connect the other end of the resistor to the anode (longer leg) of the LED. Connect the cathode (shorter leg) to GND."
        },
        {
          title: "Write the Code",
          instructions: "Copy this code: void setup() { pinMode(13, OUTPUT); } void loop() { digitalWrite(13, HIGH); delay(1000); digitalWrite(13, LOW); delay(1000); }"
        },
        {
          title: "Upload Your Sketch",
          instructions: "Connect your Arduino to your computer with the USB cable. Click the upload button in the Arduino IDE."
        },
        {
          title: "Watch the Magic",
          instructions: "Your LED should now blink on for one second, then off for one second, in a continuous loop."
        }
      ],
      tips: "Try changing the delay values to make the LED blink faster or slower. This is your first step in understanding how programming affects hardware!"
    }
  },
  {
    title: "Robotics",
    description: "Make your first robot",
    colorLight: "#96CEB4",
    colorDark: "#5A8F7A",
    tutorial: {
      title: "Build a Bristlebot",
      introduction: "A bristlebot is a tiny, simple robot that's perfect for beginners. Using just a toothbrush head, a small motor, and a battery, you can create a robot that skitters across flat surfaces.",
      materials: [
        "Toothbrush head (cut off from handle)",
        "Small vibration motor (like those in cell phones)",
        "Coin cell battery (3V)",
        "Double-sided tape or hot glue",
        "Googly eyes (optional but fun)"
      ],
      steps: [
        {
          title: "Prepare the Toothbrush Head",
          instructions: "Cut the head off a toothbrush, leaving just the bristle portion and a bit of the handle."
        },
        {
          title: "Attach the Motor",
          instructions: "Use double-sided tape or hot glue to secure the vibration motor to the top of the toothbrush head."
        },
        {
          title: "Connect the Battery",
          instructions: "Connect the motor's wires to the battery. The red wire should connect to the positive side, and the black wire to the negative side."
        },
        {
          title: "Secure the Battery",
          instructions: "Attach the battery to the toothbrush head, making sure it doesn't interfere with the motor's movement."
        },
        {
          title: "Test Your Robot",
          instructions: "Place your bristlebot on a smooth surface. The vibration from the motor should cause the bristles to vibrate, making the robot move around randomly."
        }
      ],
      tips: "Try different bristle angles by trimming them for different movement patterns. Experiment with the weight distribution to change how your robot moves."
    }
  },
  {
    title: "3D Printing",
    description: "Design & print objects",
    colorLight: "#FFEEAD",
    colorDark: "#BFAE6A",
    tutorial: {
      title: "Create Your First 3D Printed Object",
      introduction: "3D printing opens up a world of possibilities for creating custom objects. This tutorial will guide you through designing and printing a simple keychain.",
      materials: [
        "Access to a 3D printer (school, library, or online service)",
        "Computer with internet access",
        "USB drive (if printing from a file)"
      ],
      steps: [
        {
          title: "Learn 3D Design Basics",
          instructions: "Create a free account on Tinkercad.com - a beginner-friendly 3D design tool that runs in your browser."
        },
        {
          title: "Start a New Design",
          instructions: "In Tinkercad, start a new project. Drag a basic shape like a cylinder onto the workplane."
        },
        {
          title: "Customize Your Design",
          instructions: "Resize the shape using the corner handles. Add a small cylinder and place it near the edge to create a keychain hole."
        },
        {
          title: "Add Text or Designs",
          instructions: "Use the text tool to add your name or initials. Position it on the surface of your keychain."
        },
        {
          title: "Export Your File",
          instructions: "When you're happy with your design, click 'Export' and save the file as an .STL file."
        },
        {
          title: "Print Your Design",
          instructions: "Take your .STL file to a 3D printer. Use the printer's software to set up the print job, choosing material, quality, and infill settings."
        }
      ],
      tips: "Keep your first design simple - complex designs are harder to print successfully. Most 3D printers use PLA filament, which comes in many colors."
    }
  },
  {
    title: "Wood Projects",
    description: "Simple woodworking",
    colorLight: "#D4A373",
    colorDark: "#8B6A4A",
    tutorial: {
      title: "Build a Simple Wooden Phone Stand",
      introduction: "Woodworking can be accessible even for beginners. This project requires minimal tools and will give you a useful phone stand for your desk.",
      materials: [
        "1 piece of wood (approximately 6\" x 8\" x 3/4\")",
        "Sandpaper (medium and fine grit)",
        "Wood saw (hand saw is fine)",
        "Ruler and pencil",
        "Wood finish or paint (optional)",
        "Safety glasses"
      ],
      steps: [
        {
          title: "Prepare Your Wood",
          instructions: "Start with a piece of wood approximately 6\" x 8\". Sand all surfaces to remove any rough spots."
        },
        {
          title: "Mark Your Cuts",
          instructions: "Draw a line at a 30-degree angle from one corner, creating a triangle that will become your stand."
        },
        {
          title: "Make Your Cut",
          instructions: "Wearing safety glasses, carefully cut along the line you drew. Work slowly and let the saw do the work."
        },
        {
          title: "Create the Phone Slot",
          instructions: "On the larger piece, measure and mark a slot about 1/2\" wide and 1/4\" deep. Cut this slot with multiple saw cuts and clean it with sandpaper."
        },
        {
          title: "Sand All Edges",
          instructions: "Sand all edges to remove splinters and create a smooth finish."
        },
        {
          title: "Finish Your Stand",
          instructions: "Apply wood finish or paint if desired. Allow to dry completely before using."
        }
      ],
      tips: "If you don't have a saw, many hardware stores will make simple cuts for you. Just bring your measurements."
    }
  },
];

export default function TabTwoScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const [loading, setLoading] = useState({ isLoading: false, category: null });
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryPress = (categoryTitle) => {
    console.log("Selected category:", categoryTitle);
    setLoading({ isLoading: true, category: categoryTitle });
    
    // Simulate loading
    setTimeout(() => {
      setLoading({ isLoading: false, category: null });
      setSelectedCategory(categoryTitle);
    }, 800);
  };

  const handleBackPress = () => {
    setSelectedCategory(null);
  };

  // Find the selected category data
  const categoryData = categories.find(cat => cat.title === selectedCategory);

  // Render main explore screen
  if (!selectedCategory) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView style={styles.scrollView}>
          <View style={[styles.header, { backgroundColor: theme.card }]}>
            <ThemedText style={[styles.headerText, { color: theme.text }]}>
              Explore
            </ThemedText>
          </View>
          <View style={styles.grid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.title}
                style={[
                  styles.gridCard,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? category.colorDark : category.colorLight,
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
                    <ThemedText style={styles.cardTitle}>{category.title}</ThemedText>
                    <ThemedText style={styles.cardDescription}>
                      {category.description}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render tutorial view
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.tutorialHeader, { 
          backgroundColor: colorScheme === "dark" 
            ? categoryData.colorDark 
            : categoryData.colorLight 
        }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <ThemedText style={styles.tutorialTitle}>
            {categoryData.tutorial.title}
          </ThemedText>
        </View>

        <View style={styles.tutorialContent}>
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Introduction
            </ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
              {categoryData.tutorial.introduction}
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Materials
            </ThemedText>
            {categoryData.tutorial.materials.map((material, index) => (
              <View key={index} style={styles.materialItem}>
                <View style={[styles.bullet, { 
                  backgroundColor: colorScheme === "dark" 
                    ? categoryData.colorDark 
                    : categoryData.colorLight 
                }]} />
                <ThemedText style={[styles.materialText, { color: theme.textSecondary }]}>
                  {material}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Steps
            </ThemedText>
            {categoryData.tutorial.steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={[styles.stepNumber, { 
                  backgroundColor: colorScheme === "dark" 
                    ? categoryData.colorDark 
                    : categoryData.colorLight 
                }]}>
                  <ThemedText style={styles.stepNumberText}>{index + 1}</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
                    {step.title}
                  </ThemedText>
                  <ThemedText style={[styles.stepInstructions, { color: theme.textSecondary }]}>
                    {step.instructions}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Pro Tips
            </ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
              {categoryData.tutorial.tips}
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 25,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
  },
  gridCard: {
    width: "46%",
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: "2%",
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
  tutorialHeader: {
    padding: 25,
    paddingTop: 15,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
  },
  tutorialTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    flex: 1,
  },
  tutorialContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
  },
  materialItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  materialText: {
    fontSize: 16,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 4,
  },
  stepNumberText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  stepInstructions: {
    fontSize: 16,
    lineHeight: 22,
  },
});