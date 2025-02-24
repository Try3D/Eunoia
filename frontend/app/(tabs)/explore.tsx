import { StyleSheet, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const categories = [
  {
    title: "Art & Crafts",
    description: "Paint, draw, and create",
    color: "#FF6B6B",
  },
  {
    title: "Electronics",
    description: "Build simple circuits",
    color: "#4ECDC4",
  },
  {
    title: "Arduino",
    description: "Learn programming & hardware",
    color: "#45B7D1",
  },
  {
    title: "Robotics",
    description: "Make your first robot",
    color: "#96CEB4",
  },
  {
    title: "3D Printing",
    description: "Design & print objects",
    color: "#FFEEAD",
  },
  {
    title: "Wood Projects",
    description: "Simple woodworking",
    color: "#D4A373",
  },
];

export default function TabTwoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerText}>Explore DIY Projects</ThemedText>
          <ThemedText style={styles.subHeaderText}>
            Choose a category to begin your creative journey
          </ThemedText>
        </ThemedView>

        <View style={styles.grid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.title}
              style={[styles.card, { backgroundColor: category.color }]}
            >
              <ThemedText style={styles.cardTitle}>{category.title}</ThemedText>
              <ThemedText style={styles.cardDescription}>
                {category.description}
              </ThemedText>
            </TouchableOpacity>
          ))}
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
    marginTop: 50,
  },
  header: {
    padding: 20,
    paddingTop: 20, // Reduced from 60 to 20
    marginBottom: 10,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    opacity: 0.7,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    gap: 10,
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  responseText: {
    fontSize: 18,
    padding: 16,
  },
  errorText: {
    color: "red",
    padding: 16,
  },
});

