import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            height: 88,
            paddingBottom: 28,
          },
          android: {
            height: 64,
          },
          default: {
            height: 64,
          },
        }),
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarLabelStyle: {
          marginBottom: Platform.OS === "ios" ? 0 : 8,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <Ionicons name="paper-plane" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "New Project",
          tabBarIcon: ({ color }) => (
            <Ionicons name="camera" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="information"
        options={{
          title: "Information",
          tabBarIcon: ({ color }) => (
            <Ionicons name="information-circle" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="debug"
        options={{
          title: "Debug",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bug" size={24} color={color} />
          ),
        }}
      /> */}
    </Tabs>
  );
}
