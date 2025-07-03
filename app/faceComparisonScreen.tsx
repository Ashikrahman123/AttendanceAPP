import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Image,
  Alert,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { StatusBar } from "expo-status-bar";
import { X } from "lucide-react-native";

function FaceComparisonScreen() {
  const colors = useColors();
  const [img1, setImg1] = React.useState<{ uri: string } | null>(null);
  const [img2, setImg2] = React.useState<{ uri: string } | null>(null);
  const [similarity, setSimilarity] = React.useState("Select two images to compare");
  const [isLoading, setIsLoading] = React.useState(false);

  const pickImage = async (isFirst: boolean) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      if (isFirst) {
        setImg1({ uri: imageUri });
      } else {
        setImg2({ uri: imageUri });
      }
    }
  };

  const compareFaces = async () => {
    if (!img1 || !img2) {
      Alert.alert('Missing Images', 'Please select two images to compare');
      return;
    }

    setIsLoading(true);
    setSimilarity("Processing...");

    try {
      // Simulate face comparison since we can't use the Face SDK in Expo Go
      // In a production app, you would send these images to a backend service
      // that can perform actual face comparison using ML models
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
      
      // Generate a mock similarity score for demonstration
      const mockSimilarity = Math.floor(Math.random() * 100);
      setSimilarity(`${mockSimilarity}% similarity`);
      
      Alert.alert(
        'Comparison Complete',
        `The images show ${mockSimilarity}% similarity. Note: This is a demo implementation. For production use, integrate with a real face comparison service.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error comparing faces:', error);
      setSimilarity("Error occurred during comparison");
      Alert.alert('Error', 'Failed to compare faces. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.cardAlt }]}
          onPress={() => router.back()}
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Face Comparison
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select two images to compare their facial similarity
        </Text>

        <View style={styles.imagesContainer}>
          {/* Image 1 */}
          <View style={styles.imageSection}>
            <Text style={[styles.imageLabel, { color: colors.text }]}>
              First Image
            </Text>
            <TouchableOpacity
              style={[styles.imageContainer, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => pickImage(true)}
            >
              {img1 ? (
                <Image source={img1} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                    Tap to select
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* VS Divider */}
          <View style={styles.vsContainer}>
            <Text style={[styles.vsText, { color: colors.primary }]}>VS</Text>
          </View>

          {/* Image 2 */}
          <View style={styles.imageSection}>
            <Text style={[styles.imageLabel, { color: colors.text }]}>
              Second Image
            </Text>
            <TouchableOpacity
              style={[styles.imageContainer, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => pickImage(false)}
            >
              {img2 ? (
                <Image source={img2} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                    Tap to select
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Compare Button */}
        <TouchableOpacity
          style={[
            styles.compareButton,
            {
              backgroundColor: img1 && img2 ? colors.primary : colors.border,
              opacity: isLoading ? 0.7 : 1,
            }
          ]}
          onPress={compareFaces}
          disabled={!img1 || !img2 || isLoading}
        >
          <Text style={[styles.compareButtonText, { color: '#FFFFFF' }]}>
            {isLoading ? 'Comparing...' : 'Compare Faces'}
          </Text>
        </TouchableOpacity>

        {/* Result */}
        <View style={[styles.resultContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
            Result:
          </Text>
          <Text style={[styles.resultText, { color: colors.text }]}>
            {similarity}
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={[styles.disclaimerContainer, { backgroundColor: colors.cardAlt }]}>
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            Note: This is a demonstration. In production, this would use a real face comparison API service for accurate results.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  imageSection: {
    flex: 1,
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  placeholderText: {
    fontSize: 12,
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  compareButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  resultLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimerContainer: {
    padding: 16,
    borderRadius: 8,
    marginTop: 'auto',
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default FaceComparisonScreen;
