import React, { useEffect, useState } from 'react';
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

type LeaderboardEntry = {
  rank: number;
  name: string;
  diy_completed: number;
  days_active: number;
};

export default function DashboardScreen() {
  const [projects, setProjects] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const styles = makeStyles(theme);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all data in parallel
        const [projectsRes, achievementsRes, leaderboardRes] = await Promise.all([
          fetch('http://10.31.23.91:8000/projects'),
          fetch('http://10.31.23.91:8000/achievements'),
          fetch('http://10.31.23.91:8000/leaderboard')
        ]);

        const projectsData = await projectsRes.json();
        const achievementsData = await achievementsRes.json();
        const leaderboardData = await leaderboardRes.json();

        setProjects(projectsData);
        setAchievements(achievementsData);
        setLeaderboardData(leaderboardData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>

        {/* Greeting Section */}
        <View style={styles.section}>
          <Text style={styles.greeting}>Hello User! 👋</Text>
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
          {leaderboardData.map((user) => (
            <View key={user.rank} style={styles.leaderboardRow}>
              <Text style={styles.rank}>#{user.rank}</Text>
              <View style={styles.userInfo}>
                <Text style={styles.username}>{user.name}</Text>
                <Text style={styles.stats}>
                  {user.diy_completed} DIYs • {user.days_active} days active
                </Text>
              </View>
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
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    rank: {
      width: 40,
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
    },
    stats: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    greeting: {
      fontSize: 24,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
    },
  });
