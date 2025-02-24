import React from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Color schemes
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

// Mock data remains the same as before
const projects = [
  { id: 1, title: "Mountain Landscape", progress: 75, dueDate: "2025-03-01" },
  { id: 2, title: "City Streets", progress: 30, dueDate: "2025-03-15" },
  { id: 3, title: "Portrait Series", progress: 90, dueDate: "2025-02-28" },
];

const achievements = [
  {
    id: 1,
    title: "First Upload",
    icon: "🎯",
    description: "Posted your first project",
  },
  {
    id: 2,
    title: "Rising Star",
    icon: "⭐",
    description: "100 likes received",
  },
  {
    id: 3,
    title: "Community Leader",
    icon: "👑",
    description: "Top contributor this week",
  },
];

const leaderboard = [
  {
    id: 1,
    username: "PhotoPro",
    points: 2500,
    avatar: "/api/placeholder/32/32",
  },
  {
    id: 2,
    username: "LightMaster",
    points: 2300,
    avatar: "/api/placeholder/32/32",
  },
  {
    id: 3,
    username: "FrameArtist",
    points: 2100,
    avatar: "/api/placeholder/32/32",
  },
];

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>

        {/* Ongoing Projects Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ongoing Projects</Text>
          {projects.map((project) => (
            <View key={project.id} style={styles.projectCard}>
              <View style={styles.projectHeader}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <Text style={styles.projectDue}>Due: {project.dueDate}</Text>
              </View>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${project.progress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {project.progress}% Complete
              </Text>
            </View>
          ))}
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDesc}>
                  {achievement.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Leaderboard Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          {leaderboard.map((user, index) => (
            <View key={user.id} style={styles.leaderboardRow}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.points}>{user.points}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
      padding: 20,
      backgroundColor: theme.card,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
    },
    section: {
      margin: 16,
      padding: 16,
      backgroundColor: theme.card,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 16,
      color: theme.text,
    },
    projectCard: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: theme.cardAlt,
      borderRadius: 8,
    },
    projectHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    projectTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: theme.text,
    },
    projectDue: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    progressContainer: {
      height: 8,
      backgroundColor: theme.progressBg,
      borderRadius: 4,
      marginVertical: 8,
    },
    progressBar: {
      height: "100%",
      backgroundColor: theme.progressFill,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: "right",
    },
    achievementsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    achievementCard: {
      width: "30%",
      alignItems: "center",
      padding: 12,
      marginBottom: 16,
      backgroundColor: theme.cardAlt,
      borderRadius: 8,
    },
    achievementIcon: {
      fontSize: 32,
      marginBottom: 8,
    },
    achievementTitle: {
      fontSize: 14,
      fontWeight: "500",
      textAlign: "center",
      marginBottom: 4,
      color: theme.text,
    },
    achievementDesc: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: "center",
    },
    leaderboardRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    rank: {
      width: 40,
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
    },
    username: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
    },
    points: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.progressFill,
    },
  });
