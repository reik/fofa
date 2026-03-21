import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { UPLOADS_BASE } from "../services/api";
import { colors } from "../constants/colors";

const PALETTE = [
  "#3d7a4f",
  "#e9a23b",
  "#2563eb",
  "#9333ea",
  "#db2777",
  "#0891b2",
  "#16a34a",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

interface Props {
  src: string | null | undefined;
  name: string;
  size?: number;
}

export const Avatar: React.FC<Props> = ({ src, name, size = 40 }) => {
  const uri = src
    ? src.startsWith("http")
      ? src
      : `${UPLOADS_BASE}${src}`
    : null;

  console.log("AAA", name.split(" ").slice(0, 2));
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.img,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getColor(name),
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  img: { backgroundColor: colors.border },
  fallback: { alignItems: "center", justifyContent: "center" },
  initials: { color: "#fff", fontWeight: "700" },
});
