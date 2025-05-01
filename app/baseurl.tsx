
import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useBaseUrl } from '@/context/BaseUrlContext';
import { router } from 'expo-router';
import Input from '@/components/Input';
import Button from '@/components/Button';

export default function BaseUrlScreen() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setBaseUrl } = useBaseUrl();

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const testUrl = async (url: string) => {
    try {
      const response = await fetch(`${url}MiddleWare/TestConnection`);
      const data = await response.json();
      return data.isSuccess === true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a base URL');
      return;
    }

    if (!validateUrl(url.trim())) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await testUrl(url.trim());
      if (!isValid) {
        Alert.alert('Error', 'Could not connect to server. Please check the URL and try again.');
        return;
      }

      await setBaseUrl(url.trim());
      router.replace('/(auth)');
    } catch (error) {
      Alert.alert('Error', 'Failed to save base URL. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Input
        label="Base URL"
        placeholder="Enter server URL"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        keyboardType="url"
        error={url && !validateUrl(url) ? 'Please enter a valid URL' : ''}
      />
      <Button 
        title="Save Base URL" 
        onPress={handleSubmit}
        style={styles.button}
        isLoading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  button: {
    marginTop: 20,
  }
});
