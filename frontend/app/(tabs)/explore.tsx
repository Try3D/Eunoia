import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Pressable,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Theme configuration
const colors = {
  light: {
    background: "#f5f5f5",
    card: "#ffffff",
    cardAlt: "#f8f8f8",
    text: "#000000",
    textSecondary: "#666666",
    border: "#eeeeee",
    progressBg: "#eeeeee",
    progressFill: "#4CAF50",
  },
  dark: {
    background: "#121212",
    card: "#1e1e1e",
    cardAlt: "#2a2a2a",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    border: "#333333",
    progressBg: "#333333",
    progressFill: "#4CAF50",
  },
};

// Categories with icons
const categories = [
  { id: "featured", name: "Featured", icon: "star" },
  { id: "new", name: "New", icon: "sparkles" },
  { id: "trending", name: "Trending", icon: "trending-up" },
  { id: "popular", name: "Popular", icon: "flame" },
];

// Skills/topics
const skills = [
  "Photography",
  "Editing",
  "Lighting",
  "Composition",
  "Portrait",
  "Landscape",
  "Street",
  "Architecture",
];

// Featured projects data
const featuredProjects = [
  {
    id: 1,
    title: "City Streets at Night",
    author: "Sarah Parker",
    image: "/api/placeholder/400/240",
    skills: ["Street", "Lighting"],
    likes: 2456,
    duration: "2 hours",
    level: "Intermediate",
  },
  {
    id: 2,
    title: "Mountain Reflections",
    author: "Mike Ross",
    image: "/api/placeholder/400/240",
    skills: ["Landscape", "Composition"],
    likes: 1890,
    duration: "3 hours",
    level: "Advanced",
  },
];

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];

  const [selectedCategory, setSelectedCategory] = useState("featured");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Explore
          </Text>
          <Pressable style={styles.searchButton}>
            <Ionicons name="search" size={24} color={theme.text} />
          </Pressable>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryButton,
                { backgroundColor: theme.card },
                selectedCategory === category.id && {
                  backgroundColor: theme.accent,
                },
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={18}
                color={selectedCategory === category.id ? "#FFF" : theme.text}
              />
              <Text
                style={[
                  styles.categoryText,
                  {
                    color:
                      selectedCategory === category.id ? "#FFF" : theme.text,
                  },
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Skills Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.skillsContainer}
          contentContainerStyle={styles.skillsContent}
        >
          {skills.map((skill) => (
            <Pressable
              key={skill}
              style={[
                styles.skillChip,
                { backgroundColor: theme.tag },
                selectedSkills.includes(skill) && {
                  backgroundColor: theme.accentLight,
                },
              ]}
              onPress={() => toggleSkill(skill)}
            >
              <Text
                style={[
                  styles.skillText,
                  { color: theme.textSecondary },
                  selectedSkills.includes(skill) && { color: theme.accent },
                ]}
              >
                {skill}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Projects Grid */}
        <View style={styles.projectsContainer}>
          {featuredProjects.map((project) => (
            <Pressable
              key={project.id}
              style={[styles.projectCard, { backgroundColor: theme.card }]}
            >
              <Image
                source={{ uri: project.image }}
                style={styles.projectImage}
              />
              <View style={styles.projectContent}>
                <Text style={[styles.projectTitle, { color: theme.text }]}>
                  {project.title}
                </Text>
                <Text
                  style={[styles.projectAuthor, { color: theme.textSecondary }]}
                >
                  by {project.author}
                </Text>

                <View style={styles.projectMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="time"
                      size={14}
                      color={theme.textSecondary}
                    />
                    <Text
                      style={[styles.metaText, { color: theme.textSecondary }]}
                    >
                      {project.duration}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="trending-up"
                      size={14}
                      color={theme.textSecondary}
                    />
                    <Text
                      style={[styles.metaText, { color: theme.textSecondary }]}
                    >
                      {project.level}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="heart"
                      size={14}
                      color={theme.textSecondary}
                    />
                    <Text
                      style={[styles.metaText, { color: theme.textSecondary }]}
                    >
                      {project.likes.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.skillTags}>
                  {project.skills.map((skill) => (
                    <View
                      key={skill}
                      style={[styles.skillTag, { backgroundColor: theme.tag }]}
                    >
                      <Text
                        style={[
                          styles.skillTagText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {skill}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  searchButton: {
    padding: 8,
  },
  categoriesContainer: {
    marginVertical: 8,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: "500",
  },
  skillsContainer: {
    marginBottom: 16,
  },
  skillsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  skillChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  skillText: {
    fontSize: 14,
    fontWeight: "500",
  },
  projectsContainer: {
    padding: 16,
    gap: 16,
  },
  projectCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  projectImage: {
    width: "100%",
    height: 240,
  },
  projectContent: {
    padding: 16,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  projectAuthor: {
    fontSize: 14,
    marginBottom: 12,
  },
  projectMeta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  skillTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillTagText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
