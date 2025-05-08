import { useState } from "react";
import { View, StyleSheet, Alert, Platform } from "react-native";
import { useBaseUrl } from "@/context/BaseUrlContext";
import { router } from "expo-router";
import Input from "@/components/Input";
import Button from "@/components/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BaseUrlScreen() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setBaseUrl } = useBaseUrl();

  const validateUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  };

  const testUrl = async (url: string) => {
    try {
      // Skip URL testing for web preview
      if (Platform.OS === "web") {
        return true;
      }

      const response = await fetch(`${url}MiddleWare/NewMobileAppLogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: "admin",
          password: "12345",
        }),
      });
      const data = await response.json();
      return data?.isSuccess === true;
    } catch (error) {
      console.error("Test URL error:", error);
      return Platform.OS === "web"; // Allow proceeding on web
    }
  };

  const handleSubmit = async () => {
    if (!url.trim()) {
      Alert.alert("Error", "Please enter a base URL");
      return;
    }

    if (!validateUrl(url.trim())) {
      Alert.alert("Error", "Please enter a valid HTTPS URL");
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await testUrl(url.trim());
      if (!isValid && Platform.OS !== "web") {
        Alert.alert(
          "Error",
          "Could not connect to server. Please check the URL and try again.",
        );
        return;
      }
      await setBaseUrl(url.trim());
      router.replace("/(auth)");
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert(
        "Error",
        Platform.OS === "web"
          ? "URL saved. Proceeding to login."
          : "Failed to save base URL. Please try again.",
      );
      if (Platform.OS === "web") {
        router.replace("/(auth)");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBaseUrl = async () => {
    try {
      await AsyncStorage.removeItem("baseUrl");
      Alert.alert("Success", "Base URL deleted successfully.");
      setUrl("");
    } catch (error) {
      console.error("Error deleting base URL:", error);
      Alert.alert("Error", "Failed to delete base URL. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Input
          label="Base URL"
          placeholder="Enter server URL"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
          error={url && !validateUrl(url) ? "Please enter a valid URL" : ""}
        />
        <Button
          title="Save Base URL"
          onPress={handleSubmit}
          style={styles.button}
          isLoading={isLoading}
        />
        <Button
          title="Delete Existing URL"
          onPress={deleteBaseUrl}
          style={styles.button}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    width: "80%",
  },
  button: {
    marginTop: 20,
  },
});
